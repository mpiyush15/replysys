import axios from 'axios';
import { Request, Response } from 'express';
import PhoneNumber from '../models/PhoneNumber';
import Account from '../models/Account';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import Contact from '../models/Contact';

/**
 * Fetch phone numbers from Meta API and create PhoneNumber entries
 * Called after OAuth webhook is received with WABA ID
 */
const fetchAndCreatePhoneNumbers = async (
  wabaId: string,
  accountId: string,
  accessToken: string
) => {
  try {
    console.log('\n📱 ========== FETCHING PHONE NUMBERS FROM META ==========');
    console.log('WABA ID:', wabaId);
    console.log('Account ID:', accountId);
    console.log('Access Token:', accessToken ? '✅ Present' : '❌ Missing');

    if (!accessToken) {
      console.warn('⚠️ No access token available - cannot fetch phone numbers');
      return false;
    }

    if (!wabaId) {
      console.warn('⚠️ No WABA ID available - cannot fetch phone numbers');
      return false;
    }

    // Fetch phone numbers from Meta's /me/phone_numbers endpoint
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${wabaId}/phone_numbers`,
      {
        params: {
          access_token: accessToken,
          fields:
            'id,phone_number,quality_rating,name_status,display_phone_number'
        }
      }
    );

    const phones = response.data?.data || [];
    console.log(`✅ Fetched ${phones.length} phone number(s) from Meta`);

    if (phones.length === 0) {
      console.warn('⚠️ No phone numbers found in Meta for WABA:', wabaId);
      return false;
    }

    // Create PhoneNumber entries for each phone
    const createdPhones = [];
    for (const phone of phones) {
      try {
        const phoneNumberId = phone.id;

        console.log(`\n  📱 Processing phone: ${phone.display_phone_number || phone.id}`);

        // Check if phone already exists for this account
        const existing = await PhoneNumber.findOne({
          accountId,
          phoneNumberId
        });

        if (existing) {
          console.log(`     ⚠️ Phone already exists in DB, skipping creation`);
          createdPhones.push(existing);
          continue;
        }

        // Create new PhoneNumber entry
        const phoneNumber: any = await PhoneNumber.create({
          accountId,
          phoneNumberId,
          wabaId,
          accessToken,
          displayPhoneNumber: phone.display_phone_number || phoneNumberId,
          displayName: phone.name || 'WhatsApp Business',
          qualityRating: (phone.quality_rating || 'unknown').toLowerCase(),
          verifiedName: phone.name_status || 'Not verified',
          isVerified: createdPhones.length === 0, // First phone is verified by default
          verifiedAt: new Date()
        });

        console.log(`     ✅ Phone number created: ${phoneNumber._id}`);
        createdPhones.push(phoneNumber);
      } catch (phoneError: any) {
        console.error(`     ❌ Error creating phone number:`, phoneError.message);
        continue;
      }
    }

    console.log(`\n✅ Successfully created ${createdPhones.length} phone number entries`);
    console.log('📱 ========== PHONE NUMBER FETCH COMPLETE ==========\n');

    return createdPhones.length > 0;
  } catch (error: any) {
    console.error('❌ Error fetching phone numbers from Meta:', error.message);
    if (error.response?.data) {
      console.error('   Meta API Error:', error.response.data);
    }
    return false;
  }
};

/**
 * GET /api/webhooks/whatsapp - Webhook Verification
 * Meta calls this to verify your webhook endpoint
 */
export const verifyWebhook = (req: Request, res: Response) => {
  console.log('\n🔐 ========== WEBHOOK VERIFICATION ==========');

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

  if (!VERIFY_TOKEN) {
    console.error('❌ CRITICAL: META_VERIFY_TOKEN not set in environment variables');
    return res.status(500).json({
      success: false,
      message: 'Server configuration error: META_VERIFY_TOKEN not set'
    });
  }

  console.log('Mode:', mode);
  console.log('Received Token:', token ? '✅ Present' : '❌ Missing');
  console.log('Expected Token:', VERIFY_TOKEN ? '✅ Configured' : '❌ NOT SET');
  console.log('Challenge:', challenge ? '✅ Present' : '❌ Missing');
  console.log('Match:', token === VERIFY_TOKEN ? '✅ YES' : '❌ NO');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook verified successfully!');
    console.log('Responding with challenge:', challenge);
    console.log('==========================================\n');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification FAILED!');
    console.log('Responding with 403 Forbidden');
    console.log('==========================================\n');
    return res.sendStatus(403);
  }
};

/**
 * POST /api/webhooks/whatsapp - Webhook Handler
 * Receives incoming messages, status updates, and OAuth WABA ID from Meta
 *
 * ✅ SECURITY: All requests validated by:
 *    1. X-Hub-Signature-256 HMAC validation (validateWebhookSignature middleware)
 *    2. Hub verify token check (GET request verification)
 */
export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const body = req.body;

    // Acknowledge receipt immediately (CRITICAL for Meta)
    res.sendStatus(200);

    // Return early if not a whatsapp_business_account object
    if (body.object !== 'whatsapp_business_account') {
      console.log('⚠️ Webhook received for non-WhatsApp object:', body.object);
      return;
    }

    // Process webhook data asynchronously
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        const wabaId = entry.id; // WABA ID is in entry.id

        for (const change of entry.changes) {
          // ========== HANDLE OAUTH/WEBHOOK WITH WABA ID ==========
          if (change.field === 'account') {
            const value = change.value;

            console.log('\n🔐 ========== OAUTH WEBHOOK RECEIVED ==========');
            console.log('WABA ID:', wabaId);
            console.log('Field:', change.field);
            console.log('Value:', JSON.stringify(value, null, 2));

            // Find account by metaSync.accountId (stored during OAuth)
            let account = await Account.findOne({
              'metaSync.accountId': value?.accountId || value?.id
            });

            if (!account) {
              // Fallback: find by WABA ID if it already exists
              account = await Account.findOne({ wabaId });
            }

            if (account) {
              console.log('✅ Found matching account:', account.accountId);

              // Get the OAuth token from Account.metaSync
              const oauthAccessToken = account.metaSync?.oauthAccessToken;

              if (!oauthAccessToken) {
                console.error('❌ CRITICAL: OAuth token not found in Account.metaSync');
                console.error('   Cannot fetch phone numbers without token');
                continue;
              }

              // Update Account with WABA ID
              const updatedAccount = await Account.findByIdAndUpdate(
                account._id,
                {
                  wabaId,
                  businessId: value?.business_id || value?.businessId,
                  'metaSync.status': 'synced',
                  'metaSync.oauth_timestamp': new Date()
                },
                { new: true }
              );

              console.log('✅ Updated Account with WABA ID:', wabaId);

              // Fetch phone numbers using the stored OAuth token
              const phonesFetched = await fetchAndCreatePhoneNumbers(
                wabaId,
                String(account.accountId),
                oauthAccessToken
              );

              if (phonesFetched) {
                console.log('✅ OAuth webhook processing COMPLETE');
              } else {
                console.warn('⚠️ Phone number fetch failed but continuing');
              }
            } else {
              console.warn(
                '⚠️ No matching account found for WABA ID:',
                wabaId
              );
              console.warn('   Account creation may be needed');
            }

            console.log('==========================================\n');
          }

          // ========== HANDLE MESSAGE STATUS UPDATES ==========
          if (change.field === 'messages') {
            const value = change.value;

            // Find account by WABA ID
            const account = await Account.findOne({ wabaId });

            if (!account) {
              console.warn('⚠️ No account found for WABA ID:', wabaId);
              continue;
            }

            const accountId = String(account.accountId);

            // ========== HANDLE STATUS UPDATES ==========
            if (value.statuses) {
              console.log('\n📨 ========== STATUS UPDATES ==========');
              for (const statusUpdate of value.statuses) {
                console.log('Status Update:', {
                  messageId: statusUpdate.id,
                  status: statusUpdate.status,
                  timestamp: statusUpdate.timestamp,
                  errors: statusUpdate.errors
                });

                // Update message status in database
                try {
                  await Message.findOneAndUpdate(
                    { waMessageId: statusUpdate.id, accountId },
                    {
                      status: statusUpdate.status,
                      updatedAt: new Date(statusUpdate.timestamp * 1000)
                    }
                  );
                  console.log('✅ Message status updated:', statusUpdate.status);
                } catch (error: any) {
                  console.error('❌ Error updating message status:', error.message);
                }
              }
              console.log('========================================\n');
            }

            // ========== HANDLE INCOMING MESSAGES ==========
            if (value.messages) {
              console.log('\n📨 ========== INCOMING MESSAGES ==========');
              const phoneNumberId = value.metadata?.phone_number_id;

              if (!phoneNumberId) {
                console.warn('⚠️ No phone_number_id in webhook metadata');
                continue;
              }

              for (const message of value.messages) {
                try {
                  console.log('📨 Processing message:', {
                    id: message.id,
                    type: message.type,
                    from: message.from,
                    timestamp: message.timestamp
                  });

                  // Get sender's name (if available)
                  const senderName = value.contacts?.[0]?.profile?.name || 'Unknown';

                  // Extract message content
                  let content = '';
                  let messageType = message.type;

                  if (message.type === 'text') {
                    content = message.text.body;
                  } else if (message.type === 'image') {
                    content = `[Image] ${message.image.caption || 'No caption'}`;
                  } else if (message.type === 'document') {
                    content = `[Document] ${message.document.filename}`;
                  } else if (message.type === 'audio') {
                    content = '[Audio message]';
                  } else if (message.type === 'video') {
                    content = `[Video] ${message.video.caption || 'No caption'}`;
                  }

                  // Find or create contact
                  let contact = await Contact.findOne({
                    accountId,
                    phone: message.from
                  });

                  if (!contact) {
                    contact = await Contact.create({
                      accountId,
                      phone: message.from,
                      name: senderName,
                      status: 'active'
                    });
                    console.log('✅ Created new contact:', contact._id);
                  }

                  // Find or create conversation
                  let conversation = await Conversation.findOne({
                    accountId,
                    contactId: contact._id
                  });

                  if (!conversation) {
                    conversation = await Conversation.create({
                      accountId,
                      contactId: contact._id,
                      contactName: senderName,
                      contactPhone: message.from,
                      lastMessage: content,
                      status: 'active'
                    });
                    console.log('✅ Created new conversation:', conversation._id);
                  } else {
                    // Update conversation
                    await Conversation.findByIdAndUpdate(conversation._id, {
                      lastMessage: content,
                      lastMessageAt: new Date(message.timestamp * 1000),
                      unreadCount: (conversation.unreadCount || 0) + 1
                    });
                  }

                  // Create message record
                  const newMessage = await Message.create({
                    accountId,
                    conversationId: conversation._id,
                    contactId: contact._id,
                    waMessageId: message.id,
                    content: content,
                    messageType: messageType,
                    direction: 'inbound',
                    status: 'received',
                    senderPhone: message.from,
                    senderName: senderName,
                    createdAt: new Date(message.timestamp * 1000)
                  });

                  console.log('✅ Message saved:', newMessage._id);
                } catch (error: any) {
                  console.error('❌ Error processing message:', error.message);
                }
              }
              console.log('========================================\n');
            }
          }
        }
      }
    }
  } catch (error: any) {
    console.error('❌ Webhook handler error:', error.message);
    // Already sent 200 above, so just log
  }
};

export default {
  verifyWebhook,
  handleWebhook
};

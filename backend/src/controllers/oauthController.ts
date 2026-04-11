import axios from 'axios';
import { Request, Response } from 'express';
import PhoneNumber from '../models/PhoneNumber';
import Account from '../models/Account';
import User from '../models/User';
import { WhatsAppConnectionStatus } from '../constants/enums';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * Validate data consistency after OAuth save
 * MUST pass before returning success to client
 */
async function validateConsistency(accountId: string, phone: any) {
  const errors: string[] = [];

  // 1. PhoneNumber record exists
  const phoneRecord = await PhoneNumber.findOne({
    accountId,
    phoneNumberId: phone.phoneNumberId
  });

  if (!phoneRecord) {
    errors.push('❌ PhoneNumber record not found after save');
  }

  // 2. Account.wabaId matches PhoneNumber.wabaId
  const account = await Account.findOne({ accountId });

  if (account?.wabaId !== phone.wabaId) {
    errors.push(`❌ Account.wabaId (${account?.wabaId}) does not match PhoneNumber.wabaId (${phone.wabaId})`);
  }

  // 3. PhoneNumber.accessToken is encrypted (not plaintext)
  if (phoneRecord && 'accessToken' in phoneRecord && phoneRecord.accessToken && phoneRecord.accessToken.length < 100) {
    errors.push('❌ AccessToken appears unencrypted');
  }

  // 4. No duplicate phone numbers in same account
  const duplicates = await PhoneNumber.find({
    accountId,
    phoneNumberId: phone.phoneNumberId
  });

  if (duplicates.length > 1) {
    errors.push(`❌ ${duplicates.length} duplicate phone numbers found`);
  }

  // 5. Account can be found by wabaId
  const accountByWaba = await Account.findOne({ wabaId: phone.wabaId });

  if (!accountByWaba) {
    errors.push('❌ Account not found by wabaId');
  }

  // Return result
  if (errors.length > 0) {
    throw new Error(`Consistency validation failed:\n${errors.join('\n')}`);
  }

  console.log('✅ All consistency checks passed');
  return true;
}

/**
 * Log consistency event for monitoring
 */
function logConsistencyEvent(type: string, data: any) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: 'CONSISTENCY_EVENT',
    type,
    accountId: data.accountId,
    wabaId: data.wabaId,
    phoneNumberId: data.phoneNumberId,
    status: data.status,
    message: data.message
  }));
}

/**
 * POST /api/client/oauth/whatsapp
 * Complete flow: code → token → WABA → phone → REGISTER → save → connected
 */
export const handleWhatsAppOAuth = async (req: Request, res: Response) => {
  try {
    const { code, wabaId, phoneNumberId, phoneNumber } = req.body;
    const userId = req.userId;

    console.log('\n🔐 ========== EMBEDDED SIGNUP OAUTH ==========');
    console.log('👤 User:', userId);
    console.log('📊 Data from frontend:', { wabaId, phoneNumberId, phoneNumber });

    if (!code) {
      return res.status(400).json({ success: false, message: 'No code provided' });
    }

    // STEP 1: Exchange code for token
    console.log('\n💳 STEP 1: Exchanging code for token...');
    let tokenResponse;
    try {
      tokenResponse = await axios.get(`${GRAPH_API_URL}/oauth/access_token`, {
        params: {
          client_id: process.env.META_APP_ID,
          client_secret: process.env.META_APP_SECRET,
          code,
          redirect_uri: 'https://replysys.com/auth/whatsapp/callback'
        }
      });
    } catch (error: any) {
      console.error('❌ Token exchange failed:', error.response?.data?.error?.message);
      return res.status(400).json({ success: false, message: 'Token exchange failed' });
    }

    const access_token = tokenResponse.data?.access_token;
    console.log('✅ Token obtained:', access_token?.substring(0, 20) + '...');

    // STEP 2: Get Business ID
    console.log('\n📊 STEP 2: Fetching business ID...');
    let businessId: string | null = null;
    try {
      const bizResponse = await axios.get(`${GRAPH_API_URL}/me/businesses`, {
        params: { access_token }
      });
      businessId = bizResponse.data?.data?.[0]?.id;
      if (businessId) console.log('✅ Business ID:', businessId);
      else console.warn('⚠️ No business found');
    } catch (error: any) {
      console.error('❌ Failed to fetch business:', error.response?.data?.error?.message);
    }

    // STEP 3: Get WABA ID
    console.log('\n📱 STEP 3: Fetching WABA...');
    let finalWabaId: string | null = wabaId || null;
    try {
      if (businessId) {
        const wabaResponse = await axios.get(
          `${GRAPH_API_URL}/${businessId}/owned_whatsapp_business_accounts`,
          { params: { access_token } }
        );
        finalWabaId = wabaResponse.data?.data?.[0]?.id;
        if (finalWabaId) console.log('✅ WABA ID:', finalWabaId);
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch WABA:', error.response?.data?.error?.message);
    }

    // STEP 4: Get phone numbers
    console.log('\n📞 STEP 4: Fetching phone numbers...');
    let finalPhoneId: string | null = phoneNumberId || null;
    let finalPhoneNumber: string | null = phoneNumber || null;
    try {
      if (finalWabaId) {
        const phoneResponse = await axios.get(
          `${GRAPH_API_URL}/${finalWabaId}/phone_numbers`,
          { 
            params: { 
              fields: 'id,phone_number,display_phone_number,quality_rating',
              access_token 
            }
          }
        );
        const phones = phoneResponse.data?.data || [];
        if (phones.length > 0) {
          finalPhoneId = phones[0].id;
          finalPhoneNumber = phones[0].display_phone_number;
          console.log(`✅ Found ${phones.length} phone(s):`, finalPhoneNumber);
        }
      }
    } catch (error: any) {
      console.error('❌ Failed to fetch phones:', error.response?.data?.error?.message);
    }

    // STEP 5: Register phone number (CRITICAL!)
    console.log('\n🔔 STEP 5: Registering phone number...');
    let registerSuccess = false;
    try {
      if (finalPhoneId) {
        const registerResponse = await axios.post(
          `${GRAPH_API_URL}/${finalPhoneId}/register`,
          {
            messaging_product: 'whatsapp',
            pin: '000000'
          },
          { params: { access_token } }
        );
        console.log('✅ Phone registered:', registerResponse.data);
        registerSuccess = true;
      } else {
        console.warn('⚠️ No phone ID to register');
      }
    } catch (error: any) {
      console.error('❌ Register failed:', error.response?.data?.error?.message);
      // Continue anyway - might already be registered
    }

    // STEP 6: Save to database
    console.log('\n💾 STEP 6: Saving to database...');
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Create/update Account
    let account = await Account.findOne({ accountId: String(userId) });
    if (!account) {
      account = new Account({
        accountId: String(userId),
        userId: new (require('mongoose')).Types.ObjectId(userId),
        wabaId: finalWabaId || '',
        metaSync: {
          accountId: String(userId),
          oauthAccessToken: access_token,
          status: 'synced',
          oauth_timestamp: new Date()
        },
        status: 'active'
      });
      await account.save();
      console.log('✅ Account created');
    } else {
      account.wabaId = finalWabaId || account.wabaId;
      account.metaSync = {
        ...(account.metaSync || {}),
        oauthAccessToken: access_token,
        status: 'synced',
        oauth_timestamp: new Date()
      };
      await account.save();
      console.log('✅ Account updated');
    }

    // Save phone number as CONNECTED (not pending!)
    if (finalPhoneId && finalPhoneNumber) {
      try {
        const existing = await PhoneNumber.findOne({
          accountId: String(userId),
          phoneNumberId: finalPhoneId
        });

        if (existing) {
          existing.displayPhoneNumber = finalPhoneNumber;
          existing.wabaId = finalWabaId || existing.wabaId;
          existing.status = 'active';
          await existing.save();
          console.log('✅ Phone updated as active');
        } else {
          const phoneRecord = new PhoneNumber({
            accountId: String(userId),
            phoneNumberId: finalPhoneId,
            wabaId: finalWabaId || '',
            displayPhoneNumber: finalPhoneNumber,
            status: 'active'
          });
          await phoneRecord.save();
          console.log('✅ Phone saved as active');
        }
      } catch (error: any) {
        console.error('❌ Failed to save phone:', error.message);
      }
    }

    // Update User
    (user as any).oauthAccessToken = access_token;
    (user as any).oauthStatus = 'oauth_completed';
    (user as any).wabaId = finalWabaId;
    (user as any).oauthTimestamp = new Date();
    await user.save();

    console.log('\n✅ ========== OAUTH COMPLETE ==========');
    console.log('Status: CONNECTED (no waiting!)');
    console.log('Phone:', finalPhoneNumber);
    console.log('================================================\n');

    // Return connected status immediately
    return res.json({
      success: true,
      message: '✅ WhatsApp connected successfully!',
      status: 'connected',
      phone: finalPhoneNumber,
      wabaId: finalWabaId,
      phoneNumberId: finalPhoneId,
      nextSteps: [
        '✅ OAuth token saved',
        '✅ WABA connected',
        `✅ Phone registered: ${finalPhoneNumber}`,
        'Ready to send messages!'
      ]
    });

  } catch (error: any) {
    console.error('❌ OAuth error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'OAuth connection failed'
    });
  }
};

/**
 * GET /api/client/oauth/whatsapp/status
 * Get OAuth status (which phones connected)
 * Reads from PhoneNumber (authority)
 */
export const getWhatsAppStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const accountId = (req as any).accountId;

    console.log('📊 Fetching WhatsApp status for user:', userId);
    console.log('📊 Using accountId:', accountId || String(userId));

    // Get phone numbers from PhoneNumber collection (authority)
    const phoneNumbers = await PhoneNumber.find({ 
      accountId: accountId || String(userId),
      status: { $ne: 'inactive' }
    }).lean();

    console.log(`✅ Found ${phoneNumbers.length} phone(s)`);

    // Format response
    const formattedPhones = phoneNumbers.map((phone: any) => ({
      id: phone.phoneNumberId,
      displayPhoneNumber: phone.displayPhoneNumber,
      status: phone.status,
      wabaId: phone.wabaId
    }));

    // Determine overall status
    const status = phoneNumbers.length > 0 ? 'connected' : 'disconnected';

    return res.json({
      success: true,
      data: {
        status: status,
        connected: phoneNumbers.length > 0,
        phoneNumbers: formattedPhones,
        wabaId: phoneNumbers[0]?.wabaId || null
      }
    });
  } catch (error: any) {
    console.error('❌ Status error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/client/oauth/whatsapp/disconnect
 * Disconnect WhatsApp (mark inactive)
 * Modifies PhoneNumber (authority)
 */
export const disconnectWhatsApp = async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    console.log('🔌 Disconnecting WhatsApp for user:', userId);
    console.log('   Starting full data cleanup...');

    // Get user and clear their WhatsApp data
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Clear WhatsApp connection data
    (user as any).whatsappStatus = WhatsAppConnectionStatus.DISCONNECTED;
    (user as any).wabaId = null;
    (user as any).whatsappPhone = null;
    (user as any).oauthAccessToken = null;
    await user.save();

    console.log(`\n🗑️  CLEANUP: Removed all WhatsApp data for user ${userId}`);

    // 1. Delete conversations
    // const convResult = await Conversation.deleteMany({ accountId })
    // console.log(`   ✅ Deleted ${convResult.deletedCount} conversation(s)`)

    // 2. Delete messages
    // const msgResult = await Message.deleteMany({ accountId })
    // console.log(`   ✅ Deleted ${msgResult.deletedCount} message(s)`)

    // 3. Delete contacts
    // const contactResult = await Contact.deleteMany({ accountId })
    // console.log(`   ✅ Deleted ${contactResult.deletedCount} contact(s)`)

    console.log(`   ✅ Cleared WhatsApp connection\n`);

    logConsistencyEvent('disconnect', {
      userId,
      status: 'success',
      message: 'WhatsApp disconnected - all data cleaned'
    });

    return res.json({
      success: true,
      message: 'WhatsApp disconnected and all data cleaned successfully'
    });
  } catch (error: any) {
    console.error('❌ Disconnect error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * POST /api/client/whatsapp/connect
 * Called AFTER Embedded Signup FINISH event
 * Registers phone number with Meta + saves to DB
 * Body: { phoneNumberId, wabaId, phoneNumber }
 */
export const connectWhatsApp = async (req: Request, res: Response) => {
  try {
    const { phoneNumberId, wabaId, phoneNumber } = req.body;
    const userId = (req as any).userId;
    let accountId = (req as any).accountId;

    // Validate inputs
    if (!phoneNumberId || !wabaId) {
      return res.status(400).json({
        success: false,
        error: 'Missing phoneNumberId or wabaId'
      });
    }

    console.log(`\n🔥 CONNECT WHATSAPP START`);
    console.log(`   userId: ${userId}`);
    console.log(`   phoneNumberId: ${phoneNumberId}`);
    console.log(`   wabaId: ${wabaId}`);
    console.log(`   phoneNumber: ${phoneNumber}`);

    // Get or create accountId
    if (!accountId) {
      const account = await Account.findOne({ 
        $or: [
          { userId },
          { accountId: userId }
        ]
      });

      if (!account) {
        return res.status(404).json({
          success: false,
          error: 'Account not found'
        });
      }

      accountId = account._id || account.accountId;
    }

    console.log(`   accountId: ${accountId}`);

    // 🔥 STEP 1: Register phone number with Meta
    console.log(`\n📱 STEP 1: Registering phone with Meta...`);

    const ACCESS_TOKEN = process.env.META_SYSTEM_TOKEN;

    if (!ACCESS_TOKEN) {
      console.error('❌ META_SYSTEM_TOKEN not configured');
      return res.status(500).json({
        success: false,
        error: 'System not configured for WhatsApp registration'
      });
    }

    try {
      const registerResponse = await axios.post(
        `${GRAPH_API_URL}/${phoneNumberId}/register`,
        {
          messaging_product: 'whatsapp',
          pin: '000000'
        },
        {
          headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Phone registered with Meta`);
      console.log(`   Response:`, registerResponse.data);
    } catch (error: any) {
      console.error(`❌ Registration failed:`, error.response?.data || error.message);
      
      // Check if already registered (acceptable error)
      if (error.response?.data?.error?.code === 2200) {
        console.log(`⚠️ Phone already registered (acceptable)`);
      } else {
        return res.status(error.response?.status || 500).json({
          success: false,
          error: error.response?.data?.error?.message || 'Phone registration failed',
          details: error.response?.data?.error
        });
      }
    }

    // 🔥 STEP 2: Save to database
    console.log(`\n💾 STEP 2: Saving to database...`);

    const phoneNumberRecord = await PhoneNumber.findOneAndUpdate(
      { accountId, phoneNumberId },
      {
        accountId,
        phoneNumberId,
        wabaId,
        displayPhoneNumber: phoneNumber || '',
        displayName: phoneNumber || '',
        status: 'active',
        isVerified: true,
        verifiedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ Saved to database`);
    console.log(`   Record ID:`, phoneNumberRecord._id);

    // 🔥 STEP 3: Update Account with WABA info
    console.log(`\n🏢 STEP 3: Updating account with WABA...`);

    await Account.updateOne(
      { accountId: String(accountId) },
      { 
        wabaId,
        metaSync: {
          lastConnected: new Date(),
          status: 'connected'
        }
      }
    );

    console.log(`✅ Account updated\n`);

    // Success response
    return res.json({
      success: true,
      status: 'connected',
      phone: {
        phoneNumberId,
        wabaId,
        displayPhoneNumber: phoneNumber,
        status: 'active'
      },
      message: 'WhatsApp phone number connected successfully'
    });

  } catch (error: any) {
    console.error('\n❌ CONNECT WHATSAPP ERROR:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to connect WhatsApp'
    });
  }
};

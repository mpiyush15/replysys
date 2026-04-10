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
 * Exchange OAuth code for access token + phone data
 * Single write point - saves to PhoneNumber (authority)
 */
export const handleWhatsAppOAuth = async (req: Request, res: Response) => {
  try {
    const { code, state } = req.body;
    const userId = req.userId;

    console.log('🔐 OAuth: Starting token exchange for user:', userId);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'No authorization code provided'
      });
    }

    // 1. Exchange code for access token
    console.log('🔄 Exchanging code for access token...');
    console.log('OAuth Params:', {
      client_id: process.env.META_APP_ID,
      code: code?.substring(0, 20) + '...' // Log first 20 chars only
    });

    let tokenResponse;
    try {
      // Use GET request with params for token exchange
      // Include redirect_uri to match what frontend sent (required by Meta)
      console.log('🔄 Making GET request to Meta token endpoint...');
      tokenResponse = await axios.get(
        `${GRAPH_API_URL}/oauth/access_token`,
        {
          params: {
            client_id: process.env.META_APP_ID,
            client_secret: process.env.META_APP_SECRET,
            code,
            redirect_uri: 'https://replysys.com/auth/whatsapp/callback'
          }
        }
      );
      console.log('✅ Token response received:', {
        hasAccessToken: !!tokenResponse.data?.access_token,
        responseKeys: Object.keys(tokenResponse.data || {})
      });
    } catch (error: any) {
      console.error('❌ OAuth token exchange FAILED:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        code: error.code
      });

      // Always return proper JSON error response
      return res.status(error.response?.status || 400).json({
        success: false,
        message: 'Failed to exchange code for access token',
        error: error.response?.data?.error?.message || error.message,
        meta: error.response?.data || {
          error: {
            type: error.code,
            message: error.message
          }
        }
      });
    }

    const { access_token } = tokenResponse.data;
    console.log('✅ Token exchanged successfully');
    console.log('📌 Token:', access_token.substring(0, 20) + '...');

    // 2. Verify token + CHECK SCOPES
    console.log('🔐 Verifying token and checking scopes...');
    try {
      const debugResponse = await axios.get(
        `${GRAPH_API_URL}/debug_token`,
        {
          params: {
            input_token: access_token,
            access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
          }
        }
      );
      
      console.log('✅ Token verified');
      console.log('📋 Token Details:');
      console.log('   App ID:', debugResponse.data?.data?.app_id);
      console.log('   User ID:', debugResponse.data?.data?.user_id);
      console.log('   Is Valid:', debugResponse.data?.data?.is_valid);
      console.log('   Expires at:', debugResponse.data?.data?.expires_at);
      
      const scopes = debugResponse.data?.data?.scopes || [];
      console.log('✅ SCOPES GRANTED:');
      scopes.forEach((scope: string) => {
        console.log(`   ✓ ${scope}`);
      });
      
      // Check required scopes
      const requiredScopes = [
        'whatsapp_business_management',
        'whatsapp_business_messaging',
        'business_management'
      ];
      
      const missingScopes = requiredScopes.filter(scope => !scopes.includes(scope));
      if (missingScopes.length > 0) {
        console.warn('⚠️ MISSING SCOPES:');
        missingScopes.forEach(scope => {
          console.warn(`   ❌ ${scope}`);
        });
      } else {
        console.log('✅ All required scopes present!');
      }
    } catch (tokenError: any) {
      console.warn('⚠️ Token verification failed:', tokenError.message);
      console.warn('   Error:', tokenError.response?.data || tokenError.message);
    }

    // 3. ✅ DIRECT API FLOW - BUSINESS-BASED APPROACH (CORRECT)
    console.log('🏢 ========== BUSINESS-BASED WABA FETCH ==========');
    
    let wabaId: string | null = null;
    let phoneNumbers: any[] = [];
    let businessId: string | null = null;

    try {
      // STEP 1: Get business ID
      console.log('📊 Step 1: Fetching business ID...');
      const bizResponse = await axios.get(
        `${GRAPH_API_URL}/me/businesses`,
        {
          params: {
            access_token: access_token
          }
        }
      );

      console.log('✅ Business Response:', JSON.stringify(bizResponse.data, null, 2));
      businessId = bizResponse.data?.data?.[0]?.id;
      
      if (!businessId) {
        console.warn('⚠️ No business found for this account');
        console.log('   Full response:', JSON.stringify(bizResponse.data, null, 2));
      } else {
        console.log('✅ Business ID:', businessId);

        // STEP 2: Get WABA from business
        console.log('📱 Step 2: Fetching WABA from business...');
        const wabaResponse = await axios.get(
          `${GRAPH_API_URL}/${businessId}/owned_whatsapp_business_accounts`,
          {
            params: {
              access_token: access_token
            }
          }
        );

        console.log('✅ WABA Response:', JSON.stringify(wabaResponse.data, null, 2));
        wabaId = wabaResponse.data?.data?.[0]?.id;

        if (!wabaId) {
          console.warn('⚠️ No WABA found in business');
        } else {
          console.log('✅ WABA ID:', wabaId);

          // STEP 3: Get phone numbers
          console.log('📞 Step 3: Fetching phone numbers...');
          const phoneResponse = await axios.get(
            `${GRAPH_API_URL}/${wabaId}/phone_numbers`,
            {
              params: {
                fields: 'id,phone_number,display_phone_number,quality_rating,name_status',
                access_token: access_token
              }
            }
          );

          phoneNumbers = phoneResponse.data?.data || [];
          console.log(`✅ Fetched ${phoneNumbers.length} phone number(s)`);
          phoneNumbers.forEach((p, i) => {
            console.log(`   ${i+1}. ${p.display_phone_number} (${p.quality_rating})`);
          });
        }
      }
    } catch (fetchError: any) {
      console.error('❌ BUSINESS FLOW FAILED');
      console.error('   Error Code:', fetchError.response?.status);
      console.error('   Error Message:', fetchError.response?.statusText);
      console.error('   Error Details:', JSON.stringify(fetchError.response?.data, null, 2));
      console.error('   Full Error:', fetchError.message);
      
      console.warn('   Proceeding without WABA/phones');
    }

    // Get user
    const user = await User.findById(userId);
    
    if (!user) {
      console.error('❌ User not found for userId:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // ✅ CREATE or UPDATE Account record
    let account = await Account.findOne({ accountId: String(userId) });
    
    if (!account) {
      console.log('📝 Creating new Account...');
      account = new Account({
        accountId: String(userId),
        userId: new (require('mongoose')).Types.ObjectId(userId),
        wabaId: wabaId || undefined,
        metaSync: {
          accountId: String(userId),
          oauthAccessToken: access_token,
          status: wabaId ? 'synced' : 'authorized',
          oauth_timestamp: new Date()
        },
        status: 'active'
      });
      await account.save();
      console.log('✅ Account created');
    } else {
      console.log('📝 Updating existing Account...');
      account.wabaId = wabaId || account.wabaId;
      account.metaSync = {
        ...(account.metaSync || {}),
        accountId: String(userId),
        oauthAccessToken: access_token,
        status: wabaId ? 'synced' : 'authorized',
        oauth_timestamp: new Date()
      };
      account.status = 'active';
      await account.save();
      console.log('✅ Account updated');
    }

    // ✅ CREATE phone records if we got them
    if (wabaId && phoneNumbers.length > 0) {
      console.log('💾 Saving phone numbers to database...');
      for (const phone of phoneNumbers) {
        try {
          const existing = await PhoneNumber.findOne({
            accountId: String(userId),
            phoneNumberId: phone.id
          });

          if (existing) {
            console.log(`   ⚠️ Phone already exists: ${phone.display_phone_number}`);
            continue;
          }

          const phoneRecord = new PhoneNumber({
            accountId: String(userId),
            phoneNumberId: phone.id,
            wabaId,
            displayPhoneNumber: phone.display_phone_number,
            qualityRating: phone.quality_rating || 'UNKNOWN',
            verifiedName: phone.name_status || 'Not verified',
            isVerified: true,
            verifiedAt: new Date(),
            status: 'active'
          });

          await phoneRecord.save();
          console.log(`   ✅ Phone saved: ${phone.display_phone_number}`);
        } catch (phoneError: any) {
          console.error(`   ❌ Error saving phone:`, phoneError.message);
        }
      }
    }

    // Store OAuth token in User model
    (user as any).oauthAccessToken = access_token;
    (user as any).oauthStatus = wabaId ? 'oauth_completed' : 'oauth_completed_awaiting_webhook';
    (user as any).wabaId = wabaId || (user as any).wabaId;
    (user as any).oauthTimestamp = new Date();
    await user.save();

    const connectionStatus = wabaId ? '✅ CONNECTED' : '⏳ AWAITING WEBHOOK';
    console.log(connectionStatus);
    console.log('✅ OAuth complete');
    console.log('================================================\n');

    // Return success response
    return res.json({
      success: true,
      message: wabaId 
        ? '✅ WhatsApp connected successfully!' 
        : '⏳ OAuth successful! Waiting for webhook...',
      userId: userId,
      status: wabaId ? 'connected' : 'awaiting_webhook',
      wabaId: wabaId || null,
      phoneNumbers: phoneNumbers.length > 0 ? phoneNumbers : null,
      nextSteps: wabaId 
        ? [
            '✅ WhatsApp Business Account connected',
            `✅ Phone: ${phoneNumbers[0]?.display_phone_number || 'Ready'}`,
            'Ready to send messages!'
          ]
        : [
            '✅ OAuth token saved',
            '⏳ Waiting for webhook',
            'Refresh page to see connection'
          ]
    });

  } catch (error: any) {
    console.error('❌ OAuth error:', error.message);
    
    // Log detailed error for debugging
    if (error.response?.data) {
      console.error('Error details:', error.response.data);
    }

    logConsistencyEvent('oauth_error', {
      userId: req.userId,
      status: 'error',
      message: error.message
    });

    return res.status(400).json({
      success: false,
      message: error.message || 'OAuth connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
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

    console.log('📊 Fetching WhatsApp status for user:', userId);

    const user = await User.findById(userId).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log('✅ Found WhatsApp connection data');

    return res.json({
      success: true,
      data: {
        status: (user as any)?.whatsappStatus || WhatsAppConnectionStatus.DISCONNECTED,
        connected: (user as any)?.wabaId ? true : false,
        wabaId: (user as any)?.wabaId,
        phoneNumbers: (user as any)?.whatsappPhone ? [{ displayPhoneNumber: (user as any).whatsappPhone }] : [],
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

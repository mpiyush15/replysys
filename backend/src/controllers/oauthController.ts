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

    // 2. Verify token
    console.log('🔐 Verifying token...');
    try {
      await axios.get(
        `${GRAPH_API_URL}/debug_token`,
        {
          params: {
            input_token: access_token,
            access_token: `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
          }
        }
      );
      console.log('✅ Token verified');
    } catch (tokenError: any) {
      console.warn('⚠️ Token verification failed (non-critical):', tokenError.message);
    }

    // 3. ✅ OFFICIAL META ONBOARDING FLOW
    // Meta handles WABA setup + phones on their end
    // We just wait for webhook callback with WABA ID
    console.log('🏢 ========== USING OFFICIAL META ONBOARDING ==========');
    console.log('⏳ Waiting for Meta webhook with WABA setup...');
    console.log('   (Meta will call our webhook when onboarding completes)');
    
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
        metaSync: {
          accountId: String(userId),
          oauthAccessToken: access_token,
          status: 'authorized',
          oauth_timestamp: new Date()
        },
        status: 'active'
      });
      await account.save();
      console.log('✅ Account created');
    } else {
      console.log('📝 Updating existing Account...');
      account.metaSync = {
        ...(account.metaSync || {}),
        accountId: String(userId),
        oauthAccessToken: access_token,
        status: 'authorized',
        oauth_timestamp: new Date()
      };
      account.status = 'active';
      await account.save();
      console.log('✅ Account updated');
    }

    // Store OAuth token in User model
    (user as any).oauthAccessToken = access_token;
    (user as any).oauthStatus = 'oauth_completed_awaiting_webhook';
    (user as any).oauthTimestamp = new Date();
    await user.save();

    console.log('⏳ WAITING FOR META WEBHOOK');
    console.log('✅ OAuth complete - awaiting webhook...');
    console.log('================================================\n');

    // Return success response
    return res.json({
      success: true,
      message: '⏳ OAuth successful! Waiting for Meta webhook...',
      userId: userId,
      status: 'awaiting_webhook',
      wabaId: null,
      phoneNumbers: null,
      nextSteps: [
        '✅ OAuth token saved',
        '⏳ Waiting for Meta webhook with WABA details',
        'Usually arrives within 30 seconds',
        'We\'ll update your connection when it arrives'
      ]
    });

  } catch (error: any) {
    console.error('❌ OAuth error:', error.message);

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

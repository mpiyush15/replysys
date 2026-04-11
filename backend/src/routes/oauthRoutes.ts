import express from 'express';
import {
  handleWhatsAppOAuth,
  getWhatsAppStatus,
  disconnectWhatsApp,
  connectWhatsApp
} from '../controllers/oauthController';

const router = express.Router();

/**
 * POST /api/client/oauth/whatsapp
 * Exchange OAuth code for access token + phone numbers
 * Requires: JWT authentication (handled by parent router)
 * Body: { code, state }
 */
router.post('/whatsapp', handleWhatsAppOAuth);

/**
 * GET /api/client/oauth/whatsapp/debug
 * Debug: Check token permissions and WABA access
 */
router.get('/whatsapp/debug', async (req: any, res: any) => {
  try {
    const { Account, User } = require('../models');
    const axios = require('axios');

    const userId = req.userId;
    const user = await User.findById(userId);
    const account = await Account.findOne({ accountId: String(userId) });

    if (!user || !account?.metaSync?.oauthAccessToken) {
      return res.json({
        status: 'error',
        message: 'No OAuth token found',
        user: !!user,
        account: !!account,
        token: !!account?.metaSync?.oauthAccessToken
      });
    }

    const token = account.metaSync.oauthAccessToken;
    const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

    // Try to fetch WABA
    const wabaResponse = await axios.get(`${GRAPH_API_URL}/me`, {
      params: {
        fields: 'whatsapp_business_account',
        access_token: token
      }
    });

    return res.json({
      status: 'ok',
      token_valid: true,
      waba_response: wabaResponse.data,
      wabaId: wabaResponse.data?.whatsapp_business_account?.id
    });
  } catch (error: any) {
    return res.json({
      status: 'error',
      message: error.message,
      error_response: error.response?.data
    });
  }
});

/**
 * GET /api/client/oauth/whatsapp/status
 * Get current WhatsApp connection status
 * Requires: JWT authentication (handled by parent router)
 * Returns: List of connected phone numbers
 */
router.get('/whatsapp/status', getWhatsAppStatus);

/**
 * POST /api/client/oauth/whatsapp/disconnect
 * Disconnect WhatsApp (mark phones inactive)
 * Requires: JWT authentication (handled by parent router)
 */
router.post('/whatsapp/disconnect', disconnectWhatsApp);

/**
 * POST /api/client/whatsapp/connect
 * Called AFTER Embedded Signup FINISH event
 * Registers phone + saves to database
 * Requires: JWT authentication (handled by parent router)
 * Body: { phoneNumberId, wabaId, phoneNumber }
 */
router.post('/whatsapp/connect', connectWhatsApp);

module.exports = router;

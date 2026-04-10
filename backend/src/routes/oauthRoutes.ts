import express from 'express';
import {
  handleWhatsAppOAuth,
  getWhatsAppStatus,
  disconnectWhatsApp
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

module.exports = router;

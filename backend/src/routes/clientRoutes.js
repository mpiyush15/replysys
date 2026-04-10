/**
 * CLIENT ROUTES
 * For actual clients (paying customers + our internal account)
 * promotions@replysys.com AND john@company.com use SAME routes
 * Data isolated by accountId
 */

const express = require('express');
const { requireClient } = require('../middlewares/requireClient');
const { isolateByAccount } = require('../middlewares/isolateByAccount');
const oauthRoutes = require('./oauthRoutes');
const messageRoutes = require('./messageRoutes');
const contactRoutes = require('./contactRoutes');

const router = express.Router();

// All routes require client auth + data isolation
router.use(requireClient);
router.use(isolateByAccount);

// Mount OAuth routes (already protected by requireClient + isolateByAccount)
router.use('/oauth', oauthRoutes);

// Mount message routes
router.use('/messages', messageRoutes);

// Mount contact routes
router.use('/contacts', contactRoutes);

// ==========================================
// DASHBOARD
// ==========================================

/**
 * GET /api/client/dashboard
 * Get dashboard stats
 */
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Client dashboard',
    accountId: req.accountId,
    data: {
      messagesSentToday: 0,
      activeConversations: 0,
      totalContacts: 0,
      planDetails: {}
    }
  });
});

// ==========================================
// MESSAGES
// ==========================================

/**
 * GET /api/client/messages
 * List all messages (isolated to this account)
 */
router.get('/messages', (req, res) => {
  res.json({
    success: true,
    message: 'Get messages',
    accountId: req.accountId,
    data: []
  });
});

/**
 * POST /api/client/messages/send
 * Send message to contact
 */
router.post('/messages/send', (req, res) => {
  res.json({
    success: true,
    message: 'Message sent',
    accountId: req.accountId,
    data: {}
  });
});

/**
 * POST /api/client/messages/bulk
 * Send bulk messages
 */
router.post('/messages/bulk', (req, res) => {
  res.json({
    success: true,
    message: 'Bulk messages queued',
    accountId: req.accountId,
    data: {}
  });
});

// ==========================================
// CONVERSATIONS
// ==========================================

/**
 * GET /api/client/conversations
 * List all conversations (isolated to this account)
 */
router.get('/conversations', (req, res) => {
  res.json({
    success: true,
    message: 'Get conversations',
    accountId: req.accountId,
    data: []
  });
});

/**
 * GET /api/client/conversations/:id
 * Get single conversation
 */
router.get('/conversations/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Get conversation',
    accountId: req.accountId,
    data: {}
  });
});

/**
 * POST /api/client/conversations/:id/reply
 * Reply to conversation
 */
router.post('/conversations/:id/reply', (req, res) => {
  res.json({
    success: true,
    message: 'Reply sent',
    accountId: req.accountId,
    data: {}
  });
});

// ==========================================
// CONTACTS
// ==========================================

/**
 * GET /api/client/contacts
 * List all contacts
 */
router.get('/contacts', (req, res) => {
  res.json({
    success: true,
    message: 'Get contacts',
    accountId: req.accountId,
    data: []
  });
});

/**
 * POST /api/client/contacts/upload
 * Upload contacts CSV
 */
router.post('/contacts/upload', (req, res) => {
  res.json({
    success: true,
    message: 'Contacts uploaded',
    accountId: req.accountId,
    data: {}
  });
});

/**
 * DELETE /api/client/contacts/:id
 * Delete contact
 */
router.delete('/contacts/:id', (req, res) => {
  res.json({
    success: true,
    message: 'Contact deleted',
    accountId: req.accountId
  });
});

// ==========================================
// BOT SETTINGS
// ==========================================

/**
 * GET /api/client/bot
 * Get bot configuration
 */
router.get('/bot', (req, res) => {
  res.json({
    success: true,
    message: 'Get bot settings',
    accountId: req.accountId,
    data: {}
  });
});

/**
 * POST /api/client/bot
 * Setup auto-reply bot
 */
router.post('/bot', (req, res) => {
  res.json({
    success: true,
    message: 'Bot configured',
    accountId: req.accountId,
    data: {}
  });
});

// ==========================================
// BILLING
// ==========================================

/**
 * GET /api/client/invoices
 * List client's invoices
 */
router.get('/invoices', (req, res) => {
  res.json({
    success: true,
    message: 'Get invoices',
    accountId: req.accountId,
    data: []
  });
});

/**
 * GET /api/client/usage
 * Get usage stats
 */
router.get('/usage', (req, res) => {
  res.json({
    success: true,
    message: 'Get usage',
    accountId: req.accountId,
    data: {}
  });
});

module.exports = router;

import express from 'express';
import {
  sendMessage,
  sendBulkMessages,
  getMessages,
  getMessage,
  getConversations,
  getConversationMessages,
  sendConversationMessage
} from '../controllers/messageController';

const router = express.Router();

/**
 * GET /api/client/conversations
 * List all conversations
 */
router.get('/conversations', getConversations);

/**
 * GET /api/client/conversations/:conversationId/messages
 * Get messages for a conversation
 */
router.get('/conversations/:conversationId/messages', getConversationMessages);

/**
 * POST /api/client/conversations/:conversationId/messages
 * Send message in a conversation
 */
router.post('/conversations/:conversationId/messages', sendConversationMessage);

/**
 * GET /api/client/messages
 * List all messages
 */
router.get('/', getMessages);

/**
 * GET /api/client/messages/:id
 * Get single message
 */
router.get('/:id', getMessage);

/**
 * POST /api/client/messages/send
 * Send single message
 * Body: {
 *   phoneNumberId: string,
 *   to: string (recipient phone),
 *   message: string (message text)
 * }
 */
router.post('/send', sendMessage);

/**
 * POST /api/client/messages/bulk
 * Send bulk messages
 * Body: {
 *   phoneNumberId: string,
 *   recipients: [ { phone, name? }, ... ],
 *   message: string
 * }
 */
router.post('/bulk', sendBulkMessages);

module.exports = router;

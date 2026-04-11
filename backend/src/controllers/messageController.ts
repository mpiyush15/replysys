import { Request, Response } from 'express';
import Message from '../models/Message';
import Conversation from '../models/Conversation';
import Account from '../models/Account';
import PhoneNumber from '../models/PhoneNumber';
import whatsappService from '../services/whatsappService';

/**
 * Message Controller - Handle sending messages
 */

/**
 * POST /api/client/messages/send
 * Send a single message to one recipient
 */
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { phoneNumberId, to, message } = req.body;

    // Validate inputs
    if (!phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumberId is required'
      });
    }

    if (!to) {
      return res.status(400).json({
        success: false,
        message: 'Recipient phone number (to) is required'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    console.log('📨 Sending message:', {
      userId,
      phoneNumberId,
      to,
      messageLength: message.length
    });

    // Send message
    const result = await whatsappService.sendTextMessage(
      userId,
      phoneNumberId,
      to,
      message,
      { source: 'api' }
    );

    return res.json({
      success: true,
      message: 'Message sent successfully',
      data: result
    });
  } catch (error: any) {
    console.error('❌ Send message error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * POST /api/client/messages/bulk
 * Send bulk messages to multiple recipients
 */
export const sendBulkMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { phoneNumberId, recipients, message } = req.body;

    // Validate inputs
    if (!phoneNumberId) {
      return res.status(400).json({
        success: false,
        message: 'phoneNumberId is required'
      });
    }

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required and must not be empty'
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message text is required'
      });
    }

    if (recipients.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 1000 recipients allowed per request'
      });
    }

    console.log('📨 Sending bulk messages:', {
      userId,
      phoneNumberId,
      recipientCount: recipients.length,
      messageLength: message.length
    });

    // Send bulk messages
    const results = await whatsappService.sendBulkMessages(
      userId,
      phoneNumberId,
      recipients,
      message,
      { source: 'bulk-api' }
    );

    return res.json({
      success: true,
      message: 'Bulk send completed',
      data: results
    });
  } catch (error: any) {
    console.error('❌ Bulk send error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to send bulk messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * GET /api/client/conversations
 * Get all conversations for account
 */
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const accountId = (req as any).accountId as string;
    const { status = 'open', limit = 50, offset = 0 } = req.query;

    console.log('📋 Fetching conversations:', { userId, accountId, status });

    // Get account - try both as _id and as accountId field
    let account: any = await Account.findById(accountId).lean();
    if (!account) {
      account = await Account.findOne({ accountId }).lean();
    }
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    let query: any = { accountId: String(account._id) };
    if (status && status !== 'all') {
      query.status = status;
    }

    const conversations = await Conversation.find(query)
      .sort({ lastMessageAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .lean();

    const total = await Conversation.countDocuments(query);

    return res.json({
      success: true,
      data: conversations,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    });
  } catch (error: any) {
    console.error('❌ Get conversations error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch conversations'
    });
  }
};

/**
 * GET /api/client/conversations/:conversationId/messages
 * Get messages for a specific conversation
 */
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const accountId = (req as any).accountId as string;
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    console.log('💬 Fetching messages:', { userId, accountId, conversationId });

    // Get account - try both as _id and as accountId field
    let account: any = await Account.findById(accountId).lean();
    if (!account) {
      account = await Account.findOne({ accountId }).lean();
    }
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify conversation belongs to this account
    const conversation = await Conversation.findOne({
      _id: conversationId,
      accountId: String(account._id)
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    const messages = await Message.find({
      conversationId,
      accountId: String(account._id)
    })
      .sort({ sentAt: 1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(offset as string))
      .lean();

    // Mark messages as read if they're inbound
    await Message.updateMany(
      {
        conversationId,
        direction: 'inbound',
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    return res.json({
      success: true,
      data: messages
    });
  } catch (error: any) {
    console.error('❌ Get messages error:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch messages'
    });
  }
};

/**
 * POST /api/client/conversations/:conversationId/messages
 * Send message in a conversation
 */
export const sendConversationMessage = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const accountId = (req as any).accountId as string;
    const { conversationId } = req.params;
    const { message, phoneNumberId } = req.body;

    console.log('📤 Sending conversation message:', { userId, accountId, conversationId });

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }

    // Get account - try both as _id and as accountId field
    let account: any = await Account.findById(accountId).lean();
    if (!account) {
      account = await Account.findOne({ accountId }).lean();
    }
    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }

    // Verify conversation belongs to this account
    const conversation = await Conversation.findOne({
      _id: conversationId,
      accountId: String(account._id)
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify phone number belongs to this account
    const phoneNumber = await PhoneNumber.findOne({
      accountId: String(account._id),
      phoneNumberId: phoneNumberId || conversation.contactPhone
    });

    if (!phoneNumber) {
      return res.status(404).json({
        success: false,
        message: 'Phone number not configured'
      });
    }

    // Send message via WhatsApp
    const result = await whatsappService.sendTextMessage(
      userId,
      phoneNumber.phoneNumberId,
      conversation.contactPhone,
      message.trim(),
      { conversationId, source: 'chat' }
    );

    return res.json({
      success: true,
      message: 'Message sent successfully',
      data: result
    });
  } catch (error: any) {
    console.error('❌ Send message error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

/**
 * GET /api/client/messages
 * Get all messages for account
 */
export const getMessages = async (req: Request, res: Response) => {
  try {
    const userId = req.userId as string;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await Message.find({ userId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip(Number(offset))
      .lean();

    const total = await Message.countDocuments({ userId });

    return res.json({
      success: true,
      data: messages,
      pagination: {
        total,
        limit: Number(limit),
        offset: Number(offset)
      }
    });
  } catch (error: any) {
    console.error('❌ Get messages error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to get messages'
    });
  }
};

/**
 * GET /api/client/messages/:id
 * Get single message by ID
 */
export const getMessage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.userId as string;

    const message = await Message.findOne({
      _id: id,
      userId
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    return res.json({
      success: true,
      data: message
    });
  } catch (error: any) {
    console.error('❌ Get message error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to get message'
    });
  }
};

export default {
  sendMessage,
  sendBulkMessages,
  getMessages,
  getMessage,
  getConversations,
  getConversationMessages,
  sendConversationMessage
};

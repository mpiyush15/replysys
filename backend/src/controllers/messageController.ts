import { Request, Response } from 'express';
import Message from '../models/Message';
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
  getMessage
};

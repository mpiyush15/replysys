import axios from 'axios';
import PhoneNumber from '../models/PhoneNumber';
import Message from '../models/Message';
import Contact from '../models/Contact';
import Conversation from '../models/Conversation';
import { MessageStatus, ConversationStatus } from '../constants/enums';

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

/**
 * WhatsApp Message Service
 * Handles sending messages via Meta Cloud API
 */
class WhatsAppMessageService {
  /**
   * Get phone number config with access token
   */
  async getPhoneConfig(accountId: string, phoneNumberId: string) {
    const config = await PhoneNumber.findOne({
      accountId,
      phoneNumberId,
      status: 'active'
    }).select('+accessToken');

    if (!config) {
      throw new Error(
        '🚨 WhatsApp Business Account not connected!\n\n' +
        'Please connect your WhatsApp account in Settings first'
      );
    }

    if (!config.accessToken) {
      throw new Error(
        'Access token is missing. Please reconnect your WhatsApp account.'
      );
    }

    console.log('📱 Phone config loaded:', {
      phoneNumberId: config.phoneNumberId,
      wabaId: config.wabaId,
      status: config.status,
      tokenLength: config.accessToken.length
    });

    return config;
  }

  /**
   * Auto-create or update contact when message is sent
   */
  async getOrCreateContact(
    accountId: string,
    phone: string,
    contactName: string | null = null
  ) {
    try {
      const formattedPhone = phone.replace(/[^0-9]/g, '');

      let contact = await Contact.findOne({
        accountId,
        phone: formattedPhone
      });

      if (!contact) {
        contact = await Contact.create({
          accountId,
          name: contactName || formattedPhone,
          phone: formattedPhone,
          status: 'active'
        });
        console.log('✅ Created new contact:', contact._id);
      } else {
        if (contactName && contactName !== formattedPhone) {
          contact.name = contactName;
        }
        contact.lastMessageAt = new Date();
        await contact.save();
        console.log('✅ Updated contact:', contact._id);
      }

      return contact;
    } catch (error: any) {
      console.error('❌ Error in getOrCreateContact:', error.message);
      throw error;
    }
  }

  /**
   * Get or create conversation
   */
  async getOrCreateConversation(
    accountId: string,
    phoneNumberId: string,
    recipientPhone: string
  ) {
    try {
      let conversation = await Conversation.findOneAndUpdate(
        {
          accountId,
          phoneNumberId: phoneNumberId,
          contactPhone: recipientPhone
        },
        {
          $setOnInsert: {
            accountId,
            phoneNumberId,
            contactPhone: recipientPhone,
            status: 'open',
            lastMessageAt: new Date()
          }
        },
        {
          upsert: true,
          new: true,
          runValidators: false
        }
      );

      return conversation;
    } catch (error: any) {
      console.error('❌ Error in getOrCreateConversation:', error.message);
      throw error;
    }
  }

  /**
   * Send text message via WhatsApp Cloud API
   */
  async sendTextMessage(
    accountId: string,
    phoneNumberId: string,
    recipientPhone: string,
    messageText: string,
    metadata: any = {}
  ) {
    let message: any;

    try {
      // Validate inputs
      if (!phoneNumberId || typeof phoneNumberId !== 'string') {
        throw new Error('Phone number ID is required');
      }

      if (!recipientPhone || typeof recipientPhone !== 'string') {
        throw new Error(`Invalid recipient phone: ${recipientPhone}`);
      }

      const config = await this.getPhoneConfig(accountId, phoneNumberId);

      if (!config.status || config.status !== 'active') {
        throw new Error('Phone number is not active. Cannot send messages.');
      }

      const cleanPhone = recipientPhone.replace(/[\s+()-]/g, '');

      console.log('📱 Preparing to send WhatsApp message:', {
        accountId,
        phoneNumberId,
        recipientPhone: cleanPhone,
        messageLength: messageText.length
      });

      // Get or create conversation
      const conversation = await this.getOrCreateConversation(
        accountId,
        phoneNumberId,
        cleanPhone
      );

      // Auto-create contact
      await this.getOrCreateContact(accountId, cleanPhone, null);

      // Create message record (queued state)
      message = new Message({
        accountId,
        phoneNumberId,
        conversationId: conversation._id,
        senderPhone: phoneNumberId,
        contactPhone: cleanPhone,
        messageType: 'text',
        content: messageText,
        direction: 'outbound',
        status: 'queued'
      });

      await message.save();
      console.log('✅ Message saved to DB with status: queued');

      // Send via WhatsApp Cloud API
      console.log('🚀 Sending to Meta API...');
      const response = await axios.post(
        `${GRAPH_API_URL}/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanPhone,
          type: 'text',
          text: { body: messageText }
        },
        {
          headers: {
            Authorization: `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('✅ Meta API Response:', response.data);

      // Update message with WhatsApp message ID
      message.waMessageId = response.data.messages[0].id;
      message.status = MessageStatus.SENT;
      message.sentAt = new Date();
      await message.save();

      // Update conversation
      await Conversation.findByIdAndUpdate(conversation._id, {
        lastMessageAt: new Date(),
        lastMessage: messageText.substring(0, 200),
        status: ConversationStatus.OPEN
      });

      // Update phone number stats
      await PhoneNumber.updateOne(
        { accountId, phoneNumberId },
        {
          $inc: {
            'messageCount.total': 1,
            'messageCount.sent': 1
          }
        }
      );

      return {
        success: true,
        messageId: message._id,
        waMessageId: message.waMessageId
      };
    } catch (error: any) {
      console.error('❌ Send message error:', error.response?.data || error.message);

      // Save failed message
      if (message) {
        message.status = 'failed';
        message.failedAt = new Date();
        message.errorMessage =
          error.response?.data?.error?.message || error.message;
        message.errorCode = error.response?.data?.error?.code;
        await message.save();
      }

      throw error;
    }
  }

  /**
   * Send bulk messages to multiple recipients
   */
  async sendBulkMessages(
    accountId: string,
    phoneNumberId: string,
    recipients: Array<{
      phone: string;
      name?: string;
    }>,
    messageText: string,
    metadata: any = {}
  ) {
    console.log('📨 Starting bulk send:', {
      accountId,
      phoneNumberId,
      recipientCount: recipients.length
    });

    const results = {
      successful: 0,
      failed: 0,
      details: [] as any[]
    };

    for (const recipient of recipients) {
      try {
        const result = await this.sendTextMessage(
          accountId,
          phoneNumberId,
          recipient.phone,
          messageText,
          { ...metadata, contactName: recipient.name }
        );

        results.successful++;
        results.details.push({
          phone: recipient.phone,
          status: 'success',
          messageId: result.messageId
        });

        console.log(`✅ Message sent to ${recipient.phone}`);
      } catch (error: any) {
        results.failed++;
        results.details.push({
          phone: recipient.phone,
          status: 'failed',
          error: error.message
        });

        console.error(`❌ Message failed to ${recipient.phone}:`, error.message);
      }

      // Small delay between sends to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('📊 Bulk send complete:', results);
    return results;
  }
}

export default new WhatsAppMessageService();

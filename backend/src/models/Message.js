import mongoose from 'mongoose';
import { MessageDirection, MessageType, MessageStatus } from '../constants/enums';

const messageSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  phoneNumberId: {
    type: String,
    required: true,
    index: true
  },
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  
  // Message content
  content: {
    type: String,
    required: true
  },
  
  // Direction: inbound (from customer) or outbound (from us)
  direction: {
    type: String,
    enum: Object.values(MessageDirection),
    required: true,
    index: true
  },
  
  // Message type
  messageType: {
    type: String,
    enum: Object.values(MessageType),
    default: MessageType.TEXT
  },
  
  // Sender/Recipient
  senderPhone: {
    type: String,
    required: true,
    index: true
  },
  recipientPhone: {
    type: String,
    required: true,
    index: true
  },
  
  // Meta WhatsApp ID
  waMessageId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  
  // Status tracking
  status: {
    type: String,
    enum: Object.values(MessageStatus),
    default: MessageStatus.PENDING,
    index: true
  },
  
  // Timestamps
  sentAt: Date,
  deliveredAt: Date,
  readAt: Date,
  
  // Metadata
  metadata: {
    campaign: String,
    tags: [String],
    customData: mongoose.Schema.Types.Mixed
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

messageSchema.index({ accountId: 1, conversationId: 1, createdAt: -1 });
messageSchema.index({ accountId: 1, senderPhone: 1, createdAt: -1 });
messageSchema.index({ status: 1, sentAt: 1 });

export default mongoose.model('Message', messageSchema);

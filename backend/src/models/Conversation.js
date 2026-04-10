import mongoose from 'mongoose';
import { ConversationStatus, MessageDirection } from '../constants/enums';

const conversationSchema = new mongoose.Schema({
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
  
  // Contact info
  contactPhone: {
    type: String,
    required: true,
    index: true
  },
  contactName: String,
  contactEmail: String,
  
  // Conversation details
  status: {
    type: String,
    enum: Object.values(ConversationStatus),
    default: ConversationStatus.OPEN,
    index: true
  },
  
  // Message info
  lastMessage: String,
  lastMessageType: {
    type: String,
    enum: Object.values(MessageDirection),
    default: MessageDirection.INBOUND
  },
  unreadCount: {
    type: Number,
    default: 0
  },
  
  // Timestamps
  lastMessageAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  tags: [String],
  notes: String,
  
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

conversationSchema.index({ accountId: 1, phoneNumberId: 1, status: 1 });
conversationSchema.index({ accountId: 1, lastMessageAt: -1 });

export default mongoose.model('Conversation', conversationSchema);

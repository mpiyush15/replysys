import mongoose from 'mongoose';

const phoneNumberSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: true,
    index: true
  },
  
  // Phone info from Meta
  phoneNumberId: {
    type: String,
    required: true,
    index: true
  },
  wabaId: {
    type: String,
    required: true,
    index: true
  },
  displayPhoneNumber: {
    type: String,
    required: true
  },
  displayName: String,
  
  // OAuth & Access
  accessToken: {
    type: String,
    select: false // Don't return by default
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending_verification'],
    default: 'active'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  
  verifiedName: String,
  verifiedAt: Date,
  qualityRating: String,
  
  // Stats
  messageCount: {
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    received: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 }
  },
  
  lastMessageAt: Date,
  lastTestedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

phoneNumberSchema.index({ accountId: 1, phoneNumberId: 1 });
phoneNumberSchema.index({ accountId: 1, wabaId: 1 });

export default mongoose.model('PhoneNumber', phoneNumberSchema);

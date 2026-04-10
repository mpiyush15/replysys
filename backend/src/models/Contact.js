import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Contact info
  phone: {
    type: String,
    required: true,
    index: true
  },
  name: String,
  email: String,
  
  // Custom fields
  customFields: {
    type: Map,
    of: String
  },
  
  // Tracking
  tags: [String],
  notes: String,
  
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active',
    index: true
  },
  
  // Last interaction
  lastMessageAt: Date,
  messageCount: {
    type: Number,
    default: 0
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

contactSchema.index({ accountId: 1, phone: 1 });
contactSchema.index({ accountId: 1, status: 1 });

export default mongoose.model('Contact', contactSchema);

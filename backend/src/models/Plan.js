import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  // Plan details
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  
  // Pricing
  monthlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  yearlyPrice: {
    type: Number,
    required: true,
    default: 0
  },
  setupFee: {
    type: Number,
    default: 0
  },
  
  // Plan features
  features: {
    smsPerDay: { type: Number, default: 100 },
    maxContacts: { type: Number, default: 1000 },
    maxPhoneNumbers: { type: Number, default: 1 },
    botEnabled: { type: Boolean, default: false },
    bulkImport: { type: Boolean, default: true },
    customFields: [String]
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Plan', planSchema);

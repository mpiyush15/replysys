import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import { BillingCycle, ClientStatus } from '../constants/enums';

const clientSchema = new mongoose.Schema({
  // Client account
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    select: false // Don't return by default
  },
  name: {
    type: String,
    required: true
  },
  company: String,
  phone: String,
  
  // Subscription
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  billingCycle: {
    type: String,
    enum: Object.values(BillingCycle),
    default: BillingCycle.MONTHLY
  },
  
  // Account status
  status: {
    type: String,
    enum: Object.values(ClientStatus),
    default: ClientStatus.TRIAL,
    index: true
  },
  
  // Trial info
  trialEndsAt: Date,
  trialDaysRemaining: Number,
  
  // Account linking
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    sparse: true
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

// Hash password before saving
clientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
clientSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

export default mongoose.model('Client', clientSchema);

import mongoose from 'mongoose';
import { AccountStatus, OAuthStatus } from '../constants/enums';

const accountSchema = new mongoose.Schema({
  // Account info
  accountId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // WhatsApp Meta info
  wabaId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  businessId: String,
  businessName: String,
  accessToken: {
    type: String,
    select: false // Don't return by default for security
  },
  
  // OAuth Sync Status
  metaSync: {
    status: {
      type: String,
      enum: Object.values(OAuthStatus)
    },
    accountId: String,
    oauth_timestamp: Date,
    oauthAccessToken: {
      type: String,
      select: false
    },
    note: String
  },
  
  // Account settings
  status: {
    type: String,
    enum: Object.values(AccountStatus),
    default: AccountStatus.ACTIVE
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

accountSchema.index({ userId: 1, status: 1 });
accountSchema.index({ wabaId: 1 });

export default mongoose.model('Account', accountSchema);

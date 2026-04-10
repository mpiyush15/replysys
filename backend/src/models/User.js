import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import {
  UserRole,
  UserStatus,
  WhatsAppConnectionStatus,
  OAuthStatus,
} from '../constants/enums';

const userSchema = new mongoose.Schema({
  // Basic info
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
    select: false
  },
  name: {
    type: String,
    required: true
  },
  
  // Role-based access
  role: {
    type: String,
    enum: Object.values(UserRole).filter((r) => r !== 'guest'),
    default: UserRole.CLIENT,
    index: true
  },
  
  // If they're a client, link to Client model
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    sparse: true,
    index: true
  },
  
  // WhatsApp/OAuth fields
  whatsappStatus: {
    type: String,
    enum: Object.values(WhatsAppConnectionStatus),
    default: WhatsAppConnectionStatus.DISCONNECTED
  },
  wabaId: String,
  whatsappPhone: String,
  oauthAccessToken: String,
  oauthStatus: {
    type: String,
    enum: Object.values(OAuthStatus),
    default: OAuthStatus.PENDING
  },
  oauthTimestamp: Date,
  lastConnectionTime: Date,
  
  // Account status
  status: {
    type: String,
    enum: Object.values(UserStatus),
    default: UserStatus.ACTIVE,
    index: true
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
userSchema.pre('save', async function (next) {
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
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcryptjs.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

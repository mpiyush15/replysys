import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
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
  wabaId: {
    type: String,
    required: true,
    index: true
  },
  
  // Template info from Meta
  name: {
    type: String,
    required: true,
    index: true
  },
  templateId: {
    type: String,
    sparse: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'DISABLED', 'PAUSED'],
    default: 'PENDING',
    index: true
  },
  
  // Template content
  language: {
    type: String,
    default: 'en_US',
    index: true
  },
  category: {
    type: String,
    enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION', 'SERVICE_UPDATE'],
    default: 'UTILITY'
  },
  
  // Template structure
  headerFormat: String, // TEXT, IMAGE, VIDEO, DOCUMENT
  headerText: String,
  headerImageUrl: String,
  headerVideoUrl: String,
  headerDocumentUrl: String,
  
  bodyText: {
    type: String,
    required: true
  },
  
  footerText: String,
  
  // Button configuration
  buttons: [
    {
      type: {
        type: String,
        enum: ['PHONE_NUMBER', 'URL', 'QUICK_REPLY']
      },
      text: String,
      phoneNumber: String,
      url: String,
      urlType: String // STATIC, DYNAMIC
    }
  ],
  
  // Variables for dynamic content
  variables: [
    {
      name: String,
      type: String, // text, url, phone
      defaultValue: String,
      exampleValue: String
    }
  ],
  
  // Sync info
  metaSyncAt: Date,
  rejectionReason: String,
  
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

templateSchema.index({ accountId: 1, status: 1 });
templateSchema.index({ accountId: 1, name: 1, language: 1 });

export default mongoose.model('Template', templateSchema);

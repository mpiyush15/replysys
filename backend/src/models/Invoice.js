import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  // Invoice details
  invoiceNumber: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
    index: true
  },
  
  planId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan',
    required: true
  },
  
  // Amounts
  planPrice: {
    type: Number,
    required: true
  },
  setupFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  
  // Period
  billingPeriodStart: {
    type: Date,
    required: true
  },
  billingPeriodEnd: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  
  // Payment status
  status: {
    type: String,
    enum: ['draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled'],
    default: 'draft',
    index: true
  },
  paidAt: Date,
  paidAmount: {
    type: Number,
    default: 0
  },
  
  // Notes
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

invoiceSchema.index({ clientId: 1, status: 1 });
invoiceSchema.index({ dueDate: 1, status: 1 });

export default mongoose.model('Invoice', invoiceSchema);

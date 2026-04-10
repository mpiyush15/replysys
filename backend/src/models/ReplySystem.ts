import mongoose, { Schema, Document } from 'mongoose';

export interface IReplySystem extends Document {
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const replySystemSchema = new Schema<IReplySystem>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const ReplySystem = mongoose.model<IReplySystem>(
  'ReplySystem',
  replySystemSchema,
  'replysys'
);

export default ReplySystem;

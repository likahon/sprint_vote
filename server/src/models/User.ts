import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  isAdmin: boolean;
  role: string;
  hasVoted: boolean;
  vote?: string;
  socketId?: string;
  roomId?: string;
  emojis?: Array<{
    id: string;
    emoji: string;
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    timestamp: number;
  }>;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  role: { type: String, default: 'Dev' },
  hasVoted: { type: Boolean, default: false },
  vote: { type: String },
  socketId: { type: String },
  roomId: { type: String },
  emojis: [{
    id: { type: String, required: true },
    emoji: { type: String, required: true },
    fromUserId: { type: String, required: true },
    fromUserName: { type: String, required: true },
    toUserId: { type: String, required: true },
    timestamp: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);


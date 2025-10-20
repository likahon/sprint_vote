import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  isAdmin: boolean;
  hasVoted: boolean;
  vote?: string;
  socketId?: string;
  roomId?: string;
}

const UserSchema = new Schema<IUser>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  hasVoted: { type: Boolean, default: false },
  vote: { type: String },
  socketId: { type: String },
  roomId: { type: String }
}, {
  timestamps: true
});

export const User = mongoose.model<IUser>('User', UserSchema);


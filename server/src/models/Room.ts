import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoom extends Document {
  id: string;
  users: Types.ObjectId[];
  votesRevealed: boolean;
  adminId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema = new Schema<IRoom>({
  id: { type: String, required: true, unique: true },
  users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  votesRevealed: { type: Boolean, default: false },
  adminId: { type: String, ref: 'User' }
}, {
  timestamps: true
});

export const Room = mongoose.model<IRoom>('Room', RoomSchema);

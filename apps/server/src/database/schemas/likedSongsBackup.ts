import { Schema, Types } from 'mongoose';

export interface LikedSongsChange {
  songId: string;
  action: 'add' | 'remove';
}

export interface LikedSongsBackup {
  owner: Types.ObjectId;
  createdAt: Date;
  changes: LikedSongsChange[];
}

export const LikedSongsBackupSchema = new Schema<LikedSongsBackup>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  changes: [
    {
      songId: String,
      action: { type: String, enum: ['add', 'remove'] },
    },
  ],
});

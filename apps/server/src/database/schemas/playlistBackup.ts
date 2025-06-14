import { Schema, Types } from 'mongoose';

export interface PlaylistChange {
  songId: string;
  action: 'add' | 'remove';
}

export interface PlaylistBackup {
  owner: Types.ObjectId;
  playlistId: string;
  createdAt: Date;
  changes: PlaylistChange[];
}

export const PlaylistBackupSchema = new Schema<PlaylistBackup>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  playlistId: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, index: true },
  changes: [
    {
      songId: String,
      action: { type: String, enum: ['add', 'remove'] },
    },
  ],
});

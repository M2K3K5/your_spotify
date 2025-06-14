import { Schema, Types } from 'mongoose';

export interface PlaylistBackupTarget {
  owner: Types.ObjectId;
  playlistId: string;
  playlistName: string;
  active: boolean;
}

export const PlaylistBackupTargetSchema = new Schema<PlaylistBackupTarget>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  playlistId: { type: String },
  playlistName: { type: String },
  active: { type: Boolean, default: true },
});

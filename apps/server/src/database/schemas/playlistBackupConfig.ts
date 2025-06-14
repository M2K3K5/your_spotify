import { Schema, Types } from 'mongoose';

export interface PlaylistBackupConfig {
  owner: Types.ObjectId;
  playlistId: string;
  playlistName: string;
  active: boolean;
}

export const PlaylistBackupConfigSchema = new Schema<PlaylistBackupConfig>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  playlistId: { type: String },
  playlistName: { type: String },
  active: { type: Boolean, default: true },
});

import { Schema, Types } from 'mongoose';

export interface PlaylistBackupSubscription {
  owner: Types.ObjectId;
  playlistId: string;
  playlistName: string;
  active: boolean;
}

export const PlaylistBackupSubscriptionSchema = new Schema<PlaylistBackupSubscription>({
  owner: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  playlistId: { type: String },
  playlistName: { type: String },
  active: { type: Boolean, default: true },
});

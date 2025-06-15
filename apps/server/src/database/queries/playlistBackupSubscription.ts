import { Types } from 'mongoose';
import { PlaylistBackupSubscriptionModel } from '../Models';

export const addSubscription = (
  userId: string,
  playlistId: string,
  playlistName: string,
) =>
  PlaylistBackupSubscriptionModel.findOneAndUpdate(
    { owner: userId, playlistId },
    { playlistName, active: true },
    { upsert: true, new: true },
  );

export const updateSubscription = (
  userId: string,
  playlistId: string,
  infos: Partial<{ playlistName: string; active: boolean }>,
) =>
  PlaylistBackupSubscriptionModel.findOneAndUpdate(
    { owner: userId, playlistId },
    infos,
    { new: true, upsert: true },
  );

export const getSubscriptions = (userId: string) =>
  PlaylistBackupSubscriptionModel.find({ owner: userId });

export const getActiveSubscriptions = (userId: string) =>
  PlaylistBackupSubscriptionModel.find({ owner: userId, active: true });

export const removeSubscription = (userId: string, playlistId: string) =>
  PlaylistBackupSubscriptionModel.deleteOne({ owner: userId, playlistId });

import { Types } from 'mongoose';
import { PlaylistBackupTargetModel } from '../Models';

export const addTarget = (
  userId: string,
  playlistId: string,
  playlistName: string,
) =>
  PlaylistBackupTargetModel.findOneAndUpdate(
    { owner: userId, playlistId },
    { playlistName, active: true },
    { upsert: true, new: true },
  );

export const updateTarget = (
  userId: string,
  playlistId: string,
  infos: Partial<{ playlistName: string; active: boolean }>,
) =>
  PlaylistBackupTargetModel.findOneAndUpdate(
    { owner: userId, playlistId },
    infos,
    { new: true, upsert: true },
  );

export const getTargets = (userId: string) =>
  PlaylistBackupTargetModel.find({ owner: userId });

export const getActiveTargets = (userId: string) =>
  PlaylistBackupTargetModel.find({ owner: userId, active: true });

export const removeTarget = (userId: string, playlistId: string) =>
  PlaylistBackupTargetModel.deleteOne({ owner: userId, playlistId });

import { Types } from 'mongoose';
import { PlaylistBackupConfigModel } from '../Models';

export const addConfig = (
  userId: string,
  playlistId: string,
  playlistName: string,
) =>
  PlaylistBackupConfigModel.findOneAndUpdate(
    { owner: userId, playlistId },
    { playlistName, active: true },
    { upsert: true, new: true },
  );

export const updateConfig = (
  userId: string,
  playlistId: string,
  infos: Partial<{ playlistName: string; active: boolean }>,
) =>
  PlaylistBackupConfigModel.findOneAndUpdate(
    { owner: userId, playlistId },
    infos,
    { new: true, upsert: true },
  );

export const getConfigs = (userId: string) =>
  PlaylistBackupConfigModel.find({ owner: userId });

export const getActiveConfigs = (userId: string) =>
  PlaylistBackupConfigModel.find({ owner: userId, active: true });

export const removeConfig = (userId: string, playlistId: string) =>
  PlaylistBackupConfigModel.deleteOne({ owner: userId, playlistId });

import { Types } from 'mongoose';
import { PlaylistBackupModel } from '../Models';
import { PlaylistChange } from '../schemas/playlistBackup';

export const createBackup = (
  userId: string,
  playlistId: string,
  changes: PlaylistChange[],
) =>
  PlaylistBackupModel.create({
    owner: new Types.ObjectId(userId),
    playlistId,
    changes,
  });

export const getBackups = (userId: string, playlistId: string) =>
  PlaylistBackupModel.find({ owner: userId, playlistId }).sort({ createdAt: 1 });

export const getBackupsUntil = (
  userId: string,
  playlistId: string,
  until: Date,
) =>
  PlaylistBackupModel.find({
    owner: userId,
    playlistId,
    createdAt: { $lte: until },
  }).sort({ createdAt: 1 });

export const deleteOldBackups = async (
  userId: string,
  playlistId: string,
  keepDays: number,
) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);

  const oldBackups = await PlaylistBackupModel.find({
    owner: userId,
    playlistId,
    createdAt: { $lt: cutoff },
  }).sort({ createdAt: 1 });

  if (oldBackups.length === 0) {
    return { deletedCount: 0 } as { deletedCount: number };
  }

  const accumulatedState = new Set<string>();
  for (const backup of oldBackups) {
    for (const change of backup.changes) {
      if (change.action === 'add') accumulatedState.add(change.songId);
      else accumulatedState.delete(change.songId);
    }
  }

  if (accumulatedState.size > 0) {
    const consolidatedChanges: PlaylistChange[] = Array.from(accumulatedState).map(
      songId => ({ songId, action: 'add' as const }),
    );

    await PlaylistBackupModel.create({
      owner: new Types.ObjectId(userId),
      playlistId,
      changes: consolidatedChanges,
      createdAt: cutoff,
    });
  }

  const deleteResult = await PlaylistBackupModel.deleteMany({
    owner: userId,
    playlistId,
    createdAt: { $lt: cutoff },
  });

  return deleteResult;
};

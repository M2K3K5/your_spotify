import { Types } from 'mongoose';
import { LikedSongsBackupModel } from '../Models';
import { LikedSongsChange } from '../schemas/likedSongsBackup';

export const createBackup = (userId: string, changes: LikedSongsChange[]) =>
  LikedSongsBackupModel.create({ owner: new Types.ObjectId(userId), changes });

export const getBackups = (userId: string) =>
  LikedSongsBackupModel.find({ owner: userId }).sort({ createdAt: -1 });

export const getBackupsUntil = (userId: string, until: Date) =>
  LikedSongsBackupModel.find({
    owner: userId,
    createdAt: { $lte: until },
  }).sort({ createdAt: 1 });

export const deleteOldBackups = async (userId: string, keepDays: number) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - keepDays);
  
  // Get all backups before the cutoff date
  const oldBackups = await LikedSongsBackupModel.find({
    owner: userId,
    createdAt: { $lt: cutoff },
  }).sort({ createdAt: 1 });

  // If no old backups exist, nothing to do
  if (oldBackups.length === 0) {
    return { deletedCount: 0 };
  }

  // Compute the accumulated state from all old backups
  const accumulatedState = new Set<string>();
  for (const backup of oldBackups) {
    for (const change of backup.changes) {
      if (change.action === 'add') {
        accumulatedState.add(change.songId);
      } else {
        accumulatedState.delete(change.songId);
      }
    }
  }

  // Only create a consolidated backup if there are songs in the accumulated state
  if (accumulatedState.size > 0) {
    const consolidatedChanges: LikedSongsChange[] = Array.from(accumulatedState).map(songId => ({
      songId,
      action: 'add' as const,
    }));

    // Create a consolidated backup at the cutoff date
    await LikedSongsBackupModel.create({
      owner: new Types.ObjectId(userId),
      changes: consolidatedChanges,
      createdAt: cutoff,
    });
  }

  // Now delete all the old individual backups
  const deleteResult = await LikedSongsBackupModel.deleteMany({
    owner: userId,
    createdAt: { $lt: cutoff },
  });

  return deleteResult;
};

import { UserModel } from '../database/Models';
import { storeInUser } from '../database';
import { startMigration } from '../tools/migrations';

export async function up() {
  startMigration('add likedSongsBackup to user');

  for await (const user of UserModel.find()) {
    if (user.likedSongsBackupStatus === undefined) {
      await storeInUser('_id', user._id, {
        likedSongsBackupStatus: 'inactive',
      });
    }
  }
}

export async function down() {}

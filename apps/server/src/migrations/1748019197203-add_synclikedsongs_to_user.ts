import { UserModel } from "../database/Models";
import { storeInUser } from "../database";
import { startMigration } from "../tools/migrations";

export async function up() {
  startMigration("add syncLikedSongs to user");

  for await (const user of UserModel.find()) {
    if (user.syncLikedSongsStatus === undefined) {
      await storeInUser("_id", user._id, {
        syncLikedSongsStatus: "inactive"
      });
    }
  }
}

export async function down() { }

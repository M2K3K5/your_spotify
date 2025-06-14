import { Router } from "express";
import { z } from "zod";
import {
  getTrackBySpotifyId,
  getSongs,
  getSongsPer,
  getMostListenedSongs,
  getMostListenedArtist,
  getTimePer,
  albumDateRatio,
  featRatio,
  popularityPer,
  differentArtistsPer,
  getDayRepartition,
  getBestArtistsPer,
  getLongestListeningSession,
  getBest,
  ItemType,
  getBestOfHour,
  storeInUser,
} from "../database";
import {
  CollaborativeMode,
  getCollaborativeBestAlbums,
  getCollaborativeBestArtists,
  getCollaborativeBestSongs,
} from "../database/queries/collaborative";
import { DateFormatter, intervalToDisplay } from "../tools/date";
import { logger } from "../tools/logger";
import {
  affinityAllowed,
  isLoggedOrGuest,
  logged,
  validate,
  withHttpClient,
} from "../tools/middleware";
import { SpotifyRequest, LoggedRequest, Timesplit } from "../tools/types";
import { toDate, toNumber } from "../tools/zod";
import {
  getBackups,
  getBackupsUntil,
} from "../database/queries/likedSongsBackup";
import {
  addConfig as addPlaylistBackupConfig,
  getConfigs as getPlaylistBackupConfigs,
  updateConfig as updatePlaylistBackupConfig,
} from "../database/queries/playlistBackupConfig";
import {
  createBackup as createPlaylistBackup,
  getBackups as getPlaylistBackups,
  getBackupsUntil as getPlaylistBackupsUntil,
} from "../database/queries/playlistBackup";

export const router = Router();

const playSchema = z.object({
  id: z.string(),
});

router.post("/play", logged, withHttpClient, async (req, res) => {
  const { client } = req as SpotifyRequest;
  const { id } = validate(req.body, playSchema);

  try {
    const track = await getTrackBySpotifyId(id);

    if (!track) {
      res.status(400).end();
      return;
    }
    await client.playTrack(track.uri);
    res.status(200).end();
  } catch (e) {
    if (e.response) {
      logger.error(e.response.data);
      res.status(400).send(e.response.data.error);
      return;
    }
    throw e;
  }
});

const gethistorySchema = z.object({
  number: z.preprocess(toNumber, z.number().max(20)),
  offset: z.preprocess(toNumber, z.number()),
  start: z.preprocess(toDate, z.date().optional()),
  end: z.preprocess(toDate, z.date().optional()),
});

router.get("/gethistory", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { number, offset, start, end } = validate(req.query, gethistorySchema);

  const tracks = await getSongs(
    user._id.toString(),
    offset,
    number,
    start && end ? { start, end } : undefined,
  );
  res.status(200).send(tracks);
});

const interval = z.object({
  start: z.preprocess(toDate, z.date()),
  end: z.preprocess(
    toDate,
    z.date().default(() => new Date()),
  ),
});

const intervalPerSchema = z.object({
  start: z.preprocess(toDate, z.date()),
  end: z.preprocess(
    toDate,
    z.date().default(() => new Date()),
  ),
  timeSplit: z.nativeEnum(Timesplit).default(Timesplit.day),
});

router.get("/listened_to", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end } = validate(req.query, interval);

  const result = await getSongsPer(user, start, end);
  if (result.length > 0) {
    res.status(200).send({ count: result[0].count });
    return;
  }
  res.status(200).send({ count: 0 });
});

router.get("/most_listened", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await getMostListenedSongs(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/most_listened_artist", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await getMostListenedArtist(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/songs_per", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await getSongsPer(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/time_per", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await getTimePer(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/album_date_ratio", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await albumDateRatio(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/feat_ratio", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await featRatio(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/popularity_per", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await popularityPer(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/different_artists_per", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await differentArtistsPer(user, start, end, timeSplit);
  res.status(200).send(result);
});

router.get("/time_per_hour_of_day", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end } = validate(req.query, interval);

  const result = await getDayRepartition(user, start, end);
  res.status(200).send(result);
});

router.get("/best_artists_per", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, timeSplit } = validate(req.query, intervalPerSchema);

  const result = await getBestArtistsPer(user, start, end, timeSplit);
  res.status(200).send(result);
});

const intervalPerSchemaNbOffset = z.object({
  start: z.preprocess(toDate, z.date()),
  end: z.preprocess(
    toDate,
    z.date().default(() => new Date()),
  ),
  nb: z.preprocess(toNumber, z.number().min(1).max(30)),
  offset: z.preprocess(toNumber, z.number().min(0).default(0)),
  sortKey: z.string().default("count"),
});

router.get("/top/songs", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, nb, offset, sortKey } = validate(
    req.query,
    intervalPerSchemaNbOffset,
  );

  const result = await getBest(ItemType.track, user, start, end, nb, offset);
  res.status(200).send(result);
});

router.get("/top/artists", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, nb, offset, sortKey } = validate(
    req.query,
    intervalPerSchemaNbOffset,
  );

  const result = await getBest(ItemType.artist, user, start, end, nb, offset);
  res.status(200).send(result);
});

router.get("/top/albums", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end, nb, offset, sortKey } = validate(
    req.query,
    intervalPerSchemaNbOffset,
  );

  const result = await getBest(ItemType.album, user, start, end, nb, offset);
  res.status(200).send(result);
});

const collaborativeSchema = intervalPerSchema.merge(
  z.object({
    otherIds: z.preprocess(
      (val) => (typeof val === 'string' ? [val] : val), // If it's a string, wrap it in an array
      z.array(z.string()).min(1)
    ),
    mode: z.nativeEnum(CollaborativeMode),
  }),
);

router.get(
  "/collaborative/top/songs",
  logged,
  affinityAllowed,
  async (req, res) => {
    const { user } = req as LoggedRequest;
    const { start, end, otherIds, mode } = validate(
      req.query,
      collaborativeSchema,
    );

    const result = await getCollaborativeBestSongs(
      [user._id.toString(), ...otherIds.filter(e => e.length > 0)],
      start,
      end,
      mode,
      50,
    );
    res.status(200).send(result);
  },
);

router.get(
  "/collaborative/top/albums",
  logged,
  affinityAllowed,
  async (req, res) => {
    const { user } = req as LoggedRequest;
    const { start, end, otherIds, mode } = validate(
      req.query,
      collaborativeSchema,
    );

    const result = await getCollaborativeBestAlbums(
      [user._id.toString(), ...otherIds],
      start,
      end,
      mode,
    );
    res.status(200).send(result);
  },
);

router.get(
  "/collaborative/top/artists",
  logged,
  affinityAllowed,
  async (req, res) => {
    const { user } = req as LoggedRequest;
    const { start, end, otherIds, mode } = validate(
      req.query,
      collaborativeSchema,
    );

    const result = await getCollaborativeBestArtists(
      [user._id.toString(), ...otherIds],
      start,
      end,
      mode,
    );
    res.status(200).send(result);
  },
);

router.get("/top/hour-repartition/songs", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end } = validate(req.query, interval);

  const tracks = await getBestOfHour(ItemType.track, user, start, end);
  res.status(200).send(tracks);
});

router.get(
  "/top/hour-repartition/albums",
  isLoggedOrGuest,
  async (req, res) => {
    const { user } = req as LoggedRequest;
    const { start, end } = validate(req.query, interval);

    const albums = await getBestOfHour(ItemType.album, user, start, end);
    res.status(200).send(albums);
  },
);

router.get(
  "/top/hour-repartition/artists",
  isLoggedOrGuest,
  async (req, res) => {
    const { user } = req as LoggedRequest;
    const { start, end } = validate(req.query, interval);

    const artists = await getBestOfHour(ItemType.artist, user, start, end);
    res.status(200).send(artists);
  },
);

router.get("/top/sessions", isLoggedOrGuest, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { start, end } = validate(req.query, interval);

  const result = await getLongestListeningSession(
    user._id.toString(),
    start,
    end,
  );
  res.status(200).send(result);
});

const booleanSchema = z.object({
  status: z.boolean()
});

router.post(
  "/sync-liked-songs",
  logged,
  withHttpClient,
  async (req, res) => {
    const { client, user } = req as LoggedRequest & SpotifyRequest;
    const { status } = validate(req.body, booleanSchema);
    logger.info(`[${user.username}]: Sync liked songs status: ${status}, current status: ${user.syncLikedSongsStatus}, current playlist id: ${user.syncLikedSongsPlaylistId}`);

    if (status) {
      try {
        await storeInUser("_id", user._id, { syncLikedSongsStatus: "active" });
        user.syncLikedSongsStatus = "active";

        try {
          let allPlaylists = await client.playlists();
          if (!user.syncLikedSongsPlaylistId || !allPlaylists.some(playlist => playlist.id === user.syncLikedSongsPlaylistId)) {
            user.syncLikedSongsPlaylistId = await client.createSyncLikedSongsPlaylist(user.username);
            await storeInUser("_id", user._id, { syncLikedSongsPlaylistId: user.syncLikedSongsPlaylistId });
            logger.info(`Created new playlist with ID ${user.syncLikedSongsPlaylistId}`);
          }
          client.syncLikedTracks(user);
        } catch (error) {
          logger.error("spotifyApi.ts syncLikedTracks() playlist fetch error: ", error);
          if (error.message.includes('not found')) {
            logger.info(`Playlist with ID ${user.syncLikedSongsPlaylistId} not found. Creating a new playlist...`);
            user.syncLikedSongsPlaylistId = await client.createSyncLikedSongsPlaylist(user.username);
            logger.info(`Created new playlist with ID ${user.syncLikedSongsPlaylistId}`);
            await storeInUser("_id", user._id, { syncLikedSongsPlaylistId: user.syncLikedSongsPlaylistId });
          } else {
            throw error;
          }
        }

        res.status(200).json({ success: true, playlistId: user.syncLikedSongsPlaylistId });
      } catch (e) {
        logger.error(e);
        await storeInUser("_id", user._id, { syncLikedSongsStatus: "failed" });
        res.status(500).json({ success: false, error: e.message });
        return;
      }
    } else {
      await storeInUser("_id", user._id, { syncLikedSongsStatus: "inactive" });
      res.status(200).json({ success: true });
      return;
    }
  }
);

router.get(
  "/sync-liked-songs-status",
  logged,
  withHttpClient,
  async (req, res) => {
    const { user } = req as LoggedRequest & SpotifyRequest;

    try {
      if (user.syncLikedSongsStatus === "inactive") {
        res.status(400).json({
          success: false,
          status: user.syncLikedSongsStatus,
          error: "Sync disabled"
        });
        return;
      }
      else if (!user.syncLikedSongsPlaylistId && (user.syncLikedSongsStatus === "active" || user.syncLikedSongsStatus === "loading")) {
        res.status(400).json({
          success: false,
          status: user.syncLikedSongsStatus,
          error: "Sync failed, no playlist id found"
        });
        return;
      } else if (user.syncLikedSongsStatus === "failed") {
        res.status(500).json({
          success: false,
          status: user.syncLikedSongsStatus,
          error: "Sync failed"
        });
        return;
      }

      res.status(200).send({
        success: true,
        status: user.syncLikedSongsStatus
      });
      return;
    } catch (e) {
      logger.error(e);
      res.status(500).json({
        success: false,
        status: user.syncLikedSongsStatus,
        error: e.message
      });
      return;
    }
  }
)

const playlistSchema = z.object({
  playlistId: z.string(),
});

router.get("/playlist",
  logged,
  withHttpClient,
  async (req, res) => {
    const { client } = req as LoggedRequest & SpotifyRequest;
    const { playlistId } = validate(req.query, playlistSchema);

    const playlist = await client.getPlaylist(playlistId);
    res.status(200).send(playlist);
  });

router.get("/playlists", logged, withHttpClient, async (req, res) => {
  const { client, user } = req as LoggedRequest & SpotifyRequest;

  const playlists = await client.playlists();
  res
    .status(200)
    .send(playlists.filter(playlist => playlist.owner.id === user.spotifyId));
});

const createPlaylistBase = z.object({
  playlistId: z.string().optional(),
  name: z.string().optional(),
  sortKey: z.string().default("count"),
});

const createPlaylistFromTop = z.object({
  type: z.literal("top"),
  interval: z.object({
    start: z.preprocess(toDate, z.date()),
    end: z.preprocess(
      toDate,
      z.date().default(() => new Date()),
    ),
  }),
  nb: z.number(),
});

const createPlaylistFromAffinity = z.object({
  type: z.literal("affinity"),
  interval: z.object({
    start: z.preprocess(toDate, z.date()),
    end: z.preprocess(
      toDate,
      z.date().default(() => new Date()),
    ),
  }),
  nb: z.number(),
  userIds: z.array(z.string()),
  mode: z.nativeEnum(CollaborativeMode),
});

const createPlaylistFromSingle = z.object({
  type: z.literal("single"),
  songId: z.string(),
});

const createPlaylist = z.discriminatedUnion("type", [
  createPlaylistBase.merge(createPlaylistFromTop),
  createPlaylistBase.merge(createPlaylistFromSingle),
  createPlaylistBase.merge(createPlaylistFromAffinity),
]);

router.post("/playlist/create", logged, withHttpClient, async (req, res) => {
  const { client, user } = req as LoggedRequest & SpotifyRequest;
  const body = validate(req.body, createPlaylist);

  if (!body.playlistId && !body.name) {
    res.status(400).end();
    return;
  }

  let playlistName = body.name;
  let spotifyIds: string[];
  if (body.type === "top") {
    const { interval: intervalData, nb, sortKey } = body;
    const items = await getBest(
      ItemType.track,
      user,
      intervalData.start,
      intervalData.end,
      nb,
      0,
    );
    spotifyIds = items.map(item => item.track.id);
    if (!playlistName) {
      playlistName = `Top songs • ${intervalToDisplay(
        user.settings.dateFormat,
        intervalData.start,
        intervalData.end,
      )}`;
    }
  } else if (body.type === "affinity") {
    if (!playlistName) {
      playlistName = `Your Spotify Playlist • ${DateFormatter.toDayMonthYear(user.settings.dateFormat, new Date())}`;
    }
    const affinity = await getCollaborativeBestSongs(
      body.userIds,
      body.interval.start,
      body.interval.end,
      body.mode,
      body.nb,
    );
    spotifyIds = affinity.map(item => item.track.id);
  } else {
    if (!playlistName) {
      playlistName = `Your Spotify Playlist • ${DateFormatter.toDayMonthYear(user.settings.dateFormat, new Date())}`;
    }
    spotifyIds = [body.songId];
  }
  if (body.playlistId) {
    await client.addToPlaylist(body.playlistId, spotifyIds);
  } else {
    await client.createPlaylist(playlistName, spotifyIds);
  }
  res.status(204).end();
});

const removeLikedSchema = z.object({
  playlistId: z.string(),
});

router.post("/playlist/remove-likedsongs", logged, withHttpClient, async (req, res) => {
  const { client } = req as LoggedRequest & SpotifyRequest;
  const { playlistId } = validate(req.body, removeLikedSchema);

  const likedTracks = await client.getUsersSavedTracks();
  const likedIds = likedTracks.map(t => t.track.id);
  await client.removePlaylistTracks(playlistId, likedIds);

  res.status(200).json({
    success: true
  });
});

router.post('/backup-liked-songs', logged, withHttpClient, async (req, res) => {
  const { client, user } = req as LoggedRequest & SpotifyRequest;
  const { status } = validate(req.body, booleanSchema);

  if (status) {
    await storeInUser('_id', user._id, { likedSongsBackupStatus: 'active' });
    await client.backupLikedSongs(user);
    res.status(200).json({ success: true });
  } else {
    await storeInUser('_id', user._id, { likedSongsBackupStatus: 'inactive' });
    res.status(200).json({ success: true });
  }
});

const playlistBackupConfigSchema = z.object({
  playlistId: z.string(),
  playlistName: z.string(),
  status: z.boolean(),
});

router.post('/playlist-backup/config', logged, async (req, res) => {
  const { user } = req as LoggedRequest;
  const body = validate(req.body, playlistBackupConfigSchema);
  await updatePlaylistBackupConfig(user._id.toString(), body.playlistId, {
    playlistName: body.playlistName,
    active: body.status,
  });
  res.status(200).json({ success: true });
});

router.get('/playlist-backup/configs', logged, async (req, res) => {
  const { user } = req as LoggedRequest;
  const configs = await getPlaylistBackupConfigs(user._id.toString());
  res.status(200).send(configs);
});

router.get('/playlist-backup/:playlistId/versions', logged, async (req, res) => {
  const { user } = req as LoggedRequest;
  const { playlistId } = req.params;
  const backups = await getPlaylistBackups(user._id.toString(), playlistId);

  const backupsWithCount = backups.map((backup, index) => {
    const relevant = backups.slice(0, index + 1);
    const songs = new Set<string>();
    for (const b of relevant) {
      for (const c of b.changes) {
        if (c.action === 'add') songs.add(c.songId);
        else songs.delete(c.songId);
      }
    }
    return {
      id: backup._id,
      date: backup.createdAt,
      count: songs.size,
    };
  });

  res.status(200).send(backupsWithCount);
});

router.post(
  '/playlist-backup/:playlistId/restore',
  logged,
  withHttpClient,
  async (req, res) => {
    const { client, user } = req as LoggedRequest & SpotifyRequest;
    const { playlistId } = req.params;
    const body = validate(req.body, z.object({ id: z.string() }));
    const backups = await getPlaylistBackupsUntil(
      user._id.toString(),
      playlistId,
      new Date(8640000000000000),
    );
    const targetIndex = backups.findIndex(b => b._id.toString() === body.id);
    if (targetIndex === -1) {
      res.status(404).end();
      return;
    }
    const relevant = backups.slice(0, targetIndex + 1);
    const songs = new Set<string>();
    for (const b of relevant) {
      for (const c of b.changes) {
        if (c.action === 'add') songs.add(c.songId);
        else songs.delete(c.songId);
      }
    }
    const current = await client.getPlaylistTracks(playlistId);
    const currentIds = current.map(t => t.track.id);
    const toAdd = Array.from(songs).filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !songs.has(id));
    if (toAdd.length) await client.addToPlaylist(playlistId, toAdd, 0);
    if (toRemove.length) await client.removePlaylistTracks(playlistId, toRemove);
    await client.backupPlaylist(user, playlistId);
    res.status(200).json({ success: true });
  },
);

router.get('/backup-liked-songs/versions', logged, async (req, res) => {
  const { user } = req as LoggedRequest;
  const backups = await getBackups(user._id.toString());
  
  // Calculate count for each backup (like in restore function)
  const backupsWithCount = backups.map((backup, index) => {
    const relevant = backups.slice(0, index + 1);
    const songs = new Set<string>();
    for (const b of relevant) {
      for (const c of b.changes) {
        if (c.action === 'add') songs.add(c.songId);
        else songs.delete(c.songId);
      }
    }
    return {
      id: backup._id,
      date: backup.createdAt,
      count: songs.size
    };
  });
  
  res.status(200).send(backupsWithCount);
});

router.post(
  '/backup-liked-songs/restore',
  logged,
  withHttpClient,
  async (req, res) => {
    const { client, user } = req as LoggedRequest & SpotifyRequest;
    const body = validate(req.body, z.object({ id: z.string() }));
    const backups = await getBackupsUntil(
      user._id.toString(),
      new Date(8640000000000000),
    );
    const targetIndex = backups.findIndex(b => b._id.toString() === body.id);
    if (targetIndex === -1) {
      res.status(404).end();
      return;
    }
    const relevant = backups.slice(0, targetIndex + 1);
    const songs = new Set<string>();
    for (const b of relevant) {
      for (const c of b.changes) {
        if (c.action === 'add') songs.add(c.songId);
        else songs.delete(c.songId);
      }
    }
    const current = await client.getUsersSavedTracks();
    const currentIds = current.map(t => t.track.id);
    const toAdd = Array.from(songs).filter(id => !currentIds.includes(id));
    const toRemove = currentIds.filter(id => !songs.has(id));
    if (toAdd.length) await client.addUsersSavedTracks(toAdd);
    if (toRemove.length) await client.removeUsersSavedTracks(toRemove);
    await client.backupLikedSongs(user);
    res.status(200).json({ success: true });
  },
);

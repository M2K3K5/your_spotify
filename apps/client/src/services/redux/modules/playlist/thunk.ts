import { api } from "../../../apis/api";
import { myAsyncThunk } from "../../tools";
import { Playlist, PlaylistContext } from "./types";

export const fetchPlaylists = myAsyncThunk<Playlist[] | null, void>(
  "@playlist/fetch",
  async () => {
    try {
      const { data } = await api.getPlaylists();
      return data;
    } catch (e) {
      console.error(e);
    }
    return null;
  },
);

type AddToPlaylistPayload =
  | { id: string; context: PlaylistContext }
  | { id: undefined; name: string; context: PlaylistContext };

export const addToPlaylist = myAsyncThunk<void, AddToPlaylistPayload>(
  "@playlist/add",
  async (payload, tapi) => {
    try {
      await api.addToPlaylist(
        payload.id,
        "name" in payload ? payload.name : undefined,
        payload.context,
      );
      tapi.dispatch(fetchPlaylists());
    } catch (e) {
      console.error(e);
    }
  },
);

export const backupLikedSongs = myAsyncThunk<void, boolean>(
  "@playlist/backup-liked-songs",
  async (enable, tapi) => {
    try {
      await api.backupLikedSongs(enable);
      tapi.dispatch(fetchPlaylists());
    } catch (e) {
      console.error(e);
    }
  }
);

export const restoreLikedSongsBackup = myAsyncThunk<void, string>(
  "@playlist/backup-liked-songs/restore",
  async (versionId, tapi) => {
    try {
      await api.restoreBackup(versionId);
      tapi.dispatch(fetchPlaylists());
    } catch (e) {
      console.error(e);
    }
  }
);

export const fetchLikedSongsBackupVersions = myAsyncThunk<{ id: string; date: string }[] | null, void>(
  "@playlist/backup-liked-songs/versions",
  async () => {
    try {
      const { data } = await api.getBackupVersions();
      return data;
    } catch (e) {
      console.error(e);
    }
    return null;
  }
);
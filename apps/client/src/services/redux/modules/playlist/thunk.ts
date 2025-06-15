import { api } from "../../../apis/api";
import { myAsyncThunk } from "../../tools";
import { alertMessage } from "../message/reducer";
import { checkLogged } from "../user/thunk";
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


export const setPlaylistBackup = myAsyncThunk<
  boolean,
  { playlistId: string; playlistName: string; status: boolean }
>("@playlist/playlist-backup/set", async ({ playlistId, playlistName, status }, tapi) => {
  try {
    const resp = await api.setPlaylistBackup(playlistId, playlistName, status);
    return resp.data.success;
  } catch (e) {
    console.error(e);
    tapi.dispatch(
      alertMessage({
        level: "error",
        message: `Could not ${status ? "enable" : "disable"} backup for ${playlistName}`,
      })
    );
    return false;
  }
});

export const fetchPlaylistBackupSubscriptions = myAsyncThunk<
  { playlistId: string; playlistName: string; active: boolean }[] | null,
  void
>("@playlist/playlist-backup/configs", async () => {
  try {
    const { data } = await api.getPlaylistBackupSubscriptions();
    return data;
  } catch (e) {
    console.error(e);
  }
  return null;
});

export const fetchPlaylistBackupVersions = myAsyncThunk<
  { id: string; date: string; count: number }[] | null,
  string
>("@playlist/playlist-backup/versions", async (playlistId, tapi) => {
  try {
    const { data } = await api.getPlaylistBackupVersions(playlistId);
    return data;
  } catch (e) {
    console.error(e);
    tapi.dispatch(
      alertMessage({
        level: "error",
        message: `Could not load backups for playlist`,
      })
    );
  }
  return null;
});

export const restorePlaylistBackup = myAsyncThunk<
  boolean,
  { playlistId: string; id: string; playlistName: string }
>("@playlist/playlist-backup/restore", async ({ playlistId, id, playlistName }, tapi) => {
  try {
    const resp = await api.restorePlaylistBackup(playlistId, id);
    return resp.data.success;
  } catch (e) {
    console.error(e);
    tapi.dispatch(
      alertMessage({
        level: "error",
        message: `Could not restore backup for ${playlistName}`,
      })
    );
    return false;
  }
});

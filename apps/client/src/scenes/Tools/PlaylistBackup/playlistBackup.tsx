import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import { api } from '../../../services/apis/api';
import { useAPI } from '../../../services/hooks/hooks';
import { selectUser } from '../../../services/redux/modules/user/selector';
import { Playlist } from '../../../services/redux/modules/playlist/types';
import s from './index.module.css';

interface Subscription {
  playlistId: string;
  playlistName: string;
  active: boolean;
}

export default function PlaylistBackup() {
  const user = useSelector(selectUser);
  const playlists = useAPI(api.getPlaylists);
  const playlistsWithLiked = useMemo(() => {
    if (!playlists || !user) return playlists;
    const liked: Playlist = {
      id: 'liked',
      name: 'Liked Songs',
      owner: { id: user.id },
      images: [],
      tracks: { total: 0, items: [] },
    };
    return [liked, ...playlists];
  }, [playlists, user]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [selected, setSelected] = useState<Playlist | null>(null);
  const [manageId, setManageId] = useState('');
  const [versionsMap, setVersionsMap] = useState<Record<string, { id: string; date: string; count: number }[]>>({});
  const [selectedVersion, setSelectedVersion] = useState('');

  const refreshSubscriptions = useCallback(async () => {
    const { data } = await api.getPlaylistBackupSubscriptions();
    setSubscriptions(data);
  }, []);

  useEffect(() => {
    refreshSubscriptions();
  }, [refreshSubscriptions]);

  useEffect(() => {
    async function load() {
      const entries = await Promise.all(
        subscriptions
          .filter(s => s.active)
          .map(async s => {
            const { data } = await api.getPlaylistBackupVersions(s.playlistId);
            return [s.playlistId, data] as const;
          }),
      );
      const obj: Record<string, { id: string; date: string; count: number }[]> = {};
      entries.forEach(([id, data]) => {
        obj[id] = data;
      });
      setVersionsMap(obj);
    }
    if (subscriptions.length) {
      load().catch(console.error);
    } else {
      setVersionsMap({});
    }
  }, [subscriptions]);

  const toggle = useCallback(
    async (pl: Pick<Playlist, 'id' | 'name'>) => {
      const existing = subscriptions.find(s => s.playlistId === pl.id);
      const newStatus = !existing?.active;
      const { data } = await api.setPlaylistBackup(pl.id, pl.name, newStatus);
      if (data.success) refreshSubscriptions();
    },
    [subscriptions, refreshSubscriptions],
  );

  const filtered = playlistsWithLiked ?? [];

  if (!user) return null;

  return (
    <div>
      <Header title="Playlist backup" subtitle="Manage playlist backups" />
      <div className={s.content}>
        <div className={s.section}>
          <Text element="h2">Start a backup</Text>
          <div className={s.row}>
            <Autocomplete
              fullWidth
              options={filtered}
              getOptionLabel={(pl: Playlist) => pl.name}
              value={selected}
              onChange={(ev, val) => setSelected(val)}
              renderInput={params => <TextField {...params} label="Select playlist" />}
            />
            {selected && (
              <Button variant="contained" onClick={() => toggle(selected)}>
                {
                  subscriptions.find(s => s.playlistId === selected.id)?.active
                    ? `Disable ${selected.name}`
                    : `Enable ${selected.name}`
                }
              </Button>
            )}
          </div>
        </div>
        <div className={s.section}>
          <Text element="h2">Current backups</Text>
          <div className={s.row}>
            <FormControl fullWidth>
              <InputLabel id="managed-playlist">Playlist</InputLabel>
              <Select
                labelId="managed-playlist"
                label="Playlist"
                value={manageId}
                onChange={ev => {
                  setManageId(ev.target.value as string);
                  setSelectedVersion('');
                }}
              >
                {subscriptions
                  .filter(s => s.active)
                  .map(s => (
                    <MenuItem key={s.playlistId} value={s.playlistId}>
                      {s.playlistName}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>
            {manageId && (
              <Button
                variant="outlined"
                color="warning"
                onClick={() =>
                  toggle({ id: manageId, name: subscriptions.find(s => s.playlistId === manageId)?.playlistName || '' } as Playlist)
                }
              >
                Disable Backup
              </Button>
            )}
          </div>
          {manageId && (
            <div className={s.row}>
              <FormControl fullWidth>
                <InputLabel id="version-select">Version</InputLabel>
                <Select
                  labelId="version-select"
                  label="Version"
                  value={selectedVersion || versionsMap[manageId]?.[0]?.id || ''}
                  onChange={ev => setSelectedVersion(ev.target.value as string)}
                >
                  {(versionsMap[manageId] || []).map(v => (
                    <MenuItem key={v.id} value={v.id}>
                      {new Date(v.date).toLocaleString()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="contained"
                disabled={!(selectedVersion || versionsMap[manageId]?.[0])}
                onClick={() =>
                  api
                    .restorePlaylistBackup(manageId, selectedVersion || versionsMap[manageId]?.[0]?.id || '')
                    .then(() => refreshSubscriptions())
                }
              >
                Restore
              </Button>
            </div>
          )}
          {subscriptions.filter(s => s.active).length === 0 && (
            <Text>No active backups</Text>
          )}
        </div>
      </div>
    </div>
  );
}

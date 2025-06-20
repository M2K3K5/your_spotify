import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
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
  const [versionsMap, setVersionsMap] = useState<Record<string, { id: string; date: string; count: number }[]>>({});
  const [selectedVersions, setSelectedVersions] = useState<Record<string, string>>({});

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
        <div className={s.actions}>
          <Autocomplete
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
        <div className={s.table}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Playlist</TableCell>
                <TableCell>Backup date</TableCell>
                <TableCell colSpan={2}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {subscriptions.filter(s => s.active).map(s => {
                const versions = versionsMap[s.playlistId] || [];
                const latest = versions[0];
                const selectedId = selectedVersions[s.playlistId] || latest?.id || '';
                return (
                  <TableRow key={s.playlistId}>
                    <TableCell>{s.playlistName}</TableCell>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={selectedId}
                          onChange={ev =>
                            setSelectedVersions(prev => ({ ...prev, [s.playlistId]: ev.target.value as string }))
                          }
                        >
                          {versions.map(v => (
                            <MenuItem key={v.id} value={v.id}>
                              {new Date(v.date).toLocaleString()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!selectedId}
                        onClick={() =>
                          api
                            .restorePlaylistBackup(s.playlistId, selectedId)
                            .then(() => refreshSubscriptions())
                        }
                      >
                        Restore
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={() => toggle({ id: s.playlistId, name: s.playlistName } as Playlist)}
                      >
                        Disable Backup
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

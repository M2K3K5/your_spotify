import { Button, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import { api } from '../../../services/apis/api';
import { useAPI } from '../../../services/hooks/hooks';
import { selectUser } from '../../../services/redux/modules/user/selector';
import { Playlist } from '../../../services/redux/modules/playlist/types';
import s from './index.module.css';

interface Config {
  playlistId: string;
  playlistName: string;
  active: boolean;
}

export default function PlaylistBackup() {
  const user = useSelector(selectUser);
  const playlists = useAPI(api.getPlaylists);
  const [configs, setConfigs] = useState<Config[]>([]);
  const [search, setSearch] = useState('');
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');
  const [versions, setVersions] = useState<{ id: string; date: string; count: number }[] | null>(null);

  const refreshConfigs = useCallback(async () => {
    const { data } = await api.getPlaylistBackupConfigs();
    setConfigs(data);
  }, []);

  useEffect(() => {
    refreshConfigs();
  }, [refreshConfigs]);

  useEffect(() => {
    if (selectedPlaylist) {
      api.getPlaylistBackupVersions(selectedPlaylist).then(r => setVersions(r.data));
    } else {
      setVersions(null);
    }
  }, [selectedPlaylist]);

  const toggle = useCallback(
    async (pl: Playlist) => {
      const existing = configs.find(c => c.playlistId === pl.id);
      const newStatus = !existing?.active;
      const { data } = await api.setPlaylistBackup(pl.id, pl.name, newStatus);
      if (data.success) refreshConfigs();
    },
    [configs, refreshConfigs],
  );

  const filtered = useMemo(
    () =>
      playlists?.filter(pl =>
        pl.name.toLowerCase().includes(search.toLowerCase()),
      ) ?? [],
    [playlists, search],
  );

  if (!user) return null;

  return (
    <div>
      <Header title="Playlist backup" subtitle="Manage playlist backups" />
      <div className={s.content}>
        <TextField
          label="Search playlist"
          value={search}
          onChange={ev => setSearch(ev.target.value)}
        />
        {filtered.map(pl => {
          const cfg = configs.find(c => c.playlistId === pl.id);
          const active = cfg?.active ?? false;
          return (
            <Button key={pl.id} variant="contained" onClick={() => toggle(pl)}>
              {active ? `Disable ${pl.name}` : `Enable ${pl.name}`}
            </Button>
          );
        })}
        <FormControl fullWidth>
          <InputLabel id="pl-select">Select playlist</InputLabel>
          <Select
            labelId="pl-select"
            label="Select playlist"
            value={selectedPlaylist}
            onChange={ev => setSelectedPlaylist(ev.target.value)}
          >
            {configs
              .filter(c => c.active)
              .map(c => (
                <MenuItem key={c.playlistId} value={c.playlistId}>
                  {c.playlistName}
                </MenuItem>
              ))}
            <MenuItem value="liked">Liked songs</MenuItem>
          </Select>
        </FormControl>
        {versions && (
          <div>
            {versions.slice().reverse().map(v => (
              <Button
                key={v.id}
                onClick={() =>
                  api.restorePlaylistBackup(selectedPlaylist, v.id).then(() => refreshConfigs())
                }
              >
                {new Date(v.date).toLocaleString()} ({v.count} tracks)
              </Button>
            ))}
          </div>
        )}
        <Text element="div">Current backups:</Text>
        <ul>
          {configs
            .filter(c => c.active)
            .map(c => (
              <li key={c.playlistId}>{c.playlistName}</li>
            ))}
          {configs.every(c => c.playlistId !== 'liked') && <li>Liked songs</li>}
        </ul>
      </div>
    </div>
  );
}

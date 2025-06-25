import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Autocomplete,
  TextField,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import InlineTrack from '../../../components/InlineTrack';
import { Track } from '../../../services/types';
import { api } from '../../../services/apis/api';
import { useAPI } from '../../../services/hooks/hooks';
import { selectUser } from '../../../services/redux/modules/user/selector';
import { Playlist } from '../../../services/redux/modules/playlist/types';
import s from './index.module.css';

export default function PlaylistEdit() {
  const user = useSelector(selectUser);
  const playlists = useAPI(api.getPlaylists);
  const [selected, setSelected] = useState('');
  const [first, setFirst] = useState<Playlist | null>(null);
  const [second, setSecond] = useState<Playlist | null>(null);
  const [success, setSuccess] = useState<boolean | null>(null);
  const [diff, setDiff] = useState<{
    onlyInFirst: Track[];
    onlyInSecond: Track[];
  } | null>(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [compareId, setCompareId] = useState<string | null>(null);

  const likedOption = { id: 'liked', name: 'Liked songs' } as unknown as Playlist;
  const playlistOptions = (playlists ?? []).concat(likedOption);

  const remove = useCallback(async () => {
    if (!selected) return;
    const { data } = await api.removeLikedSongsFromPlaylist(selected);
    setSuccess(data.success);
  }, [selected]);

  const compare = useCallback(async () => {
    if (!first || !second) return;
    setDiff(null);
    setLoadingCompare(true);
    const { data } = await api.startComparePlaylists(first.id, second.id);
    setCompareId(data.id);
  }, [first, second]);

  useEffect(() => {
    if (!compareId) return;
    const interval = setInterval(async () => {
      const { data } = await api.getComparePlaylistsStatus(compareId);
      if (data.status === 'done') {
        setDiff(data.result ?? null);
        setLoadingCompare(false);
        setCompareId(null);
        clearInterval(interval);
      } else if (data.status === 'error') {
        setLoadingCompare(false);
        setCompareId(null);
        clearInterval(interval);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [compareId]);

  if (!user) {
    return null;
  }

  return (
    <div>
      <Header hideInterval title="Playlists edit" subtitle="Remove liked songs from a playlist" />
      <div className={s.content}>
        <FormControl fullWidth>
          <InputLabel id="playlist">Select a playlist</InputLabel>
          <Select
            labelId="playlist"
            label="Select a playlist"
            value={selected}
            onChange={ev => setSelected(ev.target.value)}>
            {playlists?.map((pl: Playlist) => (
              <MenuItem key={pl.id} value={pl.id}>
                {pl.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" disabled={!selected} onClick={remove}>
          Remove liked songs
        </Button>
        <div className={s.compareInputs}>
          <Autocomplete
            fullWidth
            options={playlistOptions}
            getOptionLabel={(pl: Playlist) => pl.name}
            value={first}
            onChange={(ev, val) => setFirst(val)}
            renderInput={params => <TextField {...params} label="First playlist" />}
            filterOptions={(options) =>
              options.filter(o => !second || o.id !== second.id)
            }
          />
          <Autocomplete
            fullWidth
            options={playlistOptions}
            getOptionLabel={(pl: Playlist) => pl.name}
            value={second}
            onChange={(ev, val) => setSecond(val)}
            renderInput={params => <TextField {...params} label="Second playlist" />}
            filterOptions={(options) =>
              options.filter(o => !first || o.id !== first.id)
            }
          />
          <Button
            variant="contained"
            disabled={!first || !second || loadingCompare}
            onClick={compare}
          >
            Compare playlists
          </Button>
        </div>
        {loadingCompare && <Text element="div">Comparing...</Text>}
        {success !== null && (
          <Text element="div">Success: {success.toString()}</Text>
        )}
        {diff && first && second && (
          <div className={s.tableContainer}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>Only in {first.name}</th>
                  <th>Only in {second.name}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from({
                  length: Math.max(diff.onlyInFirst.length, diff.onlyInSecond.length),
                }).map((_, idx) => (
                  <tr key={idx}>
                    <td>
                      {diff.onlyInFirst[idx] && <InlineTrack track={diff.onlyInFirst[idx]} />}
                    </td>
                    <td>
                      {diff.onlyInSecond[idx] && <InlineTrack track={diff.onlyInSecond[idx]} />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

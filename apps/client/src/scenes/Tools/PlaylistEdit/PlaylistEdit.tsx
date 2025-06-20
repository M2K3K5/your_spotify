import { Button, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import { api } from '../../../services/apis/api';
import { useAPI } from '../../../services/hooks/hooks';
import { selectUser } from '../../../services/redux/modules/user/selector';
import { Playlist } from '../../../services/redux/modules/playlist/types';
import s from './index.module.css';

export default function PlaylistEdit() {
  const user = useSelector(selectUser);
  const playlists = useAPI(api.getPlaylists);
  const [selected, setSelected] = useState('');
  const [success, setSuccess] = useState<boolean | null>(null);

  const remove = useCallback(async () => {
    if (!selected) return;
    const { data } = await api.removeLikedSongsFromPlaylist(selected);
    setSuccess(data.success);
  }, [selected]);

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
        {success !== null && (
          <Text element="div">Success: {success.toString()}</Text>
        )}
      </div>
    </div>
  );
}

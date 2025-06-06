import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import { api } from '../../../services/apis/api';
import { useAPI } from '../../../services/hooks/hooks';
import { selectUser } from '../../../services/redux/modules/user/selector';
import s from './index.module.css';

export default function LikedSongsBackup() {
  const user = useSelector(selectUser);
  const versions = useAPI(api.getBackupVersions);
  const [selected, setSelected] = useState('');
  const [success, setSuccess] = useState<boolean | null>(null);

  const restore = useCallback(async () => {
    if (!selected) return;
    await api.restoreBackup(selected);
    setSuccess(true);
  }, [selected]);

  const toggle = useCallback(async () => {
    const enable = user?.likedSongsBackupStatus !== 'active';
    await api.backupLikedSongs(enable);
    setSuccess(null);
  }, [user]);

  if (!user) return null;

  return (
    <div>
      <Header title="Liked songs backup" subtitle="Restore your liked songs" />
      <div className={s.content}>
        <Button variant="contained" onClick={toggle}>
          {user.likedSongsBackupStatus === 'active' ? 'Disable' : 'Enable'}
        </Button>
        <FormControl fullWidth>
          <InputLabel id="version">Select a backup</InputLabel>
          <Select
            labelId="version"
            label="Select a backup"
            value={selected}
            onChange={ev => setSelected(ev.target.value)}
          >
            {versions?.map(v => (
              <MenuItem key={v.id} value={v.id}>
                {new Date(v.date).toLocaleDateString()}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button variant="contained" disabled={!selected} onClick={restore}>
          Restore
        </Button>
        {success && <Text element="div">Restored</Text>}
      </div>
    </div>
  );
}

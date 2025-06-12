import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useCallback, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Header from '../../../components/Header';
import Text from '../../../components/Text';
import { api } from '../../../services/apis/api';
import { useAPI } from '../../../services/hooks/hooks';
import { selectUser } from '../../../services/redux/modules/user/selector';
import s from './index.module.css';

export default function LikedSongsBackup() {
  const user = useSelector(selectUser);
  const backupVersions = useAPI(api.getBackupVersions);
  const [selectedVersionId, setSelectedVersionId] = useState('');
  const [restoreSuccessMessage, setRestoreSuccessMessage] = useState<boolean | null>(null);
  const [isBackupEnabled, setIsBackupEnabled] = useState<boolean>(false);

  useEffect(() => {
    setIsBackupEnabled(user?.likedSongsBackupStatus === 'active');
  }, [user?.likedSongsBackupStatus]);

  const restoreFromBackup = useCallback(async () => {
    if (!selectedVersionId) return;

    const response = await api.restoreBackup(selectedVersionId);
    setRestoreSuccessMessage(response.data.success);
  }, [selectedVersionId]);

  const toggleBackup = useCallback(async () => {
    const shouldEnable = !isBackupEnabled;
    const response = await api.backupLikedSongs(shouldEnable);

    if (response.data.success) {
      setIsBackupEnabled(shouldEnable);
    }
    setRestoreSuccessMessage(null);
  }, [isBackupEnabled]);

  if (!user) return null;

  return (
    <div>
      <Header title="Liked songs backup" subtitle="Restore your liked songs" />
      <div className={s.content}>
        <Button variant="contained" onClick={toggleBackup}>
          {isBackupEnabled ? 'Disable Backup' : 'Enable Backup'}
        </Button>

        <FormControl fullWidth>
          <InputLabel id="version-select">Select a backup</InputLabel>
          <Select
            labelId="version-select"
            label="Select a backup"
            value={selectedVersionId}
            onChange={ev => setSelectedVersionId(ev.target.value)}
          >
            {backupVersions?.slice().reverse().map(version => (
              <MenuItem key={version.id} value={version.id}>
                {new Date(version.date).toLocaleString()} ({version.count} songs)
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          disabled={!selectedVersionId}
          onClick={restoreFromBackup}
        >
          Restore Selected Backup
        </Button>

        {restoreSuccessMessage && (
          <Text element="div">Backup restored successfully!</Text>
        )}
      </div>
    </div>
  );
}
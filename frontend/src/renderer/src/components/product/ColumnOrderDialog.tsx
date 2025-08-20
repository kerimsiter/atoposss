import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Stack,
  Box,
  Typography,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Restore } from '@mui/icons-material';

export interface ColumnOrderDialogProps {
  open: boolean;
  onClose: () => void;
  // Mevcut tüm kolon alanları sırası (varsayılan sıra)
  defaultFields: string[];
  // Görünen etiket haritası (field -> label)
  labels: Record<string, string>;
  // Anlık aktif sıra (persist edilen ya da varsayılan)
  value: string[];
  onChange: (nextOrder: string[]) => void;
}

const ColumnOrderDialog: React.FC<ColumnOrderDialogProps> = ({
  open,
  onClose,
  defaultFields,
  labels,
  value,
  onChange,
}) => {
  const [localOrder, setLocalOrder] = useState<string[]>(value);

  React.useEffect(() => {
    setLocalOrder(value);
  }, [value, open]);

  const fullList = useMemo(() => {
    // Her ihtimale karşı tum mevcut alanları içerdiğinden emin ol
    const set = new Set(localOrder);
    const result = [...localOrder];
    defaultFields.forEach((f) => { if (!set.has(f)) result.push(f); });
    return result;
  }, [localOrder, defaultFields]);

  const move = (idx: number, dir: -1 | 1) => {
    const next = [...fullList];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(idx, 1);
    next.splice(target, 0, item);
    setLocalOrder(next);
  };

  const handleReset = () => setLocalOrder(defaultFields);
  const handleSave = () => { onChange(fullList); onClose(); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Kolon Sırası</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Sütunları yukarı/aşağı tuşlarıyla yeniden sırala. Kaydet ile uygula.
        </Typography>
        <List dense disablePadding>
          {fullList.map((f, i) => (
            <ListItem
              key={f}
              secondaryAction={
                <Stack direction="row" spacing={1}>
                  <IconButton size="small" onClick={() => move(i, -1)} aria-label="Yukarı">
                    <ArrowUpward fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => move(i, 1)} aria-label="Aşağı">
                    <ArrowDownward fontSize="small" />
                  </IconButton>
                </Stack>
              }
            >
              <ListItemText
                primary={labels[f] || f}
                primaryTypographyProps={{ sx: { fontSize: '0.9rem' } }}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'space-between' }}>
        <Box>
          <Button startIcon={<Restore />} onClick={handleReset} color="inherit">
            Sıfırla
          </Button>
        </Box>
        <Box>
          <Button onClick={onClose} sx={{ mr: 1 }}>
            İptal
          </Button>
          <Button variant="contained" onClick={handleSave}>
            Kaydet
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default ColumnOrderDialog;

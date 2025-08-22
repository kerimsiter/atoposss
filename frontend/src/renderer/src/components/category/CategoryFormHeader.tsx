import React from 'react';
import { Stack, Avatar, Box, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import ModernButton from '../ui/ModernButton';

interface CategoryFormHeaderProps {
  isEditMode: boolean;
  onClose: () => void;
}

const CategoryFormHeader: React.FC<CategoryFormHeaderProps> = ({ isEditMode, onClose }) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{
          background: isEditMode
            ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
            : 'linear-gradient(135deg, #779DFF 0%, #2D68FF 100%)',
          width: 48,
          height: 48
        }}>
          {isEditMode ? <EditIcon /> : <AddIcon />}
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {isEditMode ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode ? 'Mevcut kategori bilgilerini güncelleyin' : 'Yeni bir kategori oluşturun'}
          </Typography>
        </Box>
      </Stack>
      <ModernButton glassmorphism onClick={onClose} sx={{ minWidth: 'auto', p: 1.5 }}>
        <CloseIcon />
      </ModernButton>
    </Stack>
  );
};

export default CategoryFormHeader;

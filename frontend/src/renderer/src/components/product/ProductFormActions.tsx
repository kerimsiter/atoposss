import React from 'react';
import { Stack, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import ModernButton from '../ui/ModernButton';

interface ProductFormActionsProps {
  isEditMode: boolean;
  loading: boolean;
  metaLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const ProductFormActions: React.FC<ProductFormActionsProps> = ({
  isEditMode,
  loading,
  metaLoading,
  onClose,
  onSubmit
}) => {
  return (
    <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'flex-end' }}>
      <ModernButton
        onClick={onClose}
        disabled={loading}
        size="large"
        sx={{
          background: '#F1F1F1',
          border: '1px solid #E0E0E0',
          color: '#1B1B1B',
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          '&:hover': {
            background: '#EBEBEB',
            border: '1px solid #D0D0D0',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        İptal
      </ModernButton>
      <ModernButton
        onClick={onSubmit}
        disabled={loading || metaLoading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        size="large"
        sx={{
          minWidth: 140,
          background: '#2D68FF',
          color: 'white',
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          '&:hover': {
            background: '#1E5AFF',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        {loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
      </ModernButton>
    </Stack>
  );
};

export default ProductFormActions;

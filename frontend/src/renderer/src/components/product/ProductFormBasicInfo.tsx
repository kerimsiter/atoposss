import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ModernTextField from '../ui/ModernTextField';

interface ProductFormBasicInfoProps {
  formData: any;
  handleInputChange: (field: string) => (event: any) => void;
  formErrors: any;
}

const ProductFormBasicInfo: React.FC<ProductFormBasicInfoProps> = ({
  formData,
  handleInputChange,
  formErrors
}) => {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1B1B1B' }}>
        Temel Bilgiler
      </Typography>
      <Stack spacing={3}>
        <ModernTextField
          label="Ürün Adı *"
          value={formData.name}
          onChange={handleInputChange('name')}
          error={!!formErrors.name}
          helperText={formErrors.name}
          fullWidth
          placeholder="Örn: Premium Kahve"
        />
        <Stack direction="row" spacing={2}>
          <ModernTextField
            label="Ürün Kodu *"
            value={formData.code}
            onChange={handleInputChange('code')}
            error={!!formErrors.code}
            helperText={formErrors.code}
            sx={{ flex: 1 }}
            placeholder="Örn: PRD001"
          />
          <ModernTextField
            label="Barkod"
            value={formData.barcode}
            onChange={handleInputChange('barcode')}
            sx={{ flex: 1 }}
            placeholder="Örn: 1234567890123"
          />
        </Stack>
        <ModernTextField
          label="Açıklama"
          value={formData.description}
          onChange={handleInputChange('description')}
          multiline
          rows={3}
          fullWidth
          placeholder="Ürün hakkında detaylı bilgi..."
        />
      </Stack>
    </Box>
  );
};

export default ProductFormBasicInfo;

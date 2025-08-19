import React from 'react';
import { Box, Stack, Typography, Divider, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { LocalOffer as PriceIcon } from '@mui/icons-material';
import ModernTextField from '../ui/ModernTextField';

interface ProductFormPricingProps {
  formData: any;
  handleInputChange: (field: string) => (event: any) => void;
  formErrors: any;
  unitOptions: { value: string; label: string }[];
}

const ProductFormPricing: React.FC<ProductFormPricingProps> = ({
  formData,
  handleInputChange,
  formErrors,
  unitOptions
}) => {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <PriceIcon color="success" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Fiyat ve Birim
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2}>
        <ModernTextField
          label="Fiyat *"
          type="number"
          value={formData.basePrice}
          onChange={handleInputChange('basePrice')}
          error={!!formErrors.basePrice}
          helperText={formErrors.basePrice}
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">₺</InputAdornment>,
            }
          }}
          sx={{ flex: 1 }}
          placeholder="0.00"
        />
        <FormControl sx={{ flex: 1 }} error={!!formErrors.unit}>
          <InputLabel>Birim *</InputLabel>
          <Select
            value={formData.unit}
            label="Birim *"
            onChange={handleInputChange('unit')}
            sx={{
              borderRadius: 3,
              background: 'rgba(253, 253, 253, 0.8)',
              backdropFilter: 'blur(16px)',
            }}
          >
            {unitOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
};

export default ProductFormPricing;

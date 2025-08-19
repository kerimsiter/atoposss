import React from 'react';
import { Box, Stack, Typography, FormControlLabel, Switch } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { Inventory as StockIcon } from '@mui/icons-material';

interface ProductFormStockProps {
  trackStock?: boolean; // backward compatibility, unused with RHF
  handleSwitchChange?: (field: string) => (event: any) => void; // backward compatibility
}

const ProductFormStock: React.FC<ProductFormStockProps> = () => {
  const { control } = useFormContext<any>();
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <StockIcon color="warning" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Stok Yönetimi
        </Typography>
      </Stack>
      <Box sx={{
        p: 3,
        borderRadius: 2,
        background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)',
        border: '1px solid rgba(255, 152, 0, 0.2)',
      }}>
        <Controller
          name="trackStock"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Switch
                  checked={!!field.value}
                  onChange={(_, checked) => field.onChange(checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: '#FF9800',
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: '#FF9800',
                    },
                  }}
                />
              }
              label={
                <Box>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Stok Takibi Yapılsın
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Bu ürün için stok miktarı takip edilsin
                  </Typography>
                </Box>
              }
            />
          )}
        />
      </Box>
    </Box>
  );
};

export default ProductFormStock;

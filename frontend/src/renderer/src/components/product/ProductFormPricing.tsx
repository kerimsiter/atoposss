import React from 'react';
import { Box, Stack, Typography, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { Controller, useFormContext } from 'react-hook-form';
import { LocalOffer as PriceIcon } from '@mui/icons-material';
import ModernTextField from '../ui/ModernTextField';

interface ProductFormPricingProps {
  formData?: any; // backward compatibility, unused with RHF
  handleInputChange?: (field: string) => (event: any) => void; // backward compatibility
  formErrors?: any; // backward compatibility
  unitOptions: { value: string; label: string }[];
}

const ProductFormPricing: React.FC<ProductFormPricingProps> = ({ unitOptions }) => {
  const { control, formState } = useFormContext<any>();
  const { errors } = formState;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <PriceIcon color="success" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Fiyat ve Birim
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Controller
          name="basePrice"
          control={control}
          render={({ field }) => (
            <ModernTextField
              {...field}
              label="Fiyat *"
              type="number"
              value={field.value ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const raw = e.target.value;
                if (raw === '') return field.onChange(undefined);
                const normalized = raw.replace(',', '.');
                const num = Number(normalized);
                field.onChange(Number.isNaN(num) ? field.value : num);
              }}
              error={!!errors?.basePrice}
              helperText={errors?.basePrice?.message as string}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                  inputProps: { inputMode: 'decimal', pattern: '[0-9]*[.,]?[0-9]*' },
                }
              }}
              sx={{ flex: 1 }}
              placeholder="0.00"
            />
          )}
        />
        <Controller
          name="unit"
          control={control}
          render={({ field }) => (
            <FormControl sx={{ flex: 1 }} error={!!errors?.unit}>
              <InputLabel>Birim *</InputLabel>
              <Select
                {...field}
                label="Birim *"
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
          )}
        />
      </Stack>
    </Box>
  );
};

export default ProductFormPricing;

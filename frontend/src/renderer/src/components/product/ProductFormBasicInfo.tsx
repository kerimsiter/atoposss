import React from 'react';
import { Box, Stack, Typography } from '@mui/material';
import ModernTextField from '../ui/ModernTextField';
import { Controller, useFormContext } from 'react-hook-form';

interface ProductFormBasicInfoProps {
  formData?: any; // backward compatibility, unused with RHF
  handleInputChange?: (field: string) => (event: any) => void; // backward compatibility
  formErrors?: any; // backward compatibility
}

const ProductFormBasicInfo: React.FC<ProductFormBasicInfoProps> = () => {
  const { control, formState } = useFormContext<any>();
  const { errors } = formState;

  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#1B1B1B' }}>
        Temel Bilgiler
      </Typography>
      <Stack spacing={3}>
        <Controller
          name="name"
          control={control}
          render={({ field }) => (
            <ModernTextField
              {...field}
              label="Ürün Adı *"
              error={!!errors?.name}
              helperText={errors?.name?.message as string}
              fullWidth
              placeholder="Örn: Premium Kahve"
            />
          )}
        />
        <Stack direction="row" spacing={2}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <ModernTextField
                {...field}
                label="Ürün Kodu *"
                error={!!errors?.code}
                helperText={errors?.code?.message as string}
                sx={{ flex: 1 }}
                placeholder="Örn: PRD001"
              />
            )}
          />
          <Controller
            name="barcode"
            control={control}
            render={({ field }) => (
              <ModernTextField
                {...field}
                label="Barkod"
                sx={{ flex: 1 }}
                placeholder="Örn: 1234567890123"
              />
            )}
          />
        </Stack>
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <ModernTextField
              {...field}
              label="Açıklama"
              multiline
              rows={3}
              fullWidth
              placeholder="Ürün hakkında detaylı bilgi..."
            />
          )}
        />
      </Stack>
    </Box>
  );
};

export default ProductFormBasicInfo;

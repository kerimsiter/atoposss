import React from 'react';
import { Box, Stack, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Category as CategoryIcon } from '@mui/icons-material';
import { Category, Tax } from '../../stores/useMetaStore';
import { Controller, useFormContext } from 'react-hook-form';

interface ProductFormCategoriesProps {
  formData?: any; // backward compatibility, unused with RHF
  handleInputChange?: (field: string) => (event: any) => void; // backward compatibility
  formErrors?: any; // backward compatibility
  categories: Category[];
  taxes: Tax[];
  metaLoading: boolean;
}

const ProductFormCategories: React.FC<ProductFormCategoriesProps> = ({
  categories,
  taxes,
  metaLoading
}) => {
  const { control, formState } = useFormContext<any>();
  const { errors } = formState;
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CategoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Kategori ve Vergi
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2}>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <FormControl sx={{ flex: 1 }} error={!!errors?.categoryId}>
              <InputLabel>Kategori *</InputLabel>
              <Select
                {...field}
                label="Kategori *"
                disabled={metaLoading}
                sx={{
                  borderRadius: 3,
                  background: 'rgba(253, 253, 253, 0.8)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <MenuItem value="">
                  <em>Kategori Seçin</em>
                </MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
              {errors?.categoryId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                  {(errors?.categoryId as any)?.message}
                </Typography>
              )}
            </FormControl>
          )}
        />
        <Controller
          name="taxId"
          control={control}
          render={({ field }) => (
            <FormControl sx={{ flex: 1 }} error={!!errors?.taxId}>
              <InputLabel>Vergi Oranı *</InputLabel>
              <Select
                {...field}
                label="Vergi Oranı *"
                disabled={metaLoading}
                sx={{
                  borderRadius: 3,
                  background: 'rgba(253, 253, 253, 0.8)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <MenuItem value="">
                  <em>Vergi Oranı Seçin</em>
                </MenuItem>
                {taxes.map((tax) => (
                  <MenuItem key={tax.id} value={tax.id}>
                    {tax.name} ({tax.rate}%)
                  </MenuItem>
                ))}
              </Select>
              {errors?.taxId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                  {(errors?.taxId as any)?.message}
                </Typography>
              )}
            </FormControl>
          )}
        />
      </Stack>
    </Box>
  );
};

export default ProductFormCategories;

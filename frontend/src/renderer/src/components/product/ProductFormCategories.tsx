import React from 'react';
import { Box, Stack, Typography, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Category as CategoryIcon } from '@mui/icons-material';
import { Category, Tax } from '../../stores/useMetaStore';

interface ProductFormCategoriesProps {
  formData: any;
  handleInputChange: (field: string) => (event: any) => void;
  formErrors: any;
  categories: Category[];
  taxes: Tax[];
  metaLoading: boolean;
}

const ProductFormCategories: React.FC<ProductFormCategoriesProps> = ({
  formData,
  handleInputChange,
  formErrors,
  categories,
  taxes,
  metaLoading
}) => {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <CategoryIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Kategori ve Vergi
        </Typography>
      </Stack>
      <Stack direction="row" spacing={2}>
        <FormControl sx={{ flex: 1 }} error={!!formErrors.categoryId}>
          <InputLabel>Kategori *</InputLabel>
          <Select
            value={formData.categoryId || ''}
            label="Kategori *"
            onChange={handleInputChange('categoryId')}
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
          {formErrors.categoryId && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
              {formErrors.categoryId}
            </Typography>
          )}
        </FormControl>
        <FormControl sx={{ flex: 1 }} error={!!formErrors.taxId}>
          <InputLabel>Vergi Oranı *</InputLabel>
          <Select
            value={formData.taxId || ''}
            label="Vergi Oranı *"
            onChange={handleInputChange('taxId')}
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
          {formErrors.taxId && (
            <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
              {formErrors.taxId}
            </Typography>
          )}
        </FormControl>
      </Stack>
    </Box>
  );
};

export default ProductFormCategories;

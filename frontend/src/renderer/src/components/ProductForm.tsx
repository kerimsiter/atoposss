import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  InputAdornment
} from '@mui/material';
import { Product, CreateProductData, useProductStore } from '../stores/useProductStore';
import { useMetaStore } from '../stores/useMetaStore';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product }) => {
  const { addProduct, updateProduct, loading, error, clearError } = useProductStore();
  const { 
    categories, 
    taxes, 
    fetchCategories, 
    fetchTaxes, 
    loading: metaLoading 
  } = useMetaStore();
  
  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    code: '',
    barcode: '',
    description: '',
    basePrice: 0,
    categoryId: '',
    taxId: '',
    trackStock: false,
    unit: 'PIECE'
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Fetch meta data when dialog opens
  useEffect(() => {
    if (open) {
      fetchCategories();
      fetchTaxes();
    }
  }, [open, fetchCategories, fetchTaxes]);

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        // Edit mode - populate form with existing product data
        setFormData({
          name: product.name,
          code: product.code,
          barcode: product.barcode || '',
          description: product.description || '',
          basePrice: typeof product.basePrice === 'number' ? product.basePrice : Number(product.basePrice),
          categoryId: product.categoryId,
          taxId: product.taxId,
          trackStock: product.trackStock,
          unit: product.unit
        });
      } else {
        // Add mode - reset form
        setFormData({
          name: '',
          code: '',
          barcode: '',
          description: '',
          basePrice: 0,
          categoryId: '',
          taxId: '',
          trackStock: false,
          unit: 'PIECE'
        });
      }
      setFormErrors({});
      clearError();
    }
  }, [open, product, clearError]);

  const handleInputChange = (field: keyof CreateProductData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'basePrice' ? Number(value) : value
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSwitchChange = (field: keyof CreateProductData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'Ürün adı gereklidir';
    }

    if (!formData.code.trim()) {
      errors.code = 'Ürün kodu gereklidir';
    }

    if (formData.basePrice <= 0) {
      errors.basePrice = 'Fiyat 0\'dan büyük olmalıdır';
    }

    if (!formData.categoryId) {
      errors.categoryId = 'Kategori seçimi gereklidir';
    }

    if (!formData.taxId) {
      errors.taxId = 'Vergi oranı seçimi gereklidir';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (product) {
        // Update existing product
        await updateProduct(product.id, formData);
      } else {
        // Add new product
        await addProduct(formData);
      }
      onClose();
    } catch (error) {
      // Error is handled by the store
      console.error('Form submission error:', error);
    }
  };

  const unitOptions = [
    { value: 'PIECE', label: 'Adet' },
    { value: 'KG', label: 'Kilogram' },
    { value: 'GRAM', label: 'Gram' },
    { value: 'LITER', label: 'Litre' },
    { value: 'ML', label: 'Mililitre' },
    { value: 'PORTION', label: 'Porsiyon' },
    { value: 'BOX', label: 'Kutu' },
    { value: 'PACKAGE', label: 'Paket' }
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Ürün Adı *"
            value={formData.name}
            onChange={handleInputChange('name')}
            error={!!formErrors.name}
            helperText={formErrors.name}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Ürün Kodu *"
              value={formData.code}
              onChange={handleInputChange('code')}
              error={!!formErrors.code}
              helperText={formErrors.code}
              sx={{ flex: 1 }}
            />
            
            <TextField
              label="Barkod"
              value={formData.barcode}
              onChange={handleInputChange('barcode')}
              sx={{ flex: 1 }}
            />
          </Box>

          <TextField
            label="Açıklama"
            value={formData.description}
            onChange={handleInputChange('description')}
            multiline
            rows={3}
            fullWidth
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Fiyat *"
              type="number"
              value={formData.basePrice}
              onChange={handleInputChange('basePrice')}
              error={!!formErrors.basePrice}
              helperText={formErrors.basePrice}
              InputProps={{
                startAdornment: <InputAdornment position="start">₺</InputAdornment>,
              }}
              sx={{ flex: 1 }}
            />

            <FormControl sx={{ flex: 1 }} error={!!formErrors.unit}>
              <InputLabel>Birim *</InputLabel>
              <Select
                value={formData.unit}
                label="Birim *"
                onChange={handleInputChange('unit')}
              >
                {unitOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl sx={{ flex: 1 }} error={!!formErrors.categoryId}>
              <InputLabel>Kategori *</InputLabel>
              <Select
                value={formData.categoryId}
                label="Kategori *"
                onChange={handleInputChange('categoryId')}
                disabled={metaLoading}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ flex: 1 }} error={!!formErrors.taxId}>
              <InputLabel>Vergi Oranı *</InputLabel>
              <Select
                value={formData.taxId}
                label="Vergi Oranı *"
                onChange={handleInputChange('taxId')}
                disabled={metaLoading}
              >
                {taxes.map((tax) => (
                  <MenuItem key={tax.id} value={tax.id}>
                    {tax.name} ({tax.rate}%)
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={formData.trackStock}
                onChange={handleSwitchChange('trackStock')}
              />
            }
            label="Stok Takibi Yapılsın"
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          İptal
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading}
        >
          {loading ? 'Kaydediliyor...' : (product ? 'Güncelle' : 'Ekle')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
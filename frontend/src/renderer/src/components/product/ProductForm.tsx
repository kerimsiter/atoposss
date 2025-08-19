import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Alert,
  Typography,
  Stack,
  Divider,
  Fade
} from '@mui/material';
import { Product, CreateProductData, useProductStore } from '../../stores/useProductStore';
import { useMetaStore } from '../../stores/useMetaStore';
import ProductFormHeader from './ProductFormHeader';
import ProductFormBasicInfo from './ProductFormBasicInfo';
import ProductFormPricing from './ProductFormPricing';
import ProductFormCategories from './ProductFormCategories';
import ProductFormStock from './ProductFormStock';
import ProductFormActions from './ProductFormActions';
import ModernImageUpload from '../ui/ModernImageUpload';
import { PhotoCamera as ImageIcon } from '@mui/icons-material';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product }) => {
  const { addProduct, updateProduct, loading, error, clearError } = useProductStore();
  const { categories, taxes, fetchCategories, fetchTaxes, loading: metaLoading } = useMetaStore();

  const isEditMode = !!product;

  const [formData, setFormData] = useState<CreateProductData>({
    name: '',
    code: '',
    barcode: '',
    description: '',
    basePrice: 0,
    categoryId: '',
    taxId: '',
    trackStock: false,
    unit: 'PIECE',
    image: undefined
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
        const validCategoryId = categories.some(cat => cat.id === product.categoryId) ? product.categoryId : '';
        const validTaxId = taxes.some(tax => tax.id === product.taxId) ? product.taxId : '';

        setFormData({
          name: product.name,
          code: product.code,
          barcode: product.barcode || '',
          description: product.description || '',
          basePrice: Number(product.basePrice),
          categoryId: validCategoryId,
          taxId: validTaxId,
          trackStock: product.trackStock,
          unit: product.unit,
          image: product.image
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
          unit: 'PIECE',
          image: undefined
        });
      }
      setFormErrors({});
      clearError();
    }
  }, [open, product, categories, taxes, clearError]);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: field === 'basePrice' ? Number(value) : value
    }));

    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSwitchChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleImageChange = (image: string | undefined) => {
    setFormData(prev => ({ ...prev, image }));
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
        await updateProduct(product.id, formData);
      } else {
        await addProduct(formData);
      }
      onClose();
    } catch (error) {
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: '1.5px solid rgba(246, 246, 246, 1)',
            background: 'rgba(253, 253, 253, 0.95)',
            backdropFilter: 'blur(32px)',
            boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden'
          }
        }
      }}
    >
      <ProductFormHeader isEditMode={isEditMode} onClose={onClose} />
      <DialogContent sx={{ p: 4 }}>
        <Fade in={open} timeout={300}>
          <Box>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  background: 'rgba(255, 82, 82, 0.1)',
                  border: '1px solid rgba(255, 82, 82, 0.2)',
                  '& .MuiAlert-icon': {
                    color: '#FF5252'
                  }
                }}
              >
                {error}
              </Alert>
            )}

            <Stack spacing={4}>
              {/* Product Image */}
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <ImageIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
                    Ürün Resmi
                  </Typography>
                </Stack>
                <ModernImageUpload
                  value={formData.image}
                  onChange={handleImageChange}
                  disabled={loading}
                />
              </Box>

              <Divider />

              <ProductFormBasicInfo
                formData={formData}
                handleInputChange={handleInputChange}
                formErrors={formErrors}
              />

              <Divider />

              <ProductFormPricing
                formData={formData}
                handleInputChange={handleInputChange}
                formErrors={formErrors}
                unitOptions={unitOptions}
              />

              <Divider />

              <ProductFormCategories
                formData={formData}
                handleInputChange={handleInputChange}
                formErrors={formErrors}
                categories={categories}
                taxes={taxes}
                metaLoading={metaLoading}
              />

              <Divider />

              <ProductFormStock
                trackStock={formData.trackStock}
                handleSwitchChange={handleSwitchChange}
              />
            </Stack>
          </Box>
        </Fade>
      </DialogContent>

      <ProductFormActions
        isEditMode={isEditMode}
        loading={loading}
        metaLoading={metaLoading}
        onClose={onClose}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
};

export default ProductForm;
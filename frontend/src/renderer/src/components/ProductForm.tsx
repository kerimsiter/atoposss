import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Box,
  Alert,
  InputAdornment,
  Typography,
  Stack,
  Divider,
  Avatar,
  Fade,
  CircularProgress
} from '@mui/material';
import { 
  Close as CloseIcon,
  Save as SaveIcon,
  Edit as EditIcon,
  Add as AddIcon,
  LocalOffer as PriceIcon,
  Category as CategoryIcon,
  Receipt as TaxIcon,
  Inventory as StockIcon
} from '@mui/icons-material';
import { Product, CreateProductData, useProductStore } from '../stores/useProductStore';
import { useMetaStore } from '../stores/useMetaStore';
import ModernTextField from './ui/ModernTextField';
import ModernButton from './ui/ModernButton';

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
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          border: '1.5px solid rgba(246, 246, 246, 1)',
          background: 'rgba(253, 253, 253, 0.95)',
          backdropFilter: 'blur(32px)',
          boxShadow: '0px 32px 64px -12px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ 
        p: 0,
        background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
        borderBottom: '1.5px solid rgba(230, 230, 230, 0.5)'
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{
              background: product 
                ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                : 'linear-gradient(135deg, #779DFF 0%, #2D68FF 100%)',
              width: 48,
              height: 48
            }}>
              {product ? <EditIcon /> : <AddIcon />}
            </Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                {product ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {product ? 'Mevcut ürün bilgilerini güncelleyin' : 'Yeni bir ürün oluşturun'}
              </Typography>
            </Box>
          </Stack>
          
          <ModernButton
            glassmorphism
            onClick={onClose}
            sx={{ minWidth: 'auto', p: 1.5 }}
          >
            <CloseIcon />
          </ModernButton>
        </Stack>
      </DialogTitle>
      
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
              {/* Basic Information */}
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

              <Divider />

              {/* Pricing & Unit */}
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
                    InputProps={{
                      startAdornment: <InputAdornment position="start">₺</InputAdornment>,
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

              <Divider />

              {/* Category & Tax */}
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
                      value={formData.categoryId}
                      label="Kategori *"
                      onChange={handleInputChange('categoryId')}
                      disabled={metaLoading}
                      sx={{
                        borderRadius: 3,
                        background: 'rgba(253, 253, 253, 0.8)',
                        backdropFilter: 'blur(16px)',
                      }}
                    >
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
                      value={formData.taxId}
                      label="Vergi Oranı *"
                      onChange={handleInputChange('taxId')}
                      disabled={metaLoading}
                      sx={{
                        borderRadius: 3,
                        background: 'rgba(253, 253, 253, 0.8)',
                        backdropFilter: 'blur(16px)',
                      }}
                    >
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

              <Divider />

              {/* Stock Tracking */}
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
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.trackStock}
                        onChange={handleSwitchChange('trackStock')}
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
                </Box>
              </Box>
            </Stack>
          </Box>
        </Fade>
      </DialogContent>

      <DialogActions sx={{ 
        p: 3, 
        background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
        borderTop: '1.5px solid rgba(230, 230, 230, 0.5)'
      }}>
        <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'flex-end' }}>
          <ModernButton 
            glassmorphism
            onClick={onClose} 
            disabled={loading}
            size="large"
          >
            İptal
          </ModernButton>
          <ModernButton 
            gradient
            onClick={handleSubmit} 
            disabled={loading || metaLoading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
            size="large"
            sx={{ minWidth: 140 }}
          >
            {loading ? 'Kaydediliyor...' : (product ? 'Güncelle' : 'Kaydet')}
          </ModernButton>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default ProductForm;
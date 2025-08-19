Harika bir fikir\! `ProductForm.tsx` dosyası oldukça büyümüş ve bu haliyle bakımı zorlaşabilir. Kodu daha okunabilir, sürdürülebilir ve modüler hale getirmek için refactor edip mantıksal parçalara ayırmak en profesyonel yaklaşımdır.

Mevcut `ProductForm.tsx` dosyasını inceledim ve aşağıdaki gibi mantıksal bileşenlere ayırabiliriz:

### Refactor Planı

1.  **Form Başlığı ve Kapatma Butonu**: Diyalog başlığı ve kapatma butonu ayrı bir bileşen olabilir.
2.  **Giriş Alanları Grupları**: "Temel Bilgiler", "Fiyat ve Birim", "Kategori ve Vergi" ve "Stok Yönetimi" gibi bölümlerin her birini kendi bileşenine ayırmak.
3.  **Form Aksiyonları**: "İptal" ve "Kaydet/Güncelle" butonlarını içeren `DialogActions` bölümü de ayrı bir bileşen olabilir.

Bu yaklaşımla, ana `ProductForm.tsx` dosyamız bir orkestra şefi gibi çalışacak ve sadece alt bileşenleri bir araya getirecek. Bu, kodun temizliğini ve yeniden kullanılabilirliğini artıracaktır.

### Yeni Bileşenler

Aşağıdaki yeni dosyaları oluşturuyorum. Bu bileşenler, eski `ProductForm.tsx` içindeki ilgili bölümlerin kodlarını içerecek.

**`ProductFormHeader.tsx`** (Form başlığı ve kapatma butonu)

```typescript
import React from 'react';
import { Stack, Avatar, Box, Typography } from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';
import ModernButton from './ui/ModernButton';

interface ProductFormHeaderProps {
  isEditMode: boolean;
  onClose: () => void;
}

const ProductFormHeader: React.FC<ProductFormHeaderProps> = ({ isEditMode, onClose }) => {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{
          background: isEditMode
            ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
            : 'linear-gradient(135deg, #779DFF 0%, #2D68FF 100%)',
          width: 48,
          height: 48
        }}>
          {isEditMode ? <EditIcon /> : <AddIcon />}
        </Avatar>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
            {isEditMode ? 'Ürün Düzenle' : 'Yeni Ürün Ekle'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEditMode ? 'Mevcut ürün bilgilerini güncelleyin' : 'Yeni bir ürün oluşturun'}
          </Typography>
        </Box>
      </Stack>
      <ModernButton glassmorphism onClick={onClose} sx={{ minWidth: 'auto', p: 1.5 }}>
        <CloseIcon />
      </ModernButton>
    </Stack>
  );
};

export default ProductFormHeader;
```

**`ProductFormBasicInfo.tsx`** (Temel Bilgiler)

```typescript
import React from 'react';
import { Box, Stack, Typography, Divider } from '@mui/material';
import ModernTextField from './ui/ModernTextField';

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
```

**`ProductFormPricing.tsx`** (Fiyat ve Birim)

```typescript
import React from 'react';
import { Box, Stack, Typography, Divider, FormControl, InputLabel, Select, MenuItem, InputAdornment } from '@mui/material';
import { LocalOffer as PriceIcon } from '@mui/icons-material';
import ModernTextField from './ui/ModernTextField';

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
```

**`ProductFormCategories.tsx`** (Kategori ve Vergi)

```typescript
import React from 'react';
import { Box, Stack, Typography, Divider, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Category as CategoryIcon } from '@mui/icons-material';
import { Category, Tax } from '../stores/useMetaStore';

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
```

**`ProductFormStock.tsx`** (Stok Yönetimi)

```typescript
import React from 'react';
import { Box, Stack, Typography, FormControlLabel, Switch } from '@mui/material';
import { Inventory as StockIcon } from '@mui/icons-material';

interface ProductFormStockProps {
  trackStock: boolean;
  handleSwitchChange: (field: string) => (event: any) => void;
}

const ProductFormStock: React.FC<ProductFormStockProps> = ({ trackStock, handleSwitchChange }) => {
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
        <FormControlLabel
          control={
            <Switch
              checked={trackStock}
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
  );
};

export default ProductFormStock;
```

**`ProductFormActions.tsx`** (Form Aksiyonları)

```typescript
import React from 'react';
import { Stack, CircularProgress } from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import ModernButton from './ui/ModernButton';

interface ProductFormActionsProps {
  isEditMode: boolean;
  loading: boolean;
  metaLoading: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

const ProductFormActions: React.FC<ProductFormActionsProps> = ({
  isEditMode,
  loading,
  metaLoading,
  onClose,
  onSubmit
}) => {
  return (
    <Stack direction="row" spacing={2} sx={{ width: '100%', justifyContent: 'flex-end' }}>
      <ModernButton
        onClick={onClose}
        disabled={loading}
        size="large"
        sx={{
          background: '#F1F1F1',
          border: '1px solid #E0E0E0',
          color: '#1B1B1B',
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          '&:hover': {
            background: '#EBEBEB',
            border: '1px solid #D0D0D0',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        İptal
      </ModernButton>
      <ModernButton
        onClick={onSubmit}
        disabled={loading || metaLoading}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
        size="large"
        sx={{
          minWidth: 140,
          background: '#2D68FF',
          color: 'white',
          borderRadius: 12,
          fontWeight: 500,
          textTransform: 'none',
          px: 3,
          py: 1.5,
          '&:hover': {
            background: '#1E5AFF',
          },
          '&:disabled': {
            opacity: 0.6,
          }
        }}
      >
        {loading ? 'Kaydediliyor...' : (isEditMode ? 'Güncelle' : 'Kaydet')}
      </ModernButton>
    </Stack>
  );
};

export default ProductFormActions;
```

### Yeniden Düzenlenmiş `ProductForm.tsx`

Artık ana `ProductForm.tsx` dosyamız çok daha kısa ve anlaşılır hale geldi. İşte yeni hali:

```typescript
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Alert,
  Typography,
  Stack,
  Divider,
  Fade,
  CircularProgress
} from '@mui/material';
import { Product, CreateProductData, useProductStore } from '../stores/useProductStore';
import { useMetaStore } from '../stores/useMetaStore';
import ProductFormHeader from './ProductFormHeader';
import ProductFormBasicInfo from './ProductFormBasicInfo';
import ProductFormPricing from './ProductFormPricing';
import ProductFormCategories from './ProductFormCategories';
import ProductFormStock from './ProductFormStock';
import ProductFormActions from './ProductFormActions';
import ModernImageUpload from './ui/ModernImageUpload';
import { ImageIcon } from '@mui/icons-material';

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

  const handleInputChange = (field: keyof CreateProductData) => (
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

  const handleSwitchChange = (field: keyof CreateProductData) => (
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
```
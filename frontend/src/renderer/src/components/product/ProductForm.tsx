import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Alert,
  Typography,
  Stack,
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
import ProductFormTabs, { ProductFormTabKey } from './ProductFormTabs';
import ProductVariantsSection, { VariantItem } from './ProductVariantsSection';
import ProductModifiersSection, { ModifierGroup } from './ProductModifiersSection';
import ProductAllergensSection from './ProductAllergensSection';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product }) => {
  const { addProduct, updateProduct, loading, error, clearError, products, fetchProducts } = useProductStore();
  const { categories, taxes, fetchCategories, fetchTaxes, loading: metaLoading } = useMetaStore();

  const isEditMode = !!product;

  // Tabs & advanced sections local state (UI only for now)
  const [activeTab, setActiveTab] = useState<ProductFormTabKey>('general');
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [allergens, setAllergens] = useState<string[]>([]);

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
      // Ensure we have the latest products for duplicate code validation
      fetchProducts();
    }
  }, [open, fetchCategories, fetchTaxes, fetchProducts]);

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
        // Hydrate tabs data from backend relations if available
        try {
          const srvVariants = (product as any).variants as any[] | undefined;
          if (Array.isArray(srvVariants) && srvVariants.length) {
            setVariants(
              srvVariants.map(v => ({
                id: v.id,
                name: v.name ?? '',
                sku: v.sku ?? '',
                price: v.price !== undefined && v.price !== null ? Number(v.price) : undefined,
              }))
            );
          } else {
            setVariants([]);
          }

          const srvPmgs = (product as any).modifierGroups as any[] | undefined;
          if (Array.isArray(srvPmgs) && srvPmgs.length) {
            const groups = srvPmgs
              .map(pg => pg?.modifierGroup)
              .filter(Boolean)
              .map((g: any) => ({
                id: g.id,
                name: g.name ?? '',
                minSelect: g.minSelection ?? 0,
                maxSelect: g.maxSelection ?? 1,
                items: Array.isArray(g.modifiers)
                  ? g.modifiers.map((m: any) => ({
                      id: m.id,
                      name: m.name ?? '',
                      price: m.price !== undefined && m.price !== null ? Number(m.price) : 0,
                      affectsStock: false,
                    }))
                  : [],
              }));
            setModifierGroups(groups);
          } else {
            setModifierGroups([]);
          }
          // Allergens hydrate
          const srvAllergens = (product as any).allergens as string[] | undefined;
          setAllergens(Array.isArray(srvAllergens) ? srvAllergens : []);
        } catch (e) {
          console.warn('Product hydrate warning:', e);
          setVariants([]);
          setModifierGroups([]);
          setAllergens([]);
        }
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
        setVariants([]);
        setModifierGroups([]);
        setAllergens([]);
      }
      setFormErrors({});
      clearError();
      setActiveTab('general');
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
    const advancedIssues: string[] = [];

    if (!formData.name.trim()) {
      errors.name = 'Ürün adı gereklidir';
    }
    const codeTrim = formData.code.trim();
    if (!codeTrim) {
      errors.code = 'Ürün kodu gereklidir';
    }
    // Duplicate code check (frontend) — assumes single-company context
    if (codeTrim) {
      const exists = products.some(p =>
        p.code.trim().toLowerCase() === codeTrim.toLowerCase() && (!product || p.id !== product.id)
      );
      if (exists) {
        errors.code = 'Bu ürün kodu zaten kullanılıyor';
      }
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

    // Advanced: variants validation
    variants.forEach((v, idx) => {
      const name = v.name?.trim();
      const priceNum = typeof v.price === 'number' ? v.price : NaN;
      if (!name) advancedIssues.push(`Varyant #${idx + 1}: Ad alanı zorunlu`);
      if (!(priceNum >= 0)) advancedIssues.push(`Varyant #${idx + 1}: Fiyat 0 veya daha büyük olmalı`);
    });

    // Advanced: modifier groups validation
    modifierGroups.forEach((g, gi) => {
      const name = g.name?.trim();
      if (!name) advancedIssues.push(`Ek Seçenek Grubu #${gi + 1}: Ad alanı zorunlu`);
      const minSel = Number(g.minSelect ?? 0);
      const maxSel = Number(g.maxSelect ?? 1);
      const count = g.items?.length ?? 0;
      if (minSel < 0) advancedIssues.push(`Ek Seçenek Grubu #${gi + 1}: minimum seçim negatif olamaz`);
      if (maxSel < 0) advancedIssues.push(`Ek Seçenek Grubu #${gi + 1}: maksimum seçim negatif olamaz`);
      if (minSel > maxSel) advancedIssues.push(`Ek Seçenek Grubu #${gi + 1}: minimum seçim maksimumdan büyük olamaz`);
      if (minSel > count) advancedIssues.push(`Ek Seçenek Grubu #${gi + 1}: minimum seçim öğe sayısından fazla olamaz`);
      g.items.forEach((i, ii) => {
        const iname = i.name?.trim();
        const iprice = typeof i.price === 'number' ? i.price : NaN;
        if (!iname) advancedIssues.push(`Ek Seçenek #${gi + 1}.${ii + 1}: Ad alanı zorunlu`);
        if (!(iprice >= 0)) advancedIssues.push(`Ek Seçenek #${gi + 1}.${ii + 1}: Fiyat 0 veya daha büyük olmalı`);
      });
    });

    if (advancedIssues.length) {
      errors.advanced = advancedIssues.join('\n');
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Map UI state to backend DTO
      // CreateProductDto does NOT allow `id` on variants; UpdateProductDto does.
      const mappedVariants = variants
        .map(v => (
          product
            ? { id: v.id, name: v.name.trim(), sku: v.sku?.trim() || undefined, price: v.price }
            : { name: v.name.trim(), sku: v.sku?.trim() || undefined, price: v.price }
        ))
        .filter(v => v.name && typeof v.price === 'number' && !Number.isNaN(v.price));

      const mappedModifierGroups = modifierGroups
        .map(g => ({
          id: g.id,
          name: g.name.trim(),
          minSelect: g.minSelect ?? 0,
          maxSelect: g.maxSelect ?? 1,
          items: g.items
            .map(i => ({ id: i.id, name: i.name.trim(), price: i.price ?? 0, affectsStock: !!i.affectsStock }))
            .filter(i => i.name)
        }))
        .filter(g => g.name && g.items.length > 0);

      const payload: CreateProductData = {
        ...formData,
        allergens: allergens.length ? allergens : undefined,
        variants: mappedVariants.length ? mappedVariants : undefined,
        modifierGroups: mappedModifierGroups.length ? mappedModifierGroups : undefined,
      };

      if (product) {
        await updateProduct(product.id, payload);
      } else {
        await addProduct(payload);
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

            <Stack spacing={3}>
              <ProductFormTabs value={activeTab} onChange={setActiveTab} />

              {activeTab === 'general' && (
                <Box>
                  <Box sx={{ mb: 3 }}>
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

                  <Box sx={{ mb: 3 }}>
                    <ProductFormBasicInfo
                      formData={formData}
                      handleInputChange={handleInputChange}
                      formErrors={formErrors}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <ProductFormPricing
                      formData={formData}
                      handleInputChange={handleInputChange}
                      formErrors={formErrors}
                      unitOptions={unitOptions}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <ProductFormCategories
                      formData={formData}
                      handleInputChange={handleInputChange}
                      formErrors={formErrors}
                      categories={categories}
                      taxes={taxes}
                      metaLoading={metaLoading}
                    />
                  </Box>

                  <Box>
                    <ProductFormStock
                      trackStock={formData.trackStock}
                      handleSwitchChange={handleSwitchChange}
                    />
                  </Box>
                </Box>
              )}

              {activeTab === 'variants' && (
                <ProductVariantsSection variants={variants} onChange={setVariants} />
              )}

              {activeTab === 'modifiers' && (
                <ProductModifiersSection groups={modifierGroups} onChange={setModifierGroups} />
              )}

              {activeTab === 'allergens' && (
                <ProductAllergensSection value={allergens} onChange={setAllergens} disabled={loading} />
              )}
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
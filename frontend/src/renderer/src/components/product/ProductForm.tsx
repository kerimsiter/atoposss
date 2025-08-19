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
import { productFullSchema, variantSchema, modifierGroupSchema } from '../../validation/productSchemas';

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
  const [variantErrors, setVariantErrors] = useState<Record<string, { name?: string; sku?: string; price?: string }>>({});
  const [modifierErrors, setModifierErrors] = useState<Record<string, { name?: string; minSelect?: string; maxSelect?: string; items?: Record<string, { name?: string; price?: string }> }>>({});
  const [allergensError, setAllergensError] = useState<string | undefined>(undefined);

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

  // ------ Advanced validation helpers (Zod) ------
  const validateVariants = (list: VariantItem[]) => {
    const nextErr: Record<string, { name?: string; sku?: string; price?: string }> = {};
    list.forEach(v => {
      const parsed = variantSchema.safeParse({ ...v, price: v.price });
      if (!parsed.success) {
        parsed.error.issues.forEach(iss => {
          const key = iss.path[0] as 'name' | 'sku' | 'price';
          nextErr[v.id] = { ...nextErr[v.id], [key]: iss.message };
        });
      }
    });
    setVariantErrors(nextErr);
    return nextErr;
  };

  const validateModifierGroups = (groups: ModifierGroup[]) => {
    const nextErr: Record<string, { name?: string; minSelect?: string; maxSelect?: string; items?: Record<string, { name?: string; price?: string }> }> = {};
    groups.forEach(g => {
      const parsed = modifierGroupSchema.safeParse({
        ...g,
        items: g.items?.map(i => ({ ...i, price: i.price })) ?? [],
      });
      if (!parsed.success) {
        parsed.error.issues.forEach(iss => {
          const path0 = iss.path[0] as string | undefined;
          if (path0 === 'items' && typeof iss.path[1] === 'number') {
            const idx = iss.path[1] as number;
            const item = g.items[idx];
            if (item) {
              const field = (iss.path[2] as 'name' | 'price') ?? 'name';
              nextErr[g.id] = { ...nextErr[g.id], items: { ...(nextErr[g.id]?.items ?? {}), [item.id]: { ...(nextErr[g.id]?.items?.[item.id] ?? {}), [field]: iss.message } } };
            }
          } else if (path0 === 'name' || path0 === 'minSelect' || path0 === 'maxSelect') {
            nextErr[g.id] = { ...nextErr[g.id], [path0]: iss.message } as any;
          }
        });
      }
    });
    setModifierErrors(nextErr);
    return nextErr;
  };

  const validateAllergens = (list: string[]) => {
    // productFullSchema includes allergens; validate a minimal object
    const parsed = productFullSchema.pick({ allergens: true }).safeParse({ allergens: list });
    setAllergensError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    return parsed.success;
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

  // Instant validation effects for advanced sections
  useEffect(() => {
    if (!open) return;
    validateVariants(variants);
  }, [open, variants]);

  useEffect(() => {
    if (!open) return;
    validateModifierGroups(modifierGroups);
  }, [open, modifierGroups]);

  useEffect(() => {
    if (!open) return;
    validateAllergens(allergens);
  }, [open, allergens]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    // Reset advanced error maps
    setVariantErrors({});
    setModifierErrors({});
    setAllergensError(undefined);

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

    // Advanced: Zod validation for arrays
    const vErr = validateVariants(variants);
    const mErr = validateModifierGroups(modifierGroups);
    validateAllergens(allergens);
    if (Object.keys(vErr).length || Object.keys(mErr).length || allergensError) {
      // Keep a generic advanced flag to show an Alert if needed
      errors.advanced = 'Gelişmiş alanlarda hatalar var. Lütfen ilgili sekmeleri kontrol edin.';
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

      // Final Zod parse before submit
      const parsed = productFullSchema.safeParse({
        ...payload,
        // Ensure numbers are numbers
        basePrice: Number(payload.basePrice),
      });
      if (!parsed.success) {
        // Map base errors into formErrors
        const nextErr: Record<string, string> = {};
        parsed.error.issues.forEach(iss => {
          const k = iss.path[0] as string;
          if (k) nextErr[k] = iss.message;
        });
        setFormErrors(prev => ({ ...prev, ...nextErr }));
        return;
      }

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
                <ProductVariantsSection variants={variants} onChange={setVariants} errors={variantErrors} />
              )}

              {activeTab === 'modifiers' && (
                <ProductModifiersSection groups={modifierGroups} onChange={setModifierGroups} errors={modifierErrors} />
              )}

              {activeTab === 'allergens' && (
                <ProductAllergensSection value={allergens} onChange={setAllergens} disabled={loading} error={allergensError} />
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
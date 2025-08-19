import React, { useState, useEffect, useMemo } from 'react';
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
import { productFullSchema, modifierGroupSchema } from '../../validation/productSchemas';
import { z } from 'zod';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

type FormValues = z.input<typeof productFullSchema>;

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product }) => {
  const { addProduct, updateProduct, loading, error, clearError, products, fetchProducts } = useProductStore();
  const { categories, taxes, fetchCategories, fetchTaxes, loading: metaLoading } = useMetaStore();

  const isEditMode = !!product;

  // Tabs & advanced sections local state (UI only for now)
  const [activeTab, setActiveTab] = useState<ProductFormTabKey>('general');
  // Variants & modifierGroups & allergens now RHF-managed via RHF

  // Build resolver schema with duplicate code check (superRefine)
  const resolverSchema = useMemo(() =>
    productFullSchema.superRefine((data, ctx) => {
      const codeTrim = (data.code ?? '').trim();
      if (!codeTrim) return;
      const exists = products.some(p =>
        p.code.trim().toLowerCase() === codeTrim.toLowerCase() && (!product || p.id !== product.id)
      );
      if (exists) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'Bu ürün kodu zaten kullanılıyor' });
      }
      // Variant SKU uniqueness (ignore empty)
      const skus = new Map<string, number[]>();
      (data.variants ?? []).forEach((v, i) => {
        const s = (v?.sku ?? '').trim().toLowerCase();
        if (!s) return;
        const arr = skus.get(s) ?? [];
        arr.push(i);
        skus.set(s, arr);
      });
      for (const [_, idxs] of skus) {
        if (idxs.length > 1) {
          idxs.forEach(i => {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['variants', i, 'sku'], message: 'SKU benzersiz olmalı' });
          });
        }
      }
    })
  , [products, product]);

  // react-hook-form for base fields
  const formMethods = useForm<FormValues>({
    resolver: zodResolver(resolverSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      code: '',
      barcode: '',
      description: '',
      basePrice: 0,
      categoryId: '',
      taxId: '',
      trackStock: false,
      unit: 'PIECE',
      image: undefined,
      variants: [],
      modifierGroups: [],
      allergens: [],
    },
  });
  const { watch, setValue, reset, trigger, formState, setError } = formMethods;
  const baseValues = watch();
  const rhfVariants = watch('variants') as VariantItem[] | undefined;
  const rhfModifierGroups = watch('modifierGroups') as ModifierGroup[] | undefined;
  const rhfAllergens = watch('allergens') as string[] | undefined;
  const formErrors: Record<string, string> = Object.fromEntries(
    Object.entries(formState.errors).map(([k, v]: any) => [k, v?.message || ''])
  );
  const [, setModifierErrors] = useState<Record<string, { name?: string; minSelect?: string; maxSelect?: string; items?: Record<string, { name?: string; price?: string }> }>>({});

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

        reset({
          name: product.name,
          code: product.code,
          barcode: product.barcode || '',
          description: product.description || '',
          basePrice: Number(product.basePrice),
          categoryId: validCategoryId,
          taxId: validTaxId,
          trackStock: product.trackStock,
          unit: product.unit as any,
          image: product.image,
        });
        // Hydrate tabs data from backend relations if available
        try {
          const srvVariants = (product as any).variants as any[] | undefined;
          if (Array.isArray(srvVariants) && srvVariants.length) {
            setValue('variants', srvVariants.map(v => ({
              id: v.id,
              name: v.name ?? '',
              sku: v.sku ?? '',
              price: v.price !== undefined && v.price !== null ? Number(v.price) : 0,
            })) as any, { shouldValidate: true, shouldDirty: false });
          } else {
            setValue('variants', [], { shouldValidate: false, shouldDirty: false });
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
            setValue('modifierGroups', groups as any, { shouldValidate: true, shouldDirty: false });
          } else {
            setValue('modifierGroups', [], { shouldValidate: false, shouldDirty: false });
          }
          // Allergens hydrate
          const srvAllergens = (product as any).allergens as string[] | undefined;
          setValue('allergens', Array.isArray(srvAllergens) ? srvAllergens : [], { shouldValidate: true, shouldDirty: false });
        } catch (e) {
          console.warn('Product hydrate warning:', e);
          setValue('variants', [], { shouldValidate: false, shouldDirty: false });
          setValue('modifierGroups', [], { shouldValidate: false, shouldDirty: false });
          setValue('allergens', [], { shouldValidate: false, shouldDirty: false });
        }
      } else {
        // Add mode - reset form
        reset({
          name: '',
          code: '',
          barcode: '',
          description: '',
          basePrice: 0,
          categoryId: '',
          taxId: '',
          trackStock: false,
          unit: 'PIECE',
          image: undefined,
        });
        setValue('variants', [], { shouldValidate: false, shouldDirty: false });
        setValue('modifierGroups', [], { shouldValidate: false, shouldDirty: false });
        setValue('allergens', [], { shouldValidate: false, shouldDirty: false });
      }
      // RHF handles base errors; advanced errors handled separately
      clearError();
      setActiveTab('general');
    }
  }, [open, product, categories, taxes, clearError]);

  const handleInputChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = event.target.value;
    setValue(field as any, field === 'basePrice' ? Number(value) : value, { shouldValidate: true, shouldDirty: true });
  };

  // ------ Advanced validation helpers (Zod) ------

  const validateModifierGroups = (groups: ModifierGroup[]) => {
    const nextErr: Record<string, { name?: string; minSelect?: string; maxSelect?: string; items?: Record<string, { name?: string; price?: string }> }> = {};
    groups.forEach((g, gIdx) => {
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
              const gid = g.id ?? String(gIdx);
              const iid = item.id ?? String(idx);
              nextErr[gid] = { ...nextErr[gid], items: { ...(nextErr[gid]?.items ?? {}), [iid]: { ...(nextErr[gid]?.items?.[iid] ?? {}), [field]: iss.message } } };
            }
          } else if (path0 === 'minSelect' || path0 === 'maxSelect' || path0 === 'name') {
            const gid = g.id ?? String(gIdx);
            nextErr[gid] = { ...nextErr[gid], [path0]: iss.message } as any;
          }
        });
      }
    });
    setModifierErrors(nextErr);
    return nextErr;
  };

  // Allergens are validated by Zod in the final parse; instant UI errors are surfaced from RHF resolver if present

  const handleSwitchChange = (field: string) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValue(field as any, event.target.checked as any, { shouldValidate: true, shouldDirty: true });
  };

  const handleImageChange = (image: string | undefined) => {
    setValue('image', image as any, { shouldValidate: false, shouldDirty: true });
  };

  // Instant validation effects for advanced sections
  useEffect(() => {
    if (!open) return;
    validateModifierGroups(rhfModifierGroups ?? []);
  }, [open, rhfModifierGroups]);

  // No separate effect for allergens; RHF handles onChange validation

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    // Reset advanced error maps
    setModifierErrors({});
    // allergens errors are handled by RHF

    // Duplicate code is handled by resolver (Zod superRefine)

    // Advanced: Zod validation for arrays
    const mErr = validateModifierGroups(rhfModifierGroups ?? []);
    if (Object.keys(mErr).length) {
      // Keep a generic advanced flag to show an Alert if needed
      errors.advanced = 'Gelişmiş alanlarda hatalar var. Lütfen ilgili sekmeleri kontrol edin.';
    }

    // RHF base field errors are in formState.errors; merge only duplicate code error here for UI alert usage
    if (Object.keys(errors).length) {
      // show a generic advanced message and code duplication if any
    }
    return Object.keys(errors).length === 0 && Object.keys(formState.errors).length === 0;
  };

  const handleSubmit = async () => {
    // First validate base fields via RHF
    const rhfOk = await trigger();
    if (!rhfOk || !validateForm()) {
      return;
    }

    try {
      // Map UI state to backend DTO
      // CreateProductDto does NOT allow `id` on variants; UpdateProductDto does.
      const mappedVariants = (rhfVariants ?? [])
        .map(v => (
          product
            ? { id: v.id, name: v.name.trim(), sku: v.sku?.trim() || undefined, price: v.price }
            : { name: v.name.trim(), sku: v.sku?.trim() || undefined, price: v.price }
        ))
        .filter(v => v.name && typeof v.price === 'number' && !Number.isNaN(v.price));

      const mappedModifierGroups = (rhfModifierGroups ?? [])
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
        ...baseValues,
        allergens: (rhfAllergens?.length ? rhfAllergens : undefined) as any,
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
        parsed.error.issues.forEach(iss => {
          const k = iss.path[0] as keyof typeof baseValues;
          if (k) setError(k as any, { type: 'zod', message: iss.message });
        });
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
          <FormProvider {...formMethods}>
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
                      value={baseValues.image}
                      onChange={handleImageChange}
                      disabled={loading}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <ProductFormBasicInfo
                      formData={baseValues as any}
                      handleInputChange={handleInputChange}
                      formErrors={formErrors}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <ProductFormPricing
                      formData={baseValues as any}
                      handleInputChange={handleInputChange}
                      formErrors={formErrors}
                      unitOptions={unitOptions}
                    />
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <ProductFormCategories
                      formData={baseValues as any}
                      handleInputChange={handleInputChange}
                      formErrors={formErrors}
                      categories={categories}
                      taxes={taxes}
                      metaLoading={metaLoading}
                    />
                  </Box>

                  <Box>
                    <ProductFormStock
                      trackStock={baseValues.trackStock}
                      handleSwitchChange={handleSwitchChange}
                    />
                  </Box>
                </Box>
              )}

              {activeTab === 'variants' && (
                <ProductVariantsSection />
              )}

              {activeTab === 'modifiers' && (
                <ProductModifiersSection />
              )}

              {activeTab === 'allergens' && (
                <ProductAllergensSection disabled={loading} />
              )}
            </Stack>
          </FormProvider>
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
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
import axios from 'axios';

interface ProductFormProps {
  open: boolean;
  onClose: () => void;
  product?: Product | null;
}

type FormValues = z.input<typeof productFullSchema>;

const API_BASE_URL = 'http://localhost:3000';

const ProductForm: React.FC<ProductFormProps> = ({ open, onClose, product }) => {
  const { addProduct, updateProduct, loading, error, clearError, products, fetchProducts } = useProductStore();
  const { categories, taxes, fetchCategories, fetchTaxes, loading: metaLoading } = useMetaStore();

  const isEditMode = !!product;

  // Tabs & advanced sections local state (UI only for now)
  const [activeTab, setActiveTab] = useState<ProductFormTabKey>('general');
  const [submitNotice, setSubmitNotice] = useState<string | null>(null);
  // Variants & modifierGroups & allergens now RHF-managed via RHF
  // Avoid Save button flicker: treat metaLoading as blocking only until core meta is first available
  const metaBlocking = metaLoading && categories.length === 0 && taxes.length === 0;

  // Build resolver schema with duplicate code check (superRefine)
  const resolverSchema = useMemo(() =>
    productFullSchema.superRefine(async (data, ctx) => {
      const codeTrim = (data.code ?? '').trim();
      if (!codeTrim) return;
      const exists = products.some(p =>
        p.code.trim().toLowerCase() === codeTrim.toLowerCase() && (!product || p.id !== product.id)
      );
      if (exists) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'Bu ürün kodu zaten kullanılıyor' });
      }
      // Backend doğrulaması (edit modunda kendi ürününü hariç tut)
      try {
        const companyParam = product?.companyId ?? 'auto';
        const res = await axios.get(`${API_BASE_URL}/products/check-code-uniqueness`, {
          params: {
            code: codeTrim,
            companyId: companyParam,
            currentProductId: product?.id,
          }
        });
        if (!res.data?.isUnique) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['code'], message: 'Bu ürün kodu zaten kullanılıyor' });
        }
      } catch (e) {
        // Backend erişilemez ise formu bu sebeple bloklamayalım
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
      images: [],
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
      // Edit modunda, ilgili şirketin meta verilerini getir
      if (product?.companyId) {
        fetchCategories(product.companyId);
        fetchTaxes(product.companyId);
      } else {
        fetchCategories();
        fetchTaxes();
      }
      // Ensure we have the latest products for duplicate code validation
      fetchProducts();
    }
  }, [open, product?.companyId, fetchCategories, fetchTaxes, fetchProducts]);

  // Reset form when dialog opens/closes or product changes
  useEffect(() => {
    if (open) {
      if (product) {
        // Edit mode - populate form with existing product data
        // Ürün değerlerini doğrudan ata; meta daha sonra gelse bile seçili kalmalı
        reset({
          name: product.name,
          code: product.code,
          barcode: product.barcode || '',
          description: product.description || '',
          basePrice: Number(product.basePrice),
          // Kategori/vergiler henüz yüklenmemiş olabilir; şimdilik boş ver, sonra seçenekler gelince set et
          categoryId: '',
          taxId: '',
          trackStock: product.trackStock,
          unit: product.unit as any,
          image: product.image,
          images: Array.isArray((product as any).images) ? (product as any).images : [],
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
          images: [],
        });
        setValue('variants', [], { shouldValidate: false, shouldDirty: false });
        setValue('modifierGroups', [], { shouldValidate: false, shouldDirty: false });
        setValue('allergens', [], { shouldValidate: false, shouldDirty: false });
      }
      // RHF handles base errors; advanced errors handled separately
      clearError();
      setSubmitNotice(null);
      setActiveTab('general');
    }
  }, [open, product?.id, clearError]);

  // Meta listeler geldikten sonra, ürünün kategori/vergi değerlerini geçerli seçeneklerden biri ise ata
  useEffect(() => {
    if (!open) return;
    if (!categories?.length) return;
    if (isEditMode) {
      // Edit modu: sadece geçerliyse set et; değilse boş bırak ve hata göster
      if (product?.categoryId && categories.some(c => String(c.id) === String(product.categoryId))) {
        setValue('categoryId', String(product.categoryId) as any, { shouldValidate: true, shouldDirty: false });
      } else {
        setValue('categoryId', '' as any, { shouldValidate: true, shouldDirty: false });
        setError('categoryId' as any, { type: 'manual', message: 'Kategori seçimi gereklidir' });
      }
    } else {
      // Add modu: ilk kategoriyi otomatik ata
      const first = categories[0]?.id;
      if (first !== undefined && first !== null) {
        setValue('categoryId', String(first) as any, { shouldValidate: true, shouldDirty: false });
      }
    }
  }, [open, isEditMode, product?.categoryId, categories, setValue, setError]);

  useEffect(() => {
    if (!open || !product) return;
    if (taxes?.length && product.taxId) {
      const exists = taxes.some(t => String(t.id) === String(product.taxId));
      if (exists) setValue('taxId', String(product.taxId) as any, { shouldValidate: true, shouldDirty: false });
    }
  }, [open, product, taxes, setValue]);

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

  const handleImagesChange = (urls: string[]) => {
    setValue('images', urls as any, { shouldValidate: true, shouldDirty: true });
    const currentPrimary = (watch('image') as any) as string | undefined;
    if (!currentPrimary && urls.length > 0) {
      setValue('image', urls[0] as any, { shouldValidate: true, shouldDirty: true });
    } else if (currentPrimary && !urls.includes(currentPrimary)) {
      // primary silindiyse, ilk elemana düş
      setValue('image', (urls[0] as any) ?? undefined, { shouldValidate: true, shouldDirty: true });
    }
  };

  const handlePrimaryImageChange = (url: string | undefined) => {
    setValue('image', url as any, { shouldValidate: true, shouldDirty: true });
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
      // RHF hatalarına göre uygun sekmeye geç
      const errs: any = formState.errors as any;
      if (errs?.variants) {
        setActiveTab('variants');
      } else if (errs?.modifierGroups) {
        setActiveTab('modifiers');
      } else if (errs?.allergens) {
        setActiveTab('allergens');
      } else {
        setActiveTab('general');
      }
      setSubmitNotice('Formda hatalar var. Lütfen vurgulanan alanları düzeltin.');
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
        image: baseValues.image || (baseValues.images?.[0] ?? undefined),
        images: (baseValues.images && baseValues.images.length ? baseValues.images : undefined) as any,
        allergens: (rhfAllergens?.length ? rhfAllergens : undefined) as any,
        variants: mappedVariants.length ? mappedVariants : undefined,
        modifierGroups: mappedModifierGroups.length ? mappedModifierGroups : undefined,
      };

      // Final Zod parse before submit (async, because schema has async refinements)
      const parsed = await productFullSchema.safeParseAsync({
        ...payload,
        // Ensure numbers are numbers
        basePrice: Number(payload.basePrice),
      });
      if (!parsed.success) {
        parsed.error.issues.forEach(iss => {
          const k = iss.path[0] as keyof typeof baseValues;
          if (k) setError(k as any, { type: 'zod', message: iss.message });
        });
        // Zod hatalarında da sekme yönlendirmesi yapalım
        const hasVariantErr = parsed.error.issues.some(i => String(i.path[0]) === 'variants');
        const hasModErr = parsed.error.issues.some(i => String(i.path[0]) === 'modifierGroups');
        const hasAllergenErr = parsed.error.issues.some(i => String(i.path[0]) === 'allergens');
        if (hasVariantErr) setActiveTab('variants');
        else if (hasModErr) setActiveTab('modifiers');
        else if (hasAllergenErr) setActiveTab('allergens');
        else setActiveTab('general');
        setSubmitNotice('Formda hatalar var. Lütfen vurgulanan alanları düzeltin.');
        return;
      }

      if (product) {
        await updateProduct(product.id, payload);
      } else {
        await addProduct(payload);
      }
      setSubmitNotice(null);
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
            {(error || submitNotice) && (
              <Alert
                severity={error ? 'error' : 'warning'}
                sx={{
                  mb: 3,
                  borderRadius: 2,
                  background: error ? 'rgba(255, 82, 82, 0.1)' : 'rgba(255, 193, 7, 0.12)',
                  border: error ? '1px solid rgba(255, 82, 82, 0.2)' : '1px solid rgba(255, 193, 7, 0.3)',
                  '& .MuiAlert-icon': {
                    color: error ? '#FF5252' : '#FFC107'
                  }
                }}
              >
                {error || submitNotice}
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
                        Ürün Görselleri
                      </Typography>
                    </Stack>
                    <ModernImageUpload
                      currentImages={baseValues.images || []}
                      onChange={handleImagesChange}
                      primaryImageUrl={baseValues.image}
                      onPrimaryImageChange={handlePrimaryImageChange}
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
        metaLoading={metaBlocking}
        onClose={onClose}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
};

export default ProductForm;
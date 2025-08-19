import { z } from 'zod';
import axios from 'axios';

export const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Varyant adı zorunludur'),
  sku: z.string().trim().optional().or(z.literal('')),
  price: z
    .number()
    .min(0, 'Fiyat 0 veya daha büyük olmalı'),
});

export const modifierItemSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, 'Seçenek adı zorunludur'),
  price: z.number().min(0, 'Fiyat 0 veya daha büyük olmalı').optional(),
  affectsStock: z.boolean().optional(),
});

export const modifierGroupSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1, 'Grup adı zorunludur'),
    minSelect: z.number().int().min(0, 'Minimum seçim negatif olamaz').default(0),
    maxSelect: z.number().int().min(0, 'Maksimum seçim negatif olamaz').default(1),
    items: z.array(modifierItemSchema).default([]),
  })
  .superRefine((val, ctx) => {
    if (val.minSelect > val.maxSelect) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum seçim maksimumdan büyük olamaz', path: ['minSelect'] });
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum seçim maksimumdan büyük olamaz', path: ['maxSelect'] });
    }
    if (val.minSelect > (val.items?.length ?? 0)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Minimum seçim öğe sayısından fazla olamaz', path: ['minSelect'] });
    }
  });

export const allergensSchema = z
  .array(z.string().transform(s => s.trim()).pipe(z.string().min(1, 'Boş etiket olamaz')))
  .optional()
  .transform(arr => (arr ? Array.from(new Set(arr.map(a => a.toLocaleLowerCase('tr-TR')))) : arr));

export const productBaseSchema = z.object({
  name: z.string().trim().min(1, 'Ürün adı gereklidir'),
  code: z
    .string()
    .trim()
    .min(1, 'Ürün kodu gereklidir')
    .refine(
      async (code) => {
        if (!code) return true;
        const API_BASE_URL = 'http://localhost:3000';
        try {
          const res = await axios.get(
            `${API_BASE_URL}/products/check-code-uniqueness/${encodeURIComponent(code)}/auto`
          );
          return Boolean(res.data?.isUnique);
        } catch (e) {
          // Backend erişilemezse formu bloklamayalım; create sırasında backend zaten kontrol edecek
          return true;
        }
      },
      'Bu ürün kodu zaten kullanılıyor'
    ),
  barcode: z.string().optional(),
  description: z.string().optional(),
  basePrice: z.number().min(0.01, 'Fiyat 0\'dan büyük olmalıdır'),
  categoryId: z.string().min(1, 'Kategori seçimi gereklidir'),
  taxId: z.string().min(1, 'Vergi oranı seçimi gereklidir'),
  trackStock: z.boolean(),
  unit: z.enum(['PIECE','KG','GRAM','LITER','ML','PORTION','BOX','PACKAGE']),
  image: z.string().optional(),
});

export const productCreateAdvancedSchema = z.object({
  variants: z.array(variantSchema).optional(),
  modifierGroups: z.array(modifierGroupSchema).optional(),
  allergens: allergensSchema,
});

export const productFullSchema = productBaseSchema.merge(productCreateAdvancedSchema);

export type VariantInput = z.infer<typeof variantSchema>;
export type ModifierItemInput = z.infer<typeof modifierItemSchema>;
export type ModifierGroupInput = z.infer<typeof modifierGroupSchema>;
export type ProductFormInput = z.infer<typeof productFullSchema>;

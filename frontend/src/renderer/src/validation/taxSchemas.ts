import { z } from 'zod';

export const taxFormSchema = z.object({
  name: z.string().trim().min(1, 'Vergi adı zorunludur'),
  rate: z.coerce.number().min(0, 'Oran 0 veya daha büyük olmalı').max(100, 'Oran 100 veya daha küçük olmalı'),
  code: z.string().trim().min(1, 'Vergi kodu zorunludur'),
  type: z.enum(['VAT', 'OTV', 'OIV', 'DAMGA']).default('VAT'),
  isDefault: z.boolean().default(false),
  isIncluded: z.boolean().default(true),
  active: z.boolean().default(true),
});

export type TaxFormInput = z.infer<typeof taxFormSchema>;

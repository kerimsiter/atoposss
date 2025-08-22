import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Kategori adı zorunludur'),
  description: z.string().optional(),
  parentId: z.string().optional().nullable(),
  image: z.string().optional(),
  displayOrder: z.coerce.number().int().min(0, 'Sıralama negatif olamaz').default(0),
  showInMenu: z.boolean().default(true),
  active: z.boolean().default(true),
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;

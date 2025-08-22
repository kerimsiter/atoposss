import React, { useEffect, useState, useMemo } from 'react';
import { Dialog, DialogContent, Box, Stack, FormControlLabel, Switch, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { Category, useCategoryStore } from '../../stores/useCategoryStore';
import { categoryFormSchema } from '../../validation/categorySchemas';
import ModernTextField from '../ui/ModernTextField';
import CategoryFormHeader from './CategoryFormHeader';
import ProductFormActions from '../product/ProductFormActions';

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  category?: Category | null;
}

type FormValues = z.infer<typeof categoryFormSchema>;

const CategoryForm: React.FC<CategoryFormProps> = ({ open, onClose, category }) => {
  const { addCategory, updateCategory, loading, categories: allCategories, fetchCategories } = useCategoryStore();
  const [parentCategories, setParentCategories] = useState<{ id: string, name: string }[]>([]);
  
  // Build schema with local duplicate name check
  const resolverSchema = useMemo(() =>
    categoryFormSchema.superRefine((data, ctx) => {
      const nameTrim = (data.name || '').trim().toLowerCase();
      if (!nameTrim) return;
      const existsLocally = allCategories.some(c =>
        c.name.trim().toLowerCase() === nameTrim && (!category || c.id !== category.id)
      );
      if (existsLocally) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'Aynı adda bir kategori zaten mevcut.' });
      }
    })
  , [allCategories, category]);

  const formMethods = useForm<FormValues>({
    resolver: zodResolver(resolverSchema),
    defaultValues: { name: '', description: '', parentId: null, displayOrder: 0, showInMenu: true, active: true },
    mode: 'onChange'
  });
  
  const { handleSubmit, reset, control, setError, formState: { errors } } = formMethods;

  useEffect(() => {
    if (open) {
      axios.get('http://localhost:3000/categories/meta/parents')
        .then(res => setParentCategories(res.data))
        .catch(() => setParentCategories([]));

      // fetch categories for local uniqueness validation
      fetchCategories();

      if (category) {
        reset({
          name: category.name,
          description: category.description || '',
          parentId: category.parentId || null,
          displayOrder: category.displayOrder,
          showInMenu: category.showInMenu,
          active: category.active,
        });
      } else {
        reset({ name: '', description: '', parentId: null, displayOrder: 0, showInMenu: true, active: true });
      }
    }
  }, [open, category, reset, fetchCategories]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (category) {
        await updateCategory(category.id, data);
      } else {
        await addCategory(data);
      }
      onClose();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || '';
      const text = Array.isArray(msg) ? msg.join(', ') : String(msg);
      // Backend duplicate name message mapping
      if (text && /Aynı adda bir kategori zaten mevcut\./i.test(text)) {
        setError('name', { type: 'server', message: 'Aynı adda bir kategori zaten mevcut.' });
      }
      console.error('Kategori işlemi başarısız:', e);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <CategoryFormHeader isEditMode={!!category} onClose={onClose} />
      <DialogContent sx={{ p: 4 }}>
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller name="name" control={control} render={({ field }) => (
                <ModernTextField {...field} label="Kategori Adı *" error={!!errors.name} helperText={errors.name?.message} />
              )} />
              <Controller name="description" control={control} render={({ field }) => (
                <ModernTextField {...field} label="Açıklama" multiline rows={3} />
              )} />
              <Controller name="parentId" control={control} render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Ana Kategori</InputLabel>
                  <Select {...field} label="Ana Kategori" value={field.value || ''}>
                    <MenuItem value=""><em>Yok</em></MenuItem>
                    {parentCategories.filter(p => p.id !== category?.id).map(p => (
                      <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
              <Controller name="displayOrder" control={control} render={({ field }) => (
                <ModernTextField {...field} label="Sıralama" type="number" />
              )} />
              <Controller name="showInMenu" control={control} render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Menüde Göster" />
              )} />
              <Controller name="active" control={control} render={({ field }) => (
                <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Aktif" />
              )} />
            </Stack>
          </form>
        </FormProvider>
      </DialogContent>
      <Box sx={{ p: 3 }}>
        <ProductFormActions isEditMode={!!category} loading={loading} metaLoading={false} onClose={onClose} onSubmit={handleSubmit(onSubmit)} />
      </Box>
    </Dialog>
  );
};

export default CategoryForm;

import React, { useEffect } from 'react';
import { Dialog, DialogContent, Box, Stack, FormControlLabel, Switch, Select, MenuItem, InputLabel, FormControl, Typography, InputAdornment } from '@mui/material';
import { useForm, FormProvider, Controller, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tax, useTaxStore } from '../../stores/useTaxStore';
import { taxFormSchema } from '../../validation/taxSchemas';
import ModernTextField from '../ui/ModernTextField';
import CategoryFormHeader from '../category/CategoryFormHeader';
import ProductFormActions from '../product/ProductFormActions';

interface TaxFormProps {
  open: boolean;
  onClose: () => void;
  tax?: Tax | null;
}

type FormValues = z.infer<typeof taxFormSchema>;

const TaxForm: React.FC<TaxFormProps> = ({ open, onClose, tax }) => {
  const { addTax, updateTax, loading } = useTaxStore();
  
  const formMethods = useForm<FormValues>({
    resolver: zodResolver(taxFormSchema) as Resolver<FormValues>,
    defaultValues: { name: '', code: '', rate: 0, type: 'VAT', isDefault: false, isIncluded: true, active: true },
    mode: 'onChange'
  });
  
  const { handleSubmit, reset, control, setError, formState: { errors } } = formMethods;

  useEffect(() => {
    if (open) {
      if (tax) {
        reset({ ...tax, rate: Number(tax.rate) });
      } else {
        reset({ name: '', code: '', rate: 0, type: 'VAT', isDefault: false, isIncluded: true, active: true });
      }
    }
  }, [open, tax, reset]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    try {
      if (tax) {
        await updateTax(tax.id, data);
      } else {
        await addTax(data);
      }
      onClose();
    } catch (e: any) {
      if (e?.response?.data?.message?.includes('Aynı koda sahip')) {
        setError('code', { type: 'server', message: 'Bu kod zaten kullanılıyor.' });
      }
      console.error('Vergi işlemi başarısız:', e);
    }
  };

  const taxTypeOptions = [
    { value: 'VAT', label: 'KDV (Katma Değer Vergisi)' },
    { value: 'OTV', label: 'ÖTV (Özel Tüketim Vergisi)' },
    { value: 'OIV', label: 'ÖİV (Özel İletişim Vergisi)' },
    { value: 'DAMGA', label: 'Damga Vergisi' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <CategoryFormHeader isEditMode={!!tax} onClose={onClose} />
      <DialogContent sx={{ p: 4 }}>
        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <Controller name="name" control={control} render={({ field }) => (
                <ModernTextField {...field} label="Vergi Adı *" error={!!errors.name} helperText={errors.name?.message} />
              )} />
               <Stack direction="row" spacing={2}>
                 <Controller name="code" control={control} render={({ field }) => (
                    <ModernTextField {...field} label="Vergi Kodu *" error={!!errors.code} helperText={errors.code?.message} sx={{flex: 1}} />
                  )} />
                  <Controller name="rate" control={control} render={({ field }) => (
                    <ModernTextField {...field} label="Oran *" type="number" error={!!errors.rate} helperText={errors.rate?.message} sx={{flex: 1}} 
                      slotProps={{ input: { endAdornment: <InputAdornment position="end">%</InputAdornment> }}}
                    />
                  )} />
               </Stack>
              <Controller name="type" control={control} render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>Vergi Tipi</InputLabel>
                  <Select {...field} label="Vergi Tipi">
                    {taxTypeOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )} />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>Ayarlar</Typography>
                <Controller name="isDefault" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Varsayılan Vergi" />
                )} />
                <Controller name="isIncluded" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Fiyata Dahil" />
                )} />
                <Controller name="active" control={control} render={({ field }) => (
                  <FormControlLabel control={<Switch {...field} checked={field.value} />} label="Aktif" />
                )} />
              </Box>
            </Stack>
          </form>
        </FormProvider>
      </DialogContent>
      <Box sx={{ p: 3 }}>
        <ProductFormActions isEditMode={!!tax} loading={loading} metaLoading={false} onClose={onClose} onSubmit={handleSubmit(onSubmit)} />
      </Box>
    </Dialog>
  );
};

export default TaxForm;

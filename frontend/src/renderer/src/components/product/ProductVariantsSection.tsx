import React from 'react'
import { Box, Stack, TextField, IconButton, Typography, Button, Divider } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useFieldArray, useFormContext, Controller } from 'react-hook-form'

export interface VariantItem {
  id?: string
  name: string
  sku?: string
  price: number
}

interface ProductVariantsSectionProps {
  variants?: VariantItem[]; // backward compatibility, unused with RHF
  onChange?: (next: VariantItem[]) => void; // backward compatibility
  errors?: Record<string, { name?: string; sku?: string; price?: string }>; // backward compatibility
}

const ProductVariantsSection: React.FC<ProductVariantsSectionProps> = () => {
  const { control, formState } = useFormContext<any>()
  const { errors } = formState as any
  const { fields, append, remove } = useFieldArray({ control, name: 'variants' })

  const addVariant = () => {
    append({ id: crypto.randomUUID(), name: '', sku: '', price: 0 })
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Varyantlar
        </Typography>
      </Stack>

      <Button variant="contained" color="primary" startIcon={<Add />} onClick={addVariant} sx={{ mb: 2 }}>
        Varyant Ekle
      </Button>

      <Stack spacing={2}>
        {fields.length === 0 && (
          <Typography variant="body2" color="text.secondary">Henüz varyant eklenmedi.</Typography>
        )}
        {fields.map((field, idx) => (
          <Box key={field.id} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <Controller
                name={`variants.${idx}.name`}
                control={control}
                render={({ field: f }) => (
                  <TextField
                    {...f}
                    label={`Varyant Adı #${idx + 1}`}
                    fullWidth
                    placeholder="Örn: Büyük"
                    error={Boolean(errors?.variants?.[idx]?.name)}
                    helperText={errors?.variants?.[idx]?.name?.message as string}
                  />
                )}
              />
              <Controller
                name={`variants.${idx}.sku`}
                control={control}
                render={({ field: f }) => (
                  <TextField
                    {...f}
                    label="SKU"
                    sx={{ minWidth: 180 }}
                    placeholder="Örn: VAR-BYG"
                    error={Boolean(errors?.variants?.[idx]?.sku)}
                    helperText={errors?.variants?.[idx]?.sku?.message as string}
                  />
                )}
              />
              <Controller
                name={`variants.${idx}.price`}
                control={control}
                render={({ field: f }) => (
                  <TextField
                    {...f}
                    label="Fiyat"
                    type="number"
                    sx={{ minWidth: 160 }}
                    placeholder="Örn: 19.90"
                    value={f.value ?? ''}
                    onChange={(e) => f.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                    error={Boolean(errors?.variants?.[idx]?.price)}
                    helperText={errors?.variants?.[idx]?.price?.message as string}
                  />
                )}
              />
              <IconButton color="error" onClick={() => remove(idx)} aria-label="Varyantı sil">
                <Delete />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mt: 3 }} />
    </Box>
  )
}

export default ProductVariantsSection

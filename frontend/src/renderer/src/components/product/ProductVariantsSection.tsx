import React from 'react'
import { Box, Stack, TextField, IconButton, Typography, Button, Divider } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'

export interface VariantItem {
  id: string
  name: string
  sku?: string
  price?: number
}

interface ProductVariantsSectionProps {
  variants: VariantItem[]
  onChange: (next: VariantItem[]) => void
}

const ProductVariantsSection: React.FC<ProductVariantsSectionProps> = ({ variants, onChange }) => {
  const addVariant = () => {
    const next = [...variants, { id: crypto.randomUUID(), name: '', sku: '', price: undefined }]
    onChange(next)
  }

  const updateVariant = (id: string, patch: Partial<VariantItem>) => {
    onChange(variants.map(v => (v.id === id ? { ...v, ...patch } : v)))
  }

  const removeVariant = (id: string) => {
    onChange(variants.filter(v => v.id !== id))
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
        {variants.length === 0 && (
          <Typography variant="body2" color="text.secondary">Henüz varyant eklenmedi.</Typography>
        )}
        {variants.map((v, idx) => (
          <Box key={v.id} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
              <TextField
                label={`Varyant Adı #${idx + 1}`}
                value={v.name}
                onChange={(e) => updateVariant(v.id, { name: e.target.value })}
                fullWidth
                placeholder="Örn: Büyük"
              />
              <TextField
                label="SKU"
                value={v.sku || ''}
                onChange={(e) => updateVariant(v.id, { sku: e.target.value })}
                sx={{ minWidth: 180 }}
                placeholder="Örn: VAR-BYG"
              />
              <TextField
                label="Fiyat"
                type="number"
                value={v.price ?? ''}
                onChange={(e) => updateVariant(v.id, { price: e.target.value === '' ? undefined : Number(e.target.value) })}
                sx={{ minWidth: 160 }}
                placeholder="Örn: 19.90"
              />
              <IconButton color="error" onClick={() => removeVariant(v.id)} aria-label="Varyantı sil">
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

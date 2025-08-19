import React from 'react'
import { Box, Stack, Typography, Autocomplete, TextField, Chip } from '@mui/material'

export interface ProductAllergensSectionProps {
  value: string[]
  onChange: (next: string[]) => void
  disabled?: boolean
}

// Common allergen suggestions
const ALLERGEN_OPTIONS: string[] = [
  'Gluten',
  'Yumurta',
  'Süt',
  'Fındık',
  'Yer fıstığı',
  'Soya',
  'Kereviz',
  'Hardal',
  'Susam',
  'Balık',
  'Kabuklu deniz ürünleri',
  'Yumuşakça',
  'Sülfit',
]

const ProductAllergensSection: React.FC<ProductAllergensSectionProps> = ({ value, onChange, disabled }) => {
  return (
    <Box>
      <Stack spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Alerjenler</Typography>
        <Typography variant="body2" color="text.secondary">
          Üründe bulunabilecek alerjenleri seçin veya kendi etiketinizi ekleyin.
        </Typography>
      </Stack>

      <Autocomplete
        multiple
        freeSolo
        disableCloseOnSelect
        options={ALLERGEN_OPTIONS}
        value={value}
        onChange={(_e, newValue) => {
          // Dedupe case-insensitively and trim
          const seen = new Set<string>();
          const unique = newValue
            .map(v => (typeof v === 'string' ? v.trim() : String(v)))
            .filter(v => {
              const key = v.toLocaleLowerCase('tr-TR');
              if (seen.has(key)) return false;
              seen.add(key);
              return Boolean(v);
            });
          onChange(unique);
        }}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const { key, ...chipProps } = getTagProps({ index });
            return (
              <Chip key={key} {...chipProps} label={option} variant="outlined" />
            );
          })
        }
        renderInput={(params) => (
          <TextField {...params} label="Alerjenler" placeholder="Alerjen ekle" disabled={!!disabled} />
        )}
        disabled={!!disabled}
      />
    </Box>
  )
}

export default ProductAllergensSection

import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'

export type ProductFormTabKey = 'image' | 'basic' | 'pricing' | 'categories' | 'stock' | 'variants' | 'modifiers'

interface ProductFormTabsProps {
  value: ProductFormTabKey
  onChange: (next: ProductFormTabKey) => void
}

const ProductFormTabs: React.FC<ProductFormTabsProps> = ({ value, onChange }) => {
  const handleChange = (_e: React.SyntheticEvent, newValue: string) => {
    onChange(newValue as ProductFormTabKey)
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
      >
        <Tab value="image" label="Resim" />
        <Tab value="basic" label="Temel Bilgiler" />
        <Tab value="pricing" label="Fiyatlandırma" />
        <Tab value="categories" label="Kategori & Vergi" />
        <Tab value="stock" label="Stok" />
        <Tab value="variants" label="Varyantlar" />
        <Tab value="modifiers" label="Modifiye Ediciler" />
      </Tabs>
    </Box>
  )
}

export default ProductFormTabs

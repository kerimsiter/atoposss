import React from 'react'
import { Tabs, Tab, Box } from '@mui/material'

export type ProductFormTabKey = 'general' | 'variants' | 'modifiers'

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
        <Tab value="general" label="Genel" />
        <Tab value="variants" label="Varyantlar" />
        <Tab value="modifiers" label="Ek Seçenekler" />
      </Tabs>
    </Box>
  )
}

export default ProductFormTabs

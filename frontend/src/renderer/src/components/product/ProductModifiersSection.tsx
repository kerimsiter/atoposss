import React, { useEffect, useMemo, useState } from 'react'
import { Box, Stack, TextField, IconButton, Typography, Button, Divider, Switch, FormControlLabel, Autocomplete } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useMetaStore } from '../../stores/useMetaStore'

export interface ModifierItem {
  id: string
  name: string
  price?: number
  affectsStock?: boolean
}

export interface ModifierGroup {
  id: string
  name: string
  minSelect?: number
  maxSelect?: number
  items: ModifierItem[]
}

interface ProductModifiersSectionProps {
  groups: ModifierGroup[]
  onChange: (next: ModifierGroup[]) => void
  errors?: Record<string, { name?: string; minSelect?: string; maxSelect?: string; items?: Record<string, { name?: string; price?: string }> }>
}

const ProductModifiersSection: React.FC<ProductModifiersSectionProps> = ({ groups, onChange, errors }) => {
  const { modifierGroups, fetchModifierGroups } = useMetaStore()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)

  useEffect(() => {
    if (!modifierGroups || modifierGroups.length === 0) {
      void fetchModifierGroups()
    }
  }, [modifierGroups, fetchModifierGroups])

  const existingOptions = useMemo(() => modifierGroups?.map(g => ({
    id: g.id,
    label: g.name,
  })) ?? [], [modifierGroups])

  const addGroup = () => {
    const next: ModifierGroup[] = [
      ...groups,
      { id: crypto.randomUUID(), name: '', minSelect: 0, maxSelect: 1, items: [] }
    ]
    onChange(next)
  }

  const removeGroup = (id: string) => onChange(groups.filter(g => g.id !== id))

  const patchGroup = (id: string, patch: Partial<ModifierGroup>) => {
    onChange(groups.map(g => (g.id === id ? { ...g, ...patch } : g)))
  }

  const addItem = (groupId: string) => {
    onChange(groups.map(g => (
      g.id === groupId
        ? { ...g, items: [...g.items, { id: crypto.randomUUID(), name: '', price: 0, affectsStock: false }] }
        : g
    )))
  }

  const patchItem = (groupId: string, itemId: string, patch: Partial<ModifierItem>) => {
    onChange(groups.map(g => (
      g.id === groupId
        ? { ...g, items: g.items.map(i => (i.id === itemId ? { ...i, ...patch } : i)) }
        : g
    )))
  }

  const removeItem = (groupId: string, itemId: string) => {
    onChange(groups.map(g => (
      g.id === groupId
        ? { ...g, items: g.items.filter(i => i.id !== itemId) }
        : g
    )))
  }

  const addExistingGroup = (groupId: string) => {
    const meta = modifierGroups.find(g => g.id === groupId)
    if (!meta) return
    // avoid duplicates by id
    if (groups.some(g => g.id === meta.id)) return
    const mapped: ModifierGroup = {
      id: meta.id,
      name: meta.name,
      minSelect: meta.minSelection ?? 0 as any,
      maxSelect: meta.maxSelection ?? 1 as any,
      items: (meta.modifiers ?? []).map(m => ({ id: m.id, name: m.name, price: Number(m.price ?? 0), affectsStock: false })),
    }
    onChange([...groups, mapped])
  }

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B1B1B' }}>
          Ek Seçenek Grupları
        </Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Button variant="contained" startIcon={<Add />} onClick={addGroup}>
          Grup Ekle
        </Button>
        <Autocomplete
          options={existingOptions}
          getOptionLabel={(o) => o.label}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderOption={(props, option) => (
            <li {...props} key={option.id}>{option.label}</li>
          )}
          value={existingOptions.find(o => o.id === selectedGroupId) ?? null}
          onChange={(_, val) => {
            setSelectedGroupId(val?.id ?? null)
            if (val?.id) addExistingGroup(val.id)
          }}
          renderInput={(params) => (
            <TextField {...params} label="Mevcut Grup Ekle" placeholder="Grup ara ve ekle" />
          )}
          sx={{ minWidth: 320 }}
        />
      </Stack>

      <Stack spacing={2}>
        {groups.length === 0 && (
          <Typography variant="body2" color="text.secondary">Henüz grup eklenmedi.</Typography>
        )}
        {groups.map((g, gi) => (
          <Box key={g.id} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label={`Grup Adı #${gi + 1}`}
                  value={g.name}
                  onChange={(e) => patchGroup(g.id, { name: e.target.value })}
                  fullWidth
                  placeholder="Örn: İçecek Boyutu"
                  error={Boolean(errors?.[g.id]?.name)}
                  helperText={errors?.[g.id]?.name}
                />
                <TextField
                  label="Min Seçim"
                  type="number"
                  value={g.minSelect ?? 0}
                  onChange={(e) => patchGroup(g.id, { minSelect: Number(e.target.value) })}
                  sx={{ minWidth: 160 }}
                  placeholder="Örn: 0"
                  error={Boolean(errors?.[g.id]?.minSelect)}
                  helperText={errors?.[g.id]?.minSelect}
                />
                <TextField
                  label="Maks Seçim"
                  type="number"
                  value={g.maxSelect ?? 1}
                  onChange={(e) => patchGroup(g.id, { maxSelect: Number(e.target.value) })}
                  sx={{ minWidth: 160 }}
                  placeholder="Örn: 1"
                  error={Boolean(errors?.[g.id]?.maxSelect)}
                  helperText={errors?.[g.id]?.maxSelect}
                />
                <IconButton color="error" onClick={() => removeGroup(g.id)} aria-label="Grubu sil">
                  <Delete />
                </IconButton>
              </Stack>

              <Button variant="outlined" startIcon={<Add />} onClick={() => addItem(g.id)}>
                Seçenek Ekle
              </Button>

              <Stack spacing={2}>
                {g.items.map((i, ii) => (
                  <Box key={i.id} sx={{ p: 2, borderRadius: 2, border: '1px dashed rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.4)' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <TextField
                        label={`Seçenek Adı #${ii + 1}`}
                        value={i.name}
                        onChange={(e) => patchItem(g.id, i.id, { name: e.target.value })}
                        fullWidth
                        placeholder="Örn: Büyük"
                        error={Boolean(errors?.[g.id]?.items?.[i.id]?.name)}
                        helperText={errors?.[g.id]?.items?.[i.id]?.name}
                      />
                      <TextField
                        label="Fiyat"
                        type="number"
                        value={i.price ?? 0}
                        onChange={(e) => patchItem(g.id, i.id, { price: Number(e.target.value) })}
                        sx={{ minWidth: 160 }}
                        placeholder="Örn: 5.00"
                        error={Boolean(errors?.[g.id]?.items?.[i.id]?.price)}
                        helperText={errors?.[g.id]?.items?.[i.id]?.price}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(i.affectsStock)}
                            onChange={(e) => patchItem(g.id, i.id, { affectsStock: e.target.checked })}
                          />
                        }
                        label="Stok Etkiler"
                      />
                      <IconButton color="error" onClick={() => removeItem(g.id, i.id)} aria-label="Seçeneği sil">
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>
        ))}
      </Stack>

      <Divider sx={{ mt: 3 }} />
    </Box>
  )
}

export default ProductModifiersSection

import React, { useEffect, useMemo, useState } from 'react'
import { Box, Stack, TextField, IconButton, Typography, Button, Divider, Switch, FormControlLabel, Autocomplete } from '@mui/material'
import { Add, Delete } from '@mui/icons-material'
import { useMetaStore } from '../../stores/useMetaStore'
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form'

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
  groups?: ModifierGroup[]; // backward compatibility, unused with RHF
  onChange?: (next: ModifierGroup[]) => void; // backward compatibility
  errors?: Record<string, { name?: string; minSelect?: string; maxSelect?: string; items?: Record<string, { name?: string; price?: string }> }>; // backward compatibility
}

const ProductModifiersSection: React.FC<ProductModifiersSectionProps> = () => {
  const { modifierGroups, fetchModifierGroups } = useMetaStore()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const { control, setValue, formState } = useFormContext<any>()
  const { errors } = formState as any
  const { fields: groupFields, append: appendGroup, remove: removeGroupAt } = useFieldArray({ control, name: 'modifierGroups' })
  // Watch live values for the array so TextFields reflect edits instead of stale field defaults
  const watchedGroups = (useWatch({ control, name: 'modifierGroups' }) as any[]) ?? []

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
    appendGroup({ id: crypto.randomUUID(), name: '', minSelect: 0, maxSelect: 1, items: [] } as any)
  }

  const addExistingGroup = (groupId: string) => {
    const meta = modifierGroups.find(g => g.id === groupId)
    if (!meta) return
    // avoid duplicates by id
    if ((groupFields as any[]).some((g) => g.id === meta.id)) return
    const mapped: ModifierGroup = {
      id: meta.id,
      name: meta.name,
      minSelect: meta.minSelection ?? 0 as any,
      maxSelect: meta.maxSelection ?? 1 as any,
      items: (meta.modifiers ?? []).map(m => ({ id: m.id, name: m.name, price: Number(m.price ?? 0), affectsStock: false })),
    }
    appendGroup(mapped as any)
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
        {groupFields.length === 0 && (
          <Typography variant="body2" color="text.secondary">Henüz grup eklenmedi.</Typography>
        )}
        {groupFields.map((g, gi) => {
          const wg = watchedGroups?.[gi] ?? (g as any)
          const itemsArr = (wg?.items ?? []) as any[]
          return (
          <Box key={g.id} sx={{ p: 2, borderRadius: 2, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', backdropFilter: 'blur(8px)' }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                <TextField
                  label={`Grup Adı #${gi + 1}`}
                  value={wg?.name ?? ''}
                  onChange={(e) => setValue(`modifierGroups.${gi}.name`, e.target.value, { shouldValidate: true, shouldDirty: true })}
                  fullWidth
                  placeholder="Örn: İçecek Boyutu"
                  error={Boolean(errors?.modifierGroups?.[gi]?.name)}
                  helperText={errors?.modifierGroups?.[gi]?.name?.message as string}
                />
                <TextField
                  label="Min Seçim"
                  type="number"
                  value={wg?.minSelect ?? 0}
                  onChange={(e) => setValue(`modifierGroups.${gi}.minSelect`, Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                  sx={{ minWidth: 160 }}
                  placeholder="Örn: 0"
                  error={Boolean(errors?.modifierGroups?.[gi]?.minSelect)}
                  helperText={errors?.modifierGroups?.[gi]?.minSelect?.message as string}
                />
                <TextField
                  label="Maks Seçim"
                  type="number"
                  value={wg?.maxSelect ?? 1}
                  onChange={(e) => setValue(`modifierGroups.${gi}.maxSelect`, Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                  sx={{ minWidth: 160 }}
                  placeholder="Örn: 1"
                  error={Boolean(errors?.modifierGroups?.[gi]?.maxSelect)}
                  helperText={errors?.modifierGroups?.[gi]?.maxSelect?.message as string}
                />
                <IconButton color="error" onClick={() => removeGroupAt(gi)} aria-label="Grubu sil">
                  <Delete />
                </IconButton>
              </Stack>

              <Button variant="outlined" startIcon={<Add />} onClick={() => {
                const items = (itemsArr ?? []) as any[]
                const next = [...items, { id: crypto.randomUUID(), name: '', price: 0, affectsStock: false }]
                setValue(`modifierGroups.${gi}.items`, next as any, { shouldValidate: true, shouldDirty: true })
              }}>
                Seçenek Ekle
              </Button>

              <Stack spacing={2}>
                {itemsArr.map((i: any, ii: number) => (
                  <Box key={i.id} sx={{ p: 2, borderRadius: 2, border: '1px dashed rgba(0,0,0,0.1)', background: 'rgba(255,255,255,0.4)' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                      <TextField
                        label={`Seçenek Adı #${ii + 1}`}
                        value={itemsArr[ii]?.name ?? ''}
                        onChange={(e) => setValue(`modifierGroups.${gi}.items.${ii}.name`, e.target.value, { shouldValidate: true, shouldDirty: true })}
                        fullWidth
                        placeholder="Örn: Büyük"
                        error={Boolean(errors?.modifierGroups?.[gi]?.items?.[ii]?.name)}
                        helperText={errors?.modifierGroups?.[gi]?.items?.[ii]?.name?.message as string}
                      />
                      <TextField
                        label="Fiyat"
                        type="number"
                        value={itemsArr[ii]?.price ?? 0}
                        onChange={(e) => setValue(`modifierGroups.${gi}.items.${ii}.price`, Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                        sx={{ minWidth: 160 }}
                        placeholder="Örn: 5.00"
                        error={Boolean(errors?.modifierGroups?.[gi]?.items?.[ii]?.price)}
                        helperText={errors?.modifierGroups?.[gi]?.items?.[ii]?.price?.message as string}
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(itemsArr[ii]?.affectsStock)}
                            onChange={(e) => setValue(`modifierGroups.${gi}.items.${ii}.affectsStock`, e.target.checked, { shouldValidate: false, shouldDirty: true })}
                          />
                        }
                        label="Stok Etkiler"
                      />
                      <IconButton color="error" onClick={() => {
                        const items = (itemsArr ?? []) as any[]
                        const next = items.filter((_, index) => index !== ii)
                        setValue(`modifierGroups.${gi}.items`, next as any, { shouldValidate: true, shouldDirty: true })
                      }} aria-label="Seçeneği sil">
                        <Delete />
                      </IconButton>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </Stack>
          </Box>
          )
        })}
      </Stack>

      <Divider sx={{ mt: 3 }} />
    </Box>
  )
}

export default ProductModifiersSection

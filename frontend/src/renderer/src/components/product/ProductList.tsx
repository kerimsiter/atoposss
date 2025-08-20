import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
  Stack,
  Avatar,
  Tooltip,
  InputAdornment,
  Button,
} from '@mui/material';
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridSortModel,
  GridPaginationModel,
  GridToolbar,
} from '@mui/x-data-grid';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon,
  ViewColumn as ColumnsIcon
} from '@mui/icons-material';
import { Product, useProductStore } from '../../stores/useProductStore';
import { formatPrice } from '../../utils/formatters';
import ModernTextField from '../ui/ModernTextField';
import ModernChip from '../ui/ModernChip';
import ColumnOrderDialog from './ColumnOrderDialog';

interface ProductListProps {
  onEditProduct: (product: Product) => void;
}

function ProductList({ onEditProduct }: ProductListProps) {
  const { products, deleteProduct, loading, fetchProducts, pagination } = useProductStore() as any;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'active' | 'inactive' | 'trackStock'>('all');
  // DataGrid zero-based page model
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 20 });
  const [sortModel, setSortModel] = useState<GridSortModel>([
    { field: 'createdAt', sort: 'desc' }
  ]);
  const STORAGE_KEYS = {
    visibility: 'productList.columnVisibility',
    widths: 'productList.columnWidths',
    order: 'productList.columnOrder',
  } as const;

  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  const [columnVisibilityModel, setColumnVisibilityModel] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.visibility);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      createdAt: true,
      code: true,
      name: true,
      barcode: true,
      basePrice: true,
      unit: true,
      active: true,
      trackStock: true,
      actions: true,
    } as Record<string, boolean>;
  });

  // Column order persistence
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.order);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.widths);
      if (saved) return JSON.parse(saved);
    } catch {}
    return {} as Record<string, number>;
  });

  // Map UI filter to API params
  const apiFilters = useMemo(() => {
    return {
      active:
        filterBy === 'active' ? true : filterBy === 'inactive' ? false : undefined,
      trackStock: filterBy === 'trackStock' ? true : undefined,
    } as { active?: boolean; trackStock?: boolean };
  }, [filterBy]);

  // Persist visibility
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.visibility, JSON.stringify(columnVisibilityModel)); } catch {}
  }, [columnVisibilityModel]);

  // Persist widths
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.widths, JSON.stringify(columnWidths)); } catch {}
  }, [columnWidths]);

  // Persist order
  useEffect(() => {
    if (!columnOrder || columnOrder.length === 0) return;
    try { localStorage.setItem(STORAGE_KEYS.order, JSON.stringify(columnOrder)); } catch {}
  }, [columnOrder]);

  // date time formatter
  const formatDateTime = useCallback((iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('tr-TR', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).format(d);
    } catch {
      return iso;
    }
  }, []);

  // Debounced search/filter fetch - reset to first page (0 in UI, 1 for API)
  useEffect(() => {
    const handle = setTimeout(() => {
      setPaginationModel(pm => ({ ...pm, page: 0 }));
      const activeSort = sortModel[0];
      fetchProducts({
        page: 1,
        pageSize: paginationModel.pageSize,
        search: searchTerm || undefined,
        ...apiFilters,
        sortBy: (activeSort?.field as any) || 'createdAt',
        order: (activeSort?.sort as any) || 'desc',
      });
    }, 400);
    return () => clearTimeout(handle);
  }, [searchTerm, apiFilters, paginationModel.pageSize, sortModel, fetchProducts]);

  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setPaginationModel(model);
    const activeSort = sortModel[0];
    fetchProducts({
      page: model.page + 1,
      pageSize: model.pageSize,
      search: searchTerm || undefined,
      ...apiFilters,
      sortBy: (activeSort?.field as any) || 'createdAt',
      order: (activeSort?.sort as any) || 'desc',
    });
  }, [apiFilters, fetchProducts, searchTerm, sortModel]);

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model);
    const next = model[0];
    fetchProducts({
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      search: searchTerm || undefined,
      ...apiFilters,
      sortBy: (next?.field as any) || 'createdAt',
      order: (next?.sort as any) || 'desc',
    });
  }, [apiFilters, fetchProducts, paginationModel.page, paginationModel.pageSize, searchTerm]);

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Server-side filtered list comes as `products`, total count is in `pagination.total`

  const getUnitLabel = (unit: string) => {
    const unitLabels: Record<string, string> = {
      'PIECE': 'Adet',
      'KG': 'Kg',
      'GRAM': 'Gram',
      'LITER': 'Litre',
      'ML': 'ml',
      'PORTION': 'Porsiyon',
      'BOX': 'Kutu',
      'PACKAGE': 'Paket'
    };
    return unitLabels[unit] || unit;
  };

  // DataGrid columns
  const columns: GridColDef[] = useMemo(() => [
    // Date column (formatted)
    {
      field: 'createdAt',
      headerName: 'Oluşturulma',
      sortable: true,
      minWidth: 160,
      width: columnWidths['createdAt'] ?? 160,
      flex: 0.8,
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Typography variant="body2" color="text.secondary">
          {formatDateTime(params.row.createdAt)}
        </Typography>
      )
    },
    {
      field: 'code',
      headerName: 'Ürün Kodu',
      minWidth: 140,
      width: columnWidths['code'] ?? 140,
      flex: 0.6,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ 
          fontWeight: 600, 
          fontFamily: 'monospace',
          color: '#2D68FF',
          fontSize: '0.875rem'
        }}>
          {params.value as string}
        </Typography>
      )
    },
    {
      field: 'name',
      headerName: 'Ürün Bilgileri',
      minWidth: 260,
      width: columnWidths['name'] ?? 260,
      flex: 1.4,
      sortable: true,
      renderCell: (params: GridRenderCellParams<Product>) => {
        const product = params.row as Product;
        const image = (product.image || (product as any).images?.[0]) as any;
        return (
          <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 0.5 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={image}
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  background: image ? 'transparent' : 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                  border: '1.5px solid rgba(246, 246, 246, 1)',
                }}
              >
                {!image && <InventoryIcon color="primary" />}
              </Avatar>
              {Array.isArray((product as any).images) && (product as any).images.length > 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    background: 'rgba(45, 104, 255, 0.9)',
                    color: 'white',
                    borderRadius: '10px',
                    px: 0.75,
                    py: 0.25,
                    fontSize: '10px',
                    fontWeight: 700,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  {(product as any).images.length}
                </Box>
              )}
            </Box>
            <Stack spacing={0.5}>
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
                {product.name}
              </Typography>
              {product.description && (
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                  {product.description}
                </Typography>
              )}
            </Stack>
          </Stack>
        );
      }
    },
    {
      field: 'barcode',
      headerName: 'Barkod',
      minWidth: 160,
      width: columnWidths['barcode'] ?? 160,
      flex: 0.8,
      renderCell: (params: GridRenderCellParams) => (
        <Typography variant="body2" sx={{ 
          fontFamily: 'monospace',
          color: params.value ? '#1B1B1B' : '#727272',
          fontSize: '0.875rem'
        }}>
          {(params.value as string) || '—'}
        </Typography>
      )
    },
    {
      field: 'basePrice',
      headerName: 'Fiyat',
      type: 'number',
      minWidth: 140,
      width: columnWidths['basePrice'] ?? 140,
      flex: 0.8,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Stack alignItems="flex-end" spacing={0.5} sx={{ width: '100%' }}>
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <PriceIcon fontSize="small" color="success" />
            <Typography variant="body2" sx={{ 
              fontWeight: 700, 
              color: '#00A656',
              fontSize: '0.875rem'
            }}>
              ₺{formatPrice(params.row.basePrice as any)}
            </Typography>
          </Stack>
        </Stack>
      )
    },
    {
      field: 'unit',
      headerName: 'Birim',
      minWidth: 120,
      width: columnWidths['unit'] ?? 120,
      flex: 0.6,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ModernChip
            label={getUnitLabel(params.row.unit)}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      )
    },
    {
      field: 'active',
      headerName: 'Durum',
      minWidth: 140,
      width: columnWidths['active'] ?? 140,
      flex: 0.7,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ModernChip
            label={params.row.active ? 'Aktif' : 'Pasif'}
            color={params.row.active ? 'success' : 'default'}
            gradient={params.row.active}
            size="small"
          />
        </Box>
      )
    },
    {
      field: 'trackStock',
      headerName: 'Stok Takibi',
      minWidth: 160,
      width: columnWidths['trackStock'] ?? 160,
      flex: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ModernChip
            label={params.row.trackStock ? 'Evet' : 'Hayır'}
            color={params.row.trackStock ? 'primary' : 'default'}
            gradient={params.row.trackStock}
            size="small"
            variant={params.row.trackStock ? 'filled' : 'outlined'}
          />
        </Box>
      )
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      sortable: false,
      filterable: false,
      minWidth: 160,
      width: columnWidths['actions'] ?? 160,
      flex: 0.8,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Product>) => (
        <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
          <Tooltip title="Ürünü Düzenle" arrow>
            <IconButton
              size="small"
              onClick={() => onEditProduct(params.row)}
              sx={{
                borderRadius: 2,
                background: 'rgba(45, 104, 255, 0.1)',
                color: '#2D68FF',
                '&:hover': {
                  background: 'rgba(45, 104, 255, 0.2)',
                },
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Ürünü Sil" arrow>
            <IconButton
              size="small"
              onClick={() => handleDeleteProduct(params.row.id, params.row.name)}
              sx={{
                borderRadius: 2,
                background: 'rgba(255, 82, 82, 0.1)',
                color: '#FF5252',
                '&:hover': {
                  background: 'rgba(255, 82, 82, 0.2)',
                },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )
    },
  ], [formatDateTime, onEditProduct]);

  // Compute default order from current columns if needed
  const defaultOrderedFields = useMemo(() => columns.map(c => c.field), [columns]);
  const columnLabels = useMemo(() => {
    const map: Record<string, string> = {};
    columns.forEach(c => { map[c.field] = (c.headerName as string) || c.field; });
    return map;
  }, [columns]);
  const initialOrderedFields = useMemo(() => {
    if (columnOrder && columnOrder.length > 0) {
      // keep only existing fields, append any new fields not present in saved order
      const known = new Set(defaultOrderedFields);
      const sanitized = columnOrder.filter(f => known.has(f));
      const missing = defaultOrderedFields.filter(f => !sanitized.includes(f));
      return [...sanitized, ...missing];
    }
    return defaultOrderedFields;
  }, [columnOrder, defaultOrderedFields]);

  // Reorder columns array according to current ordered fields (controlled order)
  const orderedColumns = useMemo(() => {
    const map = new Map(columns.map(c => [c.field, c] as const));
    const result: GridColDef[] = [];
    for (const f of initialOrderedFields) {
      const col = map.get(f);
      if (col) result.push(col);
    }
    // append any remaining columns just in case
    columns.forEach(c => { if (!result.includes(c)) result.push(c); });
    return result;
  }, [columns, initialOrderedFields]);

  // Custom overlays
  const NoRowsOverlay = useMemo(() => function NoRows() {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
        <Avatar sx={{ 
          width: 64, height: 64,
          background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
          color: '#2D68FF'
        }}>
          <InventoryIcon fontSize="large" />
        </Avatar>
        <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500, mt: 2 }}>
          {searchTerm || filterBy !== 'all' ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {searchTerm || filterBy !== 'all' ? 'Farklı arama terimleri deneyin' : 'İlk ürününüzü eklemek için "Yeni Ürün Ekle" butonunu kullanın'}
        </Typography>
      </Stack>
    );
  }, [filterBy, searchTerm]);

  // Basit hata mesajını üstte ayrı gösterebiliriz veya boş overlay'i kullanırız (slot errorOverlay community sürümde yok)

  return (
    <Box>
      {/* Search and Filter Controls */}
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4, position: 'relative', zIndex: 2 }}>
        <ModernTextField
          placeholder="Ürün adı, kodu veya barkod ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ 
            minWidth: 320,
            pointerEvents: 'auto',
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              background: '#F8F9FA',
              border: '1px solid #E0E0E0',
              '&:hover': {
                background: '#F1F3FF',
                border: '1px solid #D0D0D0',
              },
              '&.Mui-focused': {
                background: '#FDFDFD',
                border: '1px solid #2D68FF',
                boxShadow: '0px 0px 0px 3px rgba(45, 104, 255, 0.1)',
              },
              '& fieldset': {
                border: 'none',
              },
            },
            '& .MuiInputBase-input': {
              color: '#1B1B1B',
              fontWeight: 500,
              fontSize: '0.875rem',
              '&::placeholder': {
                color: '#A8A8A8',
                opacity: 1,
              }
            }
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#A8A8A8', fontSize: 20 }} />
                </InputAdornment>
              ),
            }
          }}
        />

        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel sx={{ color: '#A8A8A8', fontWeight: 500 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <FilterIcon fontSize="small" />
              <span>Filtrele</span>
            </Stack>
          </InputLabel>
          <Select
            value={filterBy}
            label="Filtrele"
            onChange={(e) => setFilterBy(e.target.value)}
            sx={{
              borderRadius: 12,
              background: '#F8F9FA',
              border: '1px solid #E0E0E0',
              '&:hover': {
                background: '#F1F3FF',
                border: '1px solid #D0D0D0',
              },
              '&.Mui-focused': {
                background: '#FDFDFD',
                border: '1px solid #2D68FF',
                boxShadow: '0px 0px 0px 3px rgba(45, 104, 255, 0.1)',
              },
              '& fieldset': {
                border: 'none',
              },
              '& .MuiSelect-select': {
                color: '#1B1B1B',
                fontWeight: 500,
                fontSize: '0.875rem',
              }
            }}
          >
            <MenuItem value="all">Tümü</MenuItem>
            <MenuItem value="active">Aktif Ürünler</MenuItem>
            <MenuItem value="inactive">Pasif Ürünler</MenuItem>
            <MenuItem value="trackStock">Stok Takipli</MenuItem>
          </Select>
        </FormControl>

        <Box sx={{ 
          px: 3, 
          py: 1.5, 
          borderRadius: 2,
          background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
          border: '1px solid rgba(45, 104, 255, 0.2)',
        }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D68FF' }}>
            Toplam {pagination.total} kayıt
          </Typography>
        </Box>

        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Kolon Sırası" arrow>
          <Button
            size="small"
            startIcon={<ColumnsIcon sx={{ fontSize: 18 }} />}
            onClick={() => setOrderDialogOpen(true)}
            sx={{
              textTransform: 'none',
              borderRadius: 999,
              px: 1.75,
              py: 0.75,
              fontWeight: 600,
              fontSize: '0.8rem',
              bgcolor: 'rgba(45, 104, 255, 0.08)',
              color: '#2D68FF',
              border: '1px solid rgba(45, 104, 255, 0.25)',
              boxShadow: '0 2px 6px rgba(45, 104, 255, 0.15)',
              '&:hover': {
                bgcolor: 'rgba(45, 104, 255, 0.16)',
                borderColor: 'rgba(45, 104, 255, 0.35)',
                boxShadow: '0 3px 10px rgba(45, 104, 255, 0.2)'
              },
              '&:active': {
                bgcolor: 'rgba(45, 104, 255, 0.22)'
              },
              '& .MuiButton-startIcon': {
                mr: 1
              }
            }}
          >
            Kolon Sırası
          </Button>
        </Tooltip>
      </Stack>
      {/* Products DataGrid */}
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        borderRadius: 3,
        border: '1.5px solid rgba(246, 246, 246, 1)',
        background: 'rgba(253, 253, 253, 0.8)',
        backdropFilter: 'blur(32px)',
        boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden',
        height: 560
      }}>
        <DataGrid
          rows={products}
          columns={orderedColumns}
          getRowId={(row) => row.id}
          rowCount={pagination.total}
          loading={loading}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={handlePaginationModelChange}
          sortModel={sortModel}
          onSortModelChange={handleSortModelChange}
          onStateChange={(state: any) => {
            // debug
            try {
              const ordered = state.columns?.orderedFields;
              if (ordered) console.log('state.columns.orderedFields', ordered);
            } catch {}
          }}
          onColumnOrderChange={(params: any) => {
            // debug
            try { console.log('onColumnOrderChange', params); } catch {}
            const { column, targetIndex } = params || {};
            const field: string | undefined = column?.field;
            if (!field || typeof targetIndex !== 'number') return;
            setColumnOrder(prev => {
              const current = (prev && prev.length > 0) ? [...prev] : defaultOrderedFields.slice();
              // ensure all current fields exist
              const withAll = Array.from(new Set([...current, ...defaultOrderedFields]));
              // move field to targetIndex
              const from = withAll.indexOf(field);
              if (from === -1) return withAll;
              withAll.splice(from, 1);
              const idx = Math.max(0, Math.min(targetIndex, withAll.length));
              withAll.splice(idx, 0, field);
              return withAll;
            });
          }}
          onColumnWidthChange={(params: any) => {
            const { colDef, width } = params || {};
            if (!colDef?.field || typeof width !== 'number') return;
            setColumnWidths(prev => ({ ...prev, [colDef.field]: width }));
          }}
          disableRowSelectionOnClick
          disableColumnMenu={false}
          checkboxSelection={false}
          showCellVerticalBorder={false}
          showColumnVerticalBorder={false}
          columnHeaderHeight={56}
          getRowHeight={() => 64}
          columnVisibilityModel={columnVisibilityModel}
          onColumnVisibilityModelChange={(model) => setColumnVisibilityModel(model)}
          slots={{
            toolbar: GridToolbar,
            noRowsOverlay: NoRowsOverlay,
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: false,
            }
          }}
          initialState={{
            columns: { orderedFields: initialOrderedFields }
          }}
          sx={{
            '& .MuiDataGrid-columnHeaders': {
              background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
              fontWeight: 600,
            },
            '& .MuiDataGrid-columnHeaderTitle': {
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1B1B1B',
            },
            '& .MuiDataGrid-columnHeaderDraggableContainer': {
              cursor: 'grab',
            },
            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-columnHeader *': {
              pointerEvents: 'auto',
            },
            '& .MuiDataGrid-cell': {
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#1B1B1B',
              py: 2,
            },
            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
              outline: 'none',
            },
          }}
        />
      </Box>
      <ColumnOrderDialog // Render dialog
        open={orderDialogOpen}
        onClose={() => setOrderDialogOpen(false)}
        defaultFields={defaultOrderedFields}
        labels={columnLabels}
        value={initialOrderedFields}
        onChange={(next) => setColumnOrder(next)}
      />
    </Box>
  );
}

export default React.memo(ProductList);
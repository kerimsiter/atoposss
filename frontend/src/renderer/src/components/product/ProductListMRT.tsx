import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Avatar,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
  ViewColumn as ColumnsIcon,
} from '@mui/icons-material';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_ColumnOrderState,
  type MRT_VisibilityState,
  type MRT_ColumnSizingState,
} from 'material-react-table';
import { MRT_Localization_TR } from 'material-react-table/locales/tr';
import ModernTextField from '../ui/ModernTextField';
import ModernChip from '../ui/ModernChip';
import { useProductStore, type Product } from '../../stores/useProductStore';

// util helpers (kısa versiyon)
const formatPrice = (v: string | number | undefined) => {
  if (v === undefined || v === null) return '—';
  const n = typeof v === 'string' ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);
};
const formatDateTime = (iso?: string) => {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR');
  } catch {
    return iso;
  }
};

// localStorage keys
const LS_KEY_PREFIX = 'productList';
const LS_ORDER = `${LS_KEY_PREFIX}.columnOrder`;
const LS_VISIBILITY = `${LS_KEY_PREFIX}.columnVisibility`;
const LS_SIZING = `${LS_KEY_PREFIX}.columnSizing`;

export interface ProductListMRTProps {
  onEditProduct?: (p: Product) => void;
  onDeleteProduct?: (id: string, name: string) => void;
}

const ProductListMRT: React.FC<ProductListMRTProps> = ({ onEditProduct, onDeleteProduct }) => {
  const { products, pagination, loading, fetchProducts } = useProductStore();

  // search & simple filter (opsiyonel - hızlı entegrasyon)
  const [searchTerm, setSearchTerm] = useState('');

  // MRT controlled states + persistence
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [columnOrder, setColumnOrder] = useState<MRT_ColumnOrderState>(() => {
    const raw = localStorage.getItem(LS_ORDER);
    return raw ? (JSON.parse(raw) as string[]) : [];
  });
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(() => {
    const raw = localStorage.getItem(LS_VISIBILITY);
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
  });
  const [columnSizing, setColumnSizing] = useState<MRT_ColumnSizingState>(() => {
    const raw = localStorage.getItem(LS_SIZING);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  });

  useEffect(() => {
    localStorage.setItem(LS_ORDER, JSON.stringify(columnOrder));
  }, [columnOrder]);
  useEffect(() => {
    localStorage.setItem(LS_VISIBILITY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);
  useEffect(() => {
    localStorage.setItem(LS_SIZING, JSON.stringify(columnSizing));
  }, [columnSizing]);

  // server-side fetch: map MRT sorting to backend sortBy/order (first rule only)
  useEffect(() => {
    const sort = sorting[0];
    const sortBy = sort?.id as any | undefined; // kolon id'si backend alanıyla aynı tutulmalı
    const order = sort ? (sort.desc ? 'desc' : 'asc') : undefined;
    fetchProducts({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchTerm || undefined,
      sortBy,
      order,
    });
  }, [fetchProducts, sorting, searchTerm, pagination.page, pagination.pageSize]);

  const columns = useMemo<MRT_ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Oluşturulma',
        enableColumnPinning: true,
        size: columnSizing['createdAt'] ?? 160,
        Cell: ({ cell }) => (
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(cell.getValue<string>())}
          </Typography>
        ),
      },
      {
        accessorKey: 'code',
        header: 'Ürün Kodu',
        enableColumnPinning: true,
        pinned: 'left',
        size: columnSizing['code'] ?? 140,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace', color: '#2D68FF' }}>
            {cell.getValue<string>()}
          </Typography>
        ),
      },
      {
        id: 'productInfo',
        header: 'Ürün Bilgileri',
        enableColumnPinning: true,
        size: columnSizing['productInfo'] ?? 280,
        accessorFn: (row) => row.name,
        Cell: ({ row }) => {
          const p = row.original;
          const image = p.image || (Array.isArray(p.images) ? p.images[0] : '');
          return (
            <Stack direction="row" spacing={2} alignItems="center" sx={{ py: 0.5 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={image}
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    background: image
                      ? 'transparent'
                      : 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                    border: '1.5px solid rgba(246, 246, 246, 1)',
                  }}
                >
                  {!image && <InventoryIcon color="primary" fontSize="small" />}
                </Avatar>
              </Box>
              <Stack spacing={0.25}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {p.name}
                </Typography>
                {p.description && (
                  <Typography variant="caption" color="text.secondary">
                    {p.description}
                  </Typography>
                )}
              </Stack>
            </Stack>
          );
        },
      },
      {
        accessorKey: 'barcode',
        header: 'Barkod',
        size: columnSizing['barcode'] ?? 160,
        Cell: ({ cell }) => (
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {cell.getValue<string>() || '—'}
          </Typography>
        ),
      },
      {
        accessorKey: 'basePrice',
        header: 'Fiyat',
        size: columnSizing['basePrice'] ?? 140,
        enableColumnFilter: false,
        Cell: ({ cell }) => (
          <Stack alignItems="flex-end" sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: '#00A656' }}>
              ₺{formatPrice(cell.getValue<number | string>())}
            </Typography>
          </Stack>
        ),
      },
      {
        accessorKey: 'unit',
        header: 'Birim',
        size: columnSizing['unit'] ?? 120,
        Cell: ({ cell }) => (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ModernChip label={String(cell.getValue() || '')} size="small" sx={{ fontSize: '0.75rem' }} />
          </Box>
        ),
      },
      {
        accessorKey: 'active',
        header: 'Durum',
        size: columnSizing['active'] ?? 140,
        Cell: ({ cell }) => (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ModernChip
              label={cell.getValue<boolean>() ? 'Aktif' : 'Pasif'}
              color={cell.getValue<boolean>() ? 'success' : 'default'}
              gradient={cell.getValue<boolean>()}
              size="small"
            />
          </Box>
        ),
      },
      {
        accessorKey: 'trackStock',
        header: 'Stok Takibi',
        size: columnSizing['trackStock'] ?? 160,
        Cell: ({ cell }) => (
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <ModernChip
              label={cell.getValue<boolean>() ? 'Evet' : 'Hayır'}
              color={cell.getValue<boolean>() ? 'primary' : 'default'}
              gradient={cell.getValue<boolean>()}
              size="small"
              variant={cell.getValue<boolean>() ? 'filled' : 'outlined'}
            />
          </Box>
        ),
      },
      {
        id: 'actions',
        header: 'İşlemler',
        enableSorting: false,
        enableColumnFilter: false,
        pinned: 'right',
        size: columnSizing['actions'] ?? 140,
        Cell: ({ row }) => (
          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center" sx={{ width: '100%' }}>
            <Tooltip title="Ürünü Düzenle" arrow>
              <IconButton
                size="small"
                onClick={() => onEditProduct?.(row.original)}
                sx={{ borderRadius: 2, background: 'rgba(45, 104, 255, 0.1)', color: '#2D68FF', '&:hover': { background: 'rgba(45, 104, 255, 0.2)' } }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Ürünü Sil" arrow>
              <IconButton
                size="small"
                onClick={() => onDeleteProduct?.(row.original.id, row.original.name)}
                sx={{ borderRadius: 2, background: 'rgba(255, 82, 82, 0.1)', color: '#FF5252', '&:hover': { background: 'rgba(255, 82, 82, 0.2)' } }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ], [columnSizing, onEditProduct, onDeleteProduct]
  );

  const table = useMaterialReactTable<Product>({
    columns,
    data: products,
    localization: MRT_Localization_TR,
    state: {
      isLoading: loading,
      sorting,
      columnOrder,
      columnVisibility,
      columnSizing,
      pagination: { pageIndex: pagination.page - 1, pageSize: pagination.pageSize },
      showGlobalFilter: false,
    },
    onSortingChange: setSorting,
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
    onPaginationChange: (updater) => {
      // MRT v3 Updater<PaginationState> alır, doğrudan destrüktüre edilmez
      const current = { pageIndex: pagination.page - 1, pageSize: pagination.pageSize };
      const next = typeof updater === 'function' ? (updater as any)(current) : (updater as any);
      fetchProducts({
        page: (next?.pageIndex ?? current.pageIndex) + 1,
        pageSize: next?.pageSize ?? current.pageSize,
        search: searchTerm || undefined,
      });
    },

    enableColumnOrdering: true,
    enableColumnResizing: true,
    enableColumnPinning: true,
    enableStickyHeader: true,

    manualPagination: true,
    manualSorting: true,

    rowCount: pagination.total,

    // Stil ve container
    muiTableContainerProps: {
      sx: {
        borderRadius: 3,
        border: '1.5px solid rgba(246, 246, 246, 1)',
        background: 'rgba(253, 253, 253, 0.8)',
        backdropFilter: 'blur(32px)',
        boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
        // Küçük ekranlarda sağa kaydırma için yatay scroll aç
        overflowX: 'auto',
        overflowY: 'hidden',
        maxWidth: '100%',
      },
    },
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: '#1B1B1B',
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: '0.875rem',
        color: '#1B1B1B',
      },
    },

    // Toolbar özelleştirme (mevcut UI ile uyumlu basit sürüm)
    renderToolbarInternalActions: ({ table }) => (
      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%', p: 1 }}>
        <ModernTextField
          placeholder="Ürün adı, kodu veya barkod ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
        />
        <Box sx={{ px: 2, py: 1, borderRadius: 2, background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)', border: '1px solid rgba(45, 104, 255, 0.2)' }}>
          <Typography variant="body2" sx={{ fontWeight: 500, color: '#2D68FF' }}>
            Toplam {pagination.total} kayıt
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Tooltip title="Kolonları Yönet" arrow>
          <Button
            size="small"
            startIcon={<ColumnsIcon sx={{ fontSize: 18 }} />}
            onClick={() => table.setShowColumnFilters(!table.getState().showColumnFilters)}
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
                boxShadow: '0 3px 10px rgba(45, 104, 255, 0.2)',
              },
              '&:active': {
                bgcolor: 'rgba(45, 104, 255, 0.22)',
              },
              '& .MuiButton-startIcon': { mr: 1 },
            }}
          >
            Kolonları Yönet
          </Button>
        </Tooltip>
      </Stack>
    ),
  });

  return <MaterialReactTable table={table} />;
};

export default ProductListMRT;

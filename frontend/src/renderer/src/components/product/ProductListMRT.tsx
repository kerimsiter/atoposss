import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  Tooltip,
  IconButton,
  Avatar,
  Portal,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Inventory as InventoryIcon,
} from '@mui/icons-material';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_SortingState,
  type MRT_ColumnOrderState,
  type MRT_VisibilityState,
  type MRT_ColumnSizingState,
  type MRT_RowVirtualizer,
} from 'material-react-table';
import { MRT_Localization_TR } from 'material-react-table/locales/tr';
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
    const allowed = new Set(['name', 'code', 'barcode', 'basePrice', 'createdAt', 'updatedAt']);
    const sortId = sort?.id as string | undefined;
    const sortBy = sortId && allowed.has(sortId) ? (sortId as any) : undefined;
    const order = sortBy ? (sort?.desc ? 'desc' : 'asc') : undefined;
    fetchProducts({
      page: pagination.page,
      pageSize: pagination.pageSize,
      search: searchTerm || undefined,
      sortBy,
      order,
    });
  }, [fetchProducts, sorting, searchTerm, pagination.page, pagination.pageSize]);

  // Virtualizer ref (docs: Virtualized Example)
  const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);

  // Sıralama değiştiğinde en üste scroll (docs önerisi)
  useEffect(() => {
    try {
      rowVirtualizerInstanceRef.current?.scrollToIndex?.(0);
    } catch {
      // ignore
    }
  }, [sorting]);

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
        accessorKey: 'name',
        header: 'Ürün Bilgileri',
        enableColumnPinning: true,
        size: columnSizing['name'] ?? 280,
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
        enableSorting: false,
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
        enableSorting: false,
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
        enableSorting: false,
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
      showGlobalFilter: true,
      globalFilter: searchTerm,
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
    enableGlobalFilter: true,
    enableColumnFilters: true,
    enableDensityToggle: true,
    enableFullScreenToggle: true,
    enableHiding: false,

    // Virtualization (docs example)
    enableRowVirtualization: true,
    enableColumnVirtualization: true,
    rowVirtualizerInstanceRef,
    rowVirtualizerOptions: { overscan: 5 },
    columnVirtualizerOptions: { overscan: 2 },

    // Global filter'ı backend ile senkronize et
    onGlobalFilterChange: setSearchTerm,
    muiSearchTextFieldProps: {
      placeholder: 'Ara... (ad, kod, barkod)',
      variant: 'outlined',
      size: 'small',
    },

    manualPagination: true,
    manualSorting: true,

    rowCount: pagination.total,

    // Stil ve container (full-screen'de sade: tamamen dolsun ve kaydırılsın)
    muiTableContainerProps: ({ table }) => {
      const isFs = table.getState().isFullScreen;
      return {
        sx: {
          borderRadius: isFs ? 0 : 3,
          border: isFs ? 'none' : '1.5px solid rgba(246, 246, 246, 1)',
          background: isFs ? 'background.paper' : 'rgba(253, 253, 253, 0.8)',
          backdropFilter: isFs ? 'none' : 'blur(32px)',
          boxShadow: isFs ? 'none' : '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
          overflowX: 'auto',
          overflowY: 'auto',
          maxWidth: '100%',
          // Full-screen'de MRT Paper zaten tüm viewport'u kaplıyor; Container dolu yükseklikte olmalı
          maxHeight: isFs ? '100%' : '60vh',
          height: isFs ? '100%' : undefined,
        },
      };
    },
    // Full screen: global theme'deki Paper blur'unu kesin olarak iptal et ve gerçekten viewport'a sabitle
    muiTablePaperProps: ({ table }) => {
      const isFs = table.getState().isFullScreen;
      return {
        style: { zIndex: isFs ? 9999 : undefined },
        sx: {
          backdropFilter: isFs ? 'none !important' : undefined,
          background: isFs ? 'background.paper !important' : undefined,
          borderRadius: isFs ? '0 !important' : undefined,
          border: isFs ? 'none !important' : undefined,
          // Tam ekranın gerçekten ekranı kaplaması için konumlandırma
          position: isFs ? 'fixed' : undefined,
          top: isFs ? 0 : undefined,
          right: isFs ? 0 : undefined,
          bottom: isFs ? 0 : undefined,
          left: isFs ? 0 : undefined,
          width: isFs ? '100vw' : undefined,
          height: isFs ? '100vh' : undefined,
          maxWidth: isFs ? '100vw' : undefined,
          maxHeight: isFs ? '100vh' : undefined,
          margin: isFs ? 0 : undefined,
          padding: isFs ? 0 : undefined,
          boxShadow: isFs ? 'none' : undefined,
        },
      };
    },
    muiTableHeadCellProps: {
      sx: {
        background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
        fontWeight: 600,
        fontSize: '0.875rem',
        color: '#1B1B1B',
        borderRadius: 0,
        '&:first-of-type': {
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
        },
        '&:last-child': {
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
        },
      },
    },
    muiTableBodyCellProps: {
      sx: {
        fontSize: '0.875rem',
        color: '#1B1B1B',
      },
    },

    // Varsayılan toolbar ikonları (arama, filtre, yoğunluk, tam ekran) etkin
  });

  const isFs = table.getState().isFullScreen;
  return isFs ? (
    <Portal container={document.body}>
      <MaterialReactTable table={table} />
    </Portal>
  ) : (
    <MaterialReactTable table={table} />
  );
};

export default ProductListMRT;

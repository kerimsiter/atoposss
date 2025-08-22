import React, { useMemo, useEffect } from 'react';
import { Box, Tooltip, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MRT_Localization_TR } from 'material-react-table/locales/tr';
import { useCategoryStore, Category } from '../../stores/useCategoryStore';
import ModernChip from '../ui/ModernChip';

interface CategoryListMRTProps {
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string, name: string) => void;
}

const CategoryListMRT: React.FC<CategoryListMRTProps> = ({ onEditCategory, onDeleteCategory }) => {
  const { categories, pagination, loading, fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchCategories({ page: 1, pageSize: 20 });
  }, [fetchCategories]);
  
  const columns = useMemo<MRT_ColumnDef<Category>[]>(
    () => [
      { accessorKey: 'name', header: 'Kategori Adı', size: 250 },
      { accessorKey: 'parent.name', header: 'Ana Kategori', Cell: ({ cell }) => (cell.getValue() as string) || '—' },
      { accessorKey: 'displayOrder', header: 'Sıralama', size: 100 },
      { 
        accessorKey: 'active', 
        header: 'Durum', 
        Cell: ({ cell }) => <ModernChip label={cell.getValue<boolean>() ? 'Aktif' : 'Pasif'} color={cell.getValue<boolean>() ? 'success' : 'default'} />
      },
      { 
        accessorKey: 'showInMenu', 
        header: 'Menüde Göster', 
        Cell: ({ cell }) => <ModernChip label={cell.getValue<boolean>() ? 'Evet' : 'Hayır'} color={cell.getValue<boolean>() ? 'primary' : 'default'} />
      },
      {
        id: 'actions',
        header: 'İşlemler',
        size: 120,
        Cell: ({ row }) => (
          <Box>
            <Tooltip title="Düzenle"><IconButton onClick={() => onEditCategory(row.original)}><EditIcon /></IconButton></Tooltip>
            <Tooltip title="Sil"><IconButton color="error" onClick={() => onDeleteCategory(row.original.id, row.original.name)}><DeleteIcon /></IconButton></Tooltip>
          </Box>
        ),
      },
    ],
    [onEditCategory, onDeleteCategory]
  );

  const table = useMaterialReactTable({
    columns,
    data: categories,
    state: { isLoading: loading, pagination: { pageIndex: pagination.page - 1, pageSize: pagination.pageSize } },
    rowCount: pagination.total,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const nextState = typeof updater === 'function' ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.pageSize }) : updater;
      fetchCategories({ page: nextState.pageIndex + 1, pageSize: nextState.pageSize });
    },
    localization: MRT_Localization_TR,
    muiTableContainerProps: { sx: { maxHeight: '60vh' } },
    enableStickyHeader: true,
  });

  return <MaterialReactTable table={table} />;
};

export default CategoryListMRT;

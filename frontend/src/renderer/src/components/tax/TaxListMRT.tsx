import React, { useMemo, useEffect } from 'react';
import { Box, Tooltip, IconButton, Typography } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckIcon } from '@mui/icons-material';
import { MaterialReactTable, useMaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { MRT_Localization_TR } from 'material-react-table/locales/tr';
import { useTaxStore, Tax } from '../../stores/useTaxStore';
import ModernChip from '../ui/ModernChip';

interface TaxListMRTProps {
  onEditTax: (tax: Tax) => void;
  onDeleteTax: (id: string, name: string) => void;
}

const TaxListMRT: React.FC<TaxListMRTProps> = ({ onEditTax, onDeleteTax }) => {
  const { taxes, pagination, loading, fetchTaxes } = useTaxStore();

  useEffect(() => {
    fetchTaxes({ page: 1, pageSize: 20 });
  }, [fetchTaxes]);
  
  const columns = useMemo<MRT_ColumnDef<Tax>[]>(
    () => [
      { accessorKey: 'name', header: 'Vergi Adı', size: 250 },
      { accessorKey: 'code', header: 'Kodu', size: 120 },
      { accessorKey: 'rate', header: 'Oran', size: 100, Cell: ({ cell }) => <Typography>{`%${cell.getValue<number>()}`}</Typography> },
      { accessorKey: 'isDefault', header: 'Varsayılan', size: 120, Cell: ({ cell }) => cell.getValue<boolean>() ? <CheckIcon color="success" /> : null },
      { 
        accessorKey: 'active', 
        header: 'Durum', 
        Cell: ({ cell }) => <ModernChip label={cell.getValue<boolean>() ? 'Aktif' : 'Pasif'} color={cell.getValue<boolean>() ? 'success' : 'default'} />
      },
      {
        id: 'actions',
        header: 'İşlemler',
        size: 120,
        Cell: ({ row }) => (
          <Box>
            <Tooltip title="Düzenle"><IconButton onClick={() => onEditTax(row.original)}><EditIcon /></IconButton></Tooltip>
            <Tooltip title="Sil"><IconButton color="error" onClick={() => onDeleteTax(row.original.id, row.original.name)}><DeleteIcon /></IconButton></Tooltip>
          </Box>
        ),
      },
    ],
    [onEditTax, onDeleteTax]
  );

  const table = useMaterialReactTable({
    columns,
    data: taxes,
    state: { isLoading: loading, pagination: { pageIndex: pagination.page - 1, pageSize: pagination.pageSize } },
    rowCount: pagination.total,
    manualPagination: true,
    onPaginationChange: (updater) => {
        const nextState = typeof updater === 'function' ? updater({ pageIndex: pagination.page - 1, pageSize: pagination.pageSize }) : updater;
        fetchTaxes({ page: nextState.pageIndex + 1, pageSize: nextState.pageSize });
    },
    localization: MRT_Localization_TR,
    muiTableContainerProps: { sx: { maxHeight: '60vh' } },
    enableStickyHeader: true,
  });

  return <MaterialReactTable table={table} />;
};

export default TaxListMRT;

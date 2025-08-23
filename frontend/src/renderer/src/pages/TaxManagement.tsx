import React, { useState, lazy, Suspense } from 'react';
import { Box, Typography, Container, Backdrop, CircularProgress, Stack } from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import PercentIcon from '@mui/icons-material/Percent';
import { useTaxStore, Tax } from '../stores/useTaxStore';
import ModernCard from '../components/ui/ModernCard';
import ModernButton from '../components/ui/ModernButton';

const TaxListMRT = lazy(() => import('../components/tax/TaxListMRT'));
const TaxForm = lazy(() => import('../components/tax/TaxForm'));

const TaxManagement: React.FC = () => {
  const { fetchTaxes, deleteTax, loading, pagination } = useTaxStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedTax, setSelectedTax] = useState<Tax | null>(null);

  const handleAdd = () => {
    setSelectedTax(null);
    setIsFormOpen(true);
  };
  
  const handleEdit = (tax: Tax) => {
    setSelectedTax(tax);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`"${name}" vergisini silmek istediğinizden emin misiniz?`)) {
      await deleteTax(id);
      handleRefresh();
    }
  };
  
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedTax(null);
    handleRefresh();
  };
  
  const handleRefresh = () => {
    fetchTaxes({ page: pagination.page, pageSize: pagination.pageSize });
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <ModernCard sx={{ p: 4, mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" alignItems="center" spacing={2}>
            <PercentIcon fontSize="large" color="primary" />
            <Box>
              <Typography variant="h4" component="h1" fontWeight={700}>Vergi Yönetimi</Typography>
              <Typography color="text.secondary">Vergi oranlarını ekleyin, düzenleyin ve yönetin.</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={2}>
            <ModernButton
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="large"
              sx={{
                background: '#F1F1F1',
                border: '1px solid #E0E0E0',
                color: '#1B1B1B',
                borderRadius: 12,
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                '&:hover': {
                  background: '#EBEBEB',
                  border: '1px solid #D0D0D0',
                },
                '&:disabled': {
                  opacity: 0.6,
                }
              }}
            >
              Yenile
            </ModernButton>
            <ModernButton
              startIcon={<AddIcon />}
              onClick={handleAdd}
              size="large"
              sx={{
                px: 3,
                background: 'linear-gradient(180deg, #779DFF 0%, #2D68FF 100%)',
                border: '1.5px solid rgba(226, 226, 226, 0)',
                color: '#FDFDFD',
                borderRadius: 20,
                fontWeight: 500,
                textTransform: 'none',
                py: 1.5,
                boxShadow: '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  background: 'linear-gradient(180deg, #6B8FFF 0%, #1E5AFF 100%)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0px 8px 2px -4px rgba(8, 8, 8, 0.08), 0px 10px 6px -4px rgba(8, 8, 8, 0.08), 0px 10px 16px 0px rgba(8, 8, 8, 0.05), 0px 32px 32px -16px rgba(8, 8, 8, 0.06), 0px 3px 1px -2px rgba(0, 0, 0, 0.3), 0px 48px 80px -12px rgba(0, 0, 0, 0.12)',
                },
                '&:disabled': {
                  opacity: 0.6,
                  transform: 'none',
                  boxShadow: '0px 5px 1.5px -4px rgba(8, 8, 8, 0.05), 0px 6px 4px -4px rgba(8, 8, 8, 0.05), 0px 6px 13px 0px rgba(8, 8, 8, 0.03), 0px 24px 24px -16px rgba(8, 8, 8, 0.04), 0px 2.15px 0.5px -2px rgba(0, 0, 0, 0.25), 0px 32px 64px -12px rgba(0, 0, 0, 0.08)',
                }
              }}
            >
              Yeni Vergi Ekle
            </ModernButton>
          </Stack>
        </Stack>
      </ModernCard>
      
      <Suspense fallback={<CircularProgress />}>
        <TaxListMRT onEditTax={handleEdit} onDeleteTax={handleDelete} />
        {isFormOpen && <TaxForm open={isFormOpen} onClose={handleCloseForm} tax={selectedTax} />}
      </Suspense>

      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 2 }} open={loading}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </Container>
  );
};

export default TaxManagement;

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
            <ModernButton startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={loading}>Yenile</ModernButton>
            <ModernButton startIcon={<AddIcon />} onClick={handleAdd} gradient>Yeni Vergi Ekle</ModernButton>
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

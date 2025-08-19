import React, { useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Container,
  Fade,
  Backdrop,
  CircularProgress,
  Stack,
  Divider
} from '@mui/material';
import { 
  Add as AddIcon, 
  Refresh as RefreshIcon,
  Inventory2Outlined as InventoryIcon,
  CategoryOutlined as CategoryIcon
} from '@mui/icons-material';
import { Product, useProductStore } from '../stores/useProductStore';
import ProductList from '../components/product/ProductList';
import ModernCard from '../components/ui/ModernCard';
import ModernButton from '../components/ui/ModernButton';

const ProductForm = lazy(() => import('../components/product/ProductForm'));

const ProductManagement: React.FC = () => {
  const { fetchProducts, loading, error, clearError, pagination } = useProductStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [stats, setStats] = useState<{ total: number; active: number; stockTracked: number }>({ total: 0, active: 0, stockTracked: 0 });

  // Fetch products when component mounts (server-side pagination)
  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 20, sortBy: 'createdAt', order: 'desc' });
  }, [fetchProducts]);

  // Show error in snackbar
  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

  // Fetch product stats for dashboard cards
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3000/products/stats');
        setStats(res.data);
      } catch (e) {
        console.error('Failed to fetch product stats', e);
      }
    };
    fetchStats();
  }, []);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedProduct(null);
  };

  const handleRefresh = () => {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    fetchProducts({ page, pageSize, sortBy: 'createdAt', order: 'desc' });
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  // Dashboard stats from backend
  const totalProducts = stats.total;
  const activeProducts = stats.active;
  const stockTrackedProducts = stats.stockTracked;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <Box sx={{
        position: 'absolute',
        top: -100,
        right: -100,
        width: 300,
        height: 300,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
        filter: 'blur(60px)',
        zIndex: 0,
      }} />
      
      <Box sx={{
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(0, 166, 86, 0.08) 0%, rgba(76, 175, 80, 0.04) 100%)',
        filter: 'blur(80px)',
        zIndex: 0,
      }} />

      <Container maxWidth="xl" sx={{ py: 4, position: 'relative', zIndex: 1 }}>
        <Fade in timeout={600}>
          <Box>
            {/* Header Section */}
            <ModernCard sx={{ p: 4, mb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: 3
              }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, #779DFF 0%, #2D68FF 100%)',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <InventoryIcon />
                    </Box>
                    <Box>
                      <Typography variant="h4" component="h1" sx={{ 
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #1B1B1B 0%, #727272 100%)',
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5
                      }}>
                        Ürün Yönetimi
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1rem' }}>
                        Ürünlerinizi ekleyin, düzenleyin ve yönetin
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                {/* Stats Cards and Buttons Row */}
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  flexWrap: 'wrap'
                }}>
                  {/* Stats Cards */}
                  <Stack direction="row" spacing={2}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                      border: '1px solid rgba(45, 104, 255, 0.2)',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#2D68FF', mb: 0.5 }}>
                        {totalProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Toplam Ürün
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(0, 166, 86, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                      border: '1px solid rgba(0, 166, 86, 0.2)',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#00A656', mb: 0.5 }}>
                        {activeProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Aktif Ürün
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 1.5,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      minWidth: 100,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: '#FF9800', mb: 0.5 }}>
                        {stockTrackedProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Stok Takipli
                      </Typography>
                    </Box>
                  </Stack>
                  
                  {/* Action Buttons */}
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
                    onClick={handleAddProduct}
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
                    Yeni Ürün Ekle
                  </ModernButton>
                </Stack>
                </Box>
              </Box>
            </ModernCard>

            {/* Product List Section */}
            <ModernCard sx={{ p: 0, overflow: 'hidden' }}>
              <Box sx={{ p: 3, pb: 0 }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                  <CategoryIcon color="primary" />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Ürün Listesi
                  </Typography>
                </Stack>
                <Divider sx={{ mx: -3, mb: 0 }} />
              </Box>
              
              <Box sx={{ p: 3 }}>
                <ProductList onEditProduct={handleEditProduct} />
              </Box>
            </ModernCard>

            {/* Product Form Dialog */}
            <Suspense 
              fallback={ 
                <Backdrop
                  sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                  open={true}
                >
                  <CircularProgress color="inherit" />
                </Backdrop>
              }
            >
              {isFormOpen && (
                <ProductForm
                  open={isFormOpen}
                  onClose={handleCloseForm}
                  product={selectedProduct}
                />
              )}
            </Suspense>

            {/* Loading Backdrop */}
            <Backdrop
              sx={{ 
                color: '#fff', 
                zIndex: (theme) => theme.zIndex.drawer + 1,
                backdropFilter: 'blur(8px)',
                background: 'rgba(0, 0, 0, 0.3)'
              }}
              open={loading}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress color="inherit" size={60} thickness={4} />
                <Typography variant="h6" sx={{ mt: 2, fontWeight: 500 }}>
                  Yükleniyor...
                </Typography>
              </Box>
            </Backdrop>

            {/* Error Snackbar */}
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={6000}
              onClose={handleCloseSnackbar}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
              <Alert 
                onClose={handleCloseSnackbar} 
                severity="error" 
                sx={{ 
                  width: '100%',
                  borderRadius: 2,
                  backdropFilter: 'blur(16px)',
                  background: 'rgba(255, 82, 82, 0.95)',
                  color: 'white',
                  '& .MuiAlert-icon': {
                    color: 'white'
                  }
                }}
              >
                {error}
              </Alert>
            </Snackbar>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProductManagement;
import React, { useEffect, useState } from 'react';
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
  TrendingUpOutlined as TrendingIcon,
  CategoryOutlined as CategoryIcon
} from '@mui/icons-material';
import { Product, useProductStore } from '../stores/useProductStore';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import ModernCard from '../components/ui/ModernCard';
import ModernButton from '../components/ui/ModernButton';

const ProductManagement: React.FC = () => {
  const { products, fetchProducts, loading, error, clearError } = useProductStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Show error in snackbar
  useEffect(() => {
    if (error) {
      setSnackbarOpen(true);
    }
  }, [error]);

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
    fetchProducts();
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    clearError();
  };

  // Calculate stats
  const activeProducts = products.filter(p => p.active).length;
  const stockTrackedProducts = products.filter(p => p.trackStock).length;
  const totalProducts = products.length;

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F8F9FA 0%, #E9ECEF 100%)',
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

                  {/* Stats Cards */}
                  <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                      border: '1px solid rgba(45, 104, 255, 0.2)',
                      minWidth: 120,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#2D68FF', mb: 0.5 }}>
                        {totalProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Toplam Ürün
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(0, 166, 86, 0.1) 0%, rgba(76, 175, 80, 0.05) 100%)',
                      border: '1px solid rgba(0, 166, 86, 0.2)',
                      minWidth: 120,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#00A656', mb: 0.5 }}>
                        {activeProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Aktif Ürün
                      </Typography>
                    </Box>

                    <Box sx={{
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1) 0%, rgba(255, 183, 77, 0.05) 100%)',
                      border: '1px solid rgba(255, 152, 0, 0.2)',
                      minWidth: 120,
                      textAlign: 'center'
                    }}>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#FF9800', mb: 0.5 }}>
                        {stockTrackedProducts}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Stok Takipli
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
                
                <Stack direction="row" spacing={2}>
                  <ModernButton
                    glassmorphism
                    startIcon={<RefreshIcon />}
                    onClick={handleRefresh}
                    disabled={loading}
                    size="large"
                  >
                    Yenile
                  </ModernButton>
                  <ModernButton
                    gradient
                    startIcon={<AddIcon />}
                    onClick={handleAddProduct}
                    size="large"
                    sx={{ px: 3 }}
                  >
                    Yeni Ürün Ekle
                  </ModernButton>
                </Stack>
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
            <ProductForm
              open={isFormOpen}
              onClose={handleCloseForm}
              product={selectedProduct}
            />

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
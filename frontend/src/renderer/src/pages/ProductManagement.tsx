import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Paper,
  Container
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { Product, useProductStore } from '../stores/useProductStore';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';

const ProductManagement: React.FC = () => {
  const { fetchProducts, loading, error, clearError } = useProductStore();
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

  return (
    <Container maxWidth={false} sx={{ py: 2, px: 2, height: '100vh' }}>
      <Paper elevation={1} sx={{ p: 3, height: 'calc(100vh - 32px)', overflow: 'auto' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3 
        }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Ürün Yönetimi
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Ürünlerinizi ekleyin, düzenleyin ve yönetin
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
            >
              Yenile
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAddProduct}
            >
              Yeni Ürün
            </Button>
          </Box>
        </Box>

        {/* Product List */}
        <ProductList onEditProduct={handleEditProduct} />

        {/* Product Form Dialog */}
        <ProductForm
          open={isFormOpen}
          onClose={handleCloseForm}
          product={selectedProduct}
        />

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
            sx={{ width: '100%' }}
          >
            {error}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default ProductManagement;
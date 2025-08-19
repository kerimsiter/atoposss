import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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
  Fade,
  Skeleton,
  InputAdornment
} from '@mui/material';
import { 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  Inventory as InventoryIcon,
  LocalOffer as PriceIcon
} from '@mui/icons-material';
import { Product, useProductStore } from '../../stores/useProductStore';
import { formatPrice } from '../../utils/formatters';
import ModernTextField from '../ui/ModernTextField';
import ModernChip from '../ui/ModernChip';

interface ProductListProps {
  onEditProduct: (product: Product) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEditProduct }) => {
  const { products, deleteProduct, loading } = useProductStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  // Filter products based on search term and filter criteria
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterBy === 'all' ||
      (filterBy === 'active' && product.active) ||
      (filterBy === 'inactive' && !product.active) ||
      (filterBy === 'trackStock' && product.trackStock);

    return matchesSearch && matchesFilter;
  });

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

  const LoadingSkeleton = () => (
    <>
      {[...Array(5)].map((_, index) => (
        <TableRow key={index}>
          <TableCell><Skeleton variant="text" width={80} /></TableCell>
          <TableCell><Skeleton variant="text" width={200} /></TableCell>
          <TableCell><Skeleton variant="text" width={100} /></TableCell>
          <TableCell align="right"><Skeleton variant="text" width={60} /></TableCell>
          <TableCell><Skeleton variant="text" width={50} /></TableCell>
          <TableCell><Skeleton variant="rounded" width={60} height={28} /></TableCell>
          <TableCell><Skeleton variant="rounded" width={60} height={28} /></TableCell>
          <TableCell align="center">
            <Stack direction="row" spacing={1} justifyContent="center">
              <Skeleton variant="circular" width={32} height={32} />
              <Skeleton variant="circular" width={32} height={32} />
            </Stack>
          </TableCell>
        </TableRow>
      ))}
    </>
  );

  return (
    <Box>
      {/* Search and Filter Controls */}
      <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
        <ModernTextField
          placeholder="Ürün adı, kodu veya barkod ile ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ 
            minWidth: 320,
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
            {filteredProducts.length} ürün gösteriliyor
          </Typography>
        </Box>
      </Stack>

      {/* Products Table */}
      <TableContainer sx={{
        borderRadius: 3,
        border: '1.5px solid rgba(246, 246, 246, 1)',
        background: 'rgba(253, 253, 253, 0.8)',
        backdropFilter: 'blur(32px)',
        boxShadow: '0px 1px 8px -4px rgba(0, 0, 0, 0.2)',
        overflow: 'hidden'
      }}>
        <Table>
          <TableHead sx={{
            background: 'linear-gradient(180deg, rgba(253, 253, 253, 0.3) 0%, rgba(253, 253, 253, 1) 100%)',
          }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Ürün Kodu
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Ürün Bilgileri
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Barkod
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Fiyat
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Birim
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Durum
              </TableCell>
              <TableCell sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                Stok Takibi
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.875rem', color: '#1B1B1B', py: 2 }}>
                İşlemler
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <LoadingSkeleton />
            ) : filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Stack alignItems="center" spacing={2}>
                    <Avatar sx={{ 
                      width: 64, 
                      height: 64, 
                      background: 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                      color: '#2D68FF'
                    }}>
                      <InventoryIcon fontSize="large" />
                    </Avatar>
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
                      {searchTerm || filterBy !== 'all' ? 'Arama kriterlerine uygun ürün bulunamadı' : 'Henüz ürün eklenmemiş'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {searchTerm || filterBy !== 'all' ? 'Farklı arama terimleri deneyin' : 'İlk ürününüzü eklemek için "Yeni Ürün Ekle" butonunu kullanın'}
                    </Typography>
                  </Stack>
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product, index) => (
                <Fade in timeout={300 + index * 50} key={product.id}>
                  <TableRow 
                    hover 
                    sx={{ 
                      '&:hover': { 
                        background: 'rgba(247, 249, 255, 0.5)',
                        transform: 'scale(1.001)',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                      },
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  >
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600, 
                        fontFamily: 'monospace',
                        color: '#2D68FF',
                        fontSize: '0.875rem'
                      }}>
                        {product.code}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          src={product.image || undefined}
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: product.image 
                              ? 'transparent' 
                              : 'linear-gradient(135deg, rgba(45, 104, 255, 0.1) 0%, rgba(119, 157, 255, 0.05) 100%)',
                            border: '1.5px solid rgba(246, 246, 246, 1)',
                          }}
                        >
                          {!product.image && <InventoryIcon color="primary" />}
                        </Avatar>
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
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ 
                        fontFamily: 'monospace',
                        color: product.barcode ? '#1B1B1B' : '#727272',
                        fontSize: '0.875rem'
                      }}>
                        {product.barcode || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 2 }}>
                      <Stack alignItems="flex-end" spacing={0.5}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <PriceIcon fontSize="small" color="success" />
                          <Typography variant="body2" sx={{ 
                            fontWeight: 700, 
                            color: '#00A656',
                            fontSize: '0.875rem'
                          }}>
                            ₺{formatPrice(product.basePrice)}
                          </Typography>
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <ModernChip
                        label={getUnitLabel(product.unit)}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <ModernChip
                        label={product.active ? 'Aktif' : 'Pasif'}
                        color={product.active ? 'success' : 'default'}
                        gradient={product.active}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ py: 2 }}>
                      <ModernChip
                        label={product.trackStock ? 'Evet' : 'Hayır'}
                        color={product.trackStock ? 'primary' : 'default'}
                        gradient={product.trackStock}
                        size="small"
                        variant={product.trackStock ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell align="center" sx={{ py: 2 }}>
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <Tooltip title="Ürünü Düzenle" arrow>
                          <IconButton
                            size="small"
                            onClick={() => onEditProduct(product)}
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
                            onClick={() => handleDeleteProduct(product.id, product.name)}
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
                    </TableCell>
                  </TableRow>
                </Fade>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ProductList;
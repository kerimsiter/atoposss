import React from 'react';
import { Product, useProductStore } from '../../stores/useProductStore';
import ProductListMRT from './ProductListMRT';

interface ProductListProps {
  onEditProduct: (product: Product) => void;
}

function ProductList({ onEditProduct }: ProductListProps) {
  const { deleteProduct } = useProductStore();

  const handleDeleteProduct = async (id: string, productName: string) => {
    if (window.confirm(`"${productName}" ürününü silmek istediğinizden emin misiniz?`)) {
      try {
        await deleteProduct(id);
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  return (
    <ProductListMRT
      onEditProduct={onEditProduct}
      onDeleteProduct={handleDeleteProduct}
    />
  );
}

export default React.memo(ProductList);
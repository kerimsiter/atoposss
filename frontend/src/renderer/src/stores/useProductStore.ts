import { create } from 'zustand';
import axios from 'axios';

// Product interface based on Prisma schema
export interface Product {
  id: string;
  companyId: string;
  categoryId: string;
  code: string;
  barcode?: string;
  name: string;
  description?: string;
  shortDescription?: string;
  image?: string;
  images: string[];
  basePrice: number | string; // Can be Decimal from backend
  taxId: string;
  costPrice?: number | string;
  profitMargin?: number | string;
  trackStock: boolean;
  unit: string;
  criticalStock?: number;
  available: boolean;
  sellable: boolean;
  preparationTime?: number;
  calories?: number;
  allergens: string[];
  hasVariants: boolean;
  hasModifiers: boolean;
  showInMenu: boolean;
  featured: boolean;
  displayOrder: number;
  active: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface CreateProductData {
  name: string;
  code: string;
  barcode?: string;
  description?: string;
  basePrice: number;
  categoryId: string;
  taxId: string;
  trackStock: boolean;
  unit: string;
  companyId?: string; // Optional, will be set automatically
}

interface ProductStore {
  products: Product[];
  selectedProduct: Product | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  addProduct: (productData: CreateProductData) => Promise<void>;
  updateProduct: (id: string, productData: Partial<CreateProductData>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  setSelectedProduct: (product: Product | null) => void;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000'; // Backend API URL

export const useProductStore = create<ProductStore>((set) => ({
  products: [],
  selectedProduct: null,
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/products`);
      set({ products: response.data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        loading: false 
      });
    }
  },

  addProduct: async (productData: CreateProductData) => {
    set({ loading: true, error: null });
    try {
      // Backend will automatically assign company if not provided
      const response = await axios.post(`${API_BASE_URL}/products`, productData);
      const newProduct = response.data;
      set(state => ({ 
        products: [...state.products, newProduct],
        loading: false 
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add product',
        loading: false 
      });
      throw error;
    }
  },

  updateProduct: async (id: string, productData: Partial<CreateProductData>) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.patch(`${API_BASE_URL}/products/${id}`, productData);
      const updatedProduct = response.data;
      set(state => ({
        products: state.products.map(p => p.id === id ? updatedProduct : p),
        selectedProduct: state.selectedProduct?.id === id ? updatedProduct : state.selectedProduct,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update product',
        loading: false 
      });
      throw error;
    }
  },

  deleteProduct: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await axios.delete(`${API_BASE_URL}/products/${id}`);
      set(state => ({
        products: state.products.filter(p => p.id !== id),
        selectedProduct: state.selectedProduct?.id === id ? null : state.selectedProduct,
        loading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to delete product',
        loading: false 
      });
      throw error;
    }
  },

  setSelectedProduct: (product: Product | null) => {
    set({ selectedProduct: product });
  },

  clearError: () => {
    set({ error: null });
  }
}));
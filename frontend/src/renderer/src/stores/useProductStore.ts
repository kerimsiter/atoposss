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
  // Optional relations returned by backend when included
  variants?: Array<{
    id: string;
    name: string;
    sku?: string | null;
    code?: string | null;
    price: number | string;
    active?: boolean;
    displayOrder?: number;
  }>;
  modifierGroups?: Array<{
    displayOrder?: number;
    modifierGroup: {
      id: string;
      name: string;
      minSelection?: number;
      maxSelection?: number;
      required?: boolean;
      active?: boolean;
      modifiers?: Array<{
        id: string;
        name: string;
        price: number | string;
        active?: boolean;
        displayOrder?: number;
      }>;
    }
  }>;
}

// UI/store-level types for advanced product structures
export interface ProductVariant {
  id?: string;
  name: string;
  sku?: string;
  price?: number;
}

export interface ModifierItem {
  id?: string;
  name: string;
  price?: number;
  affectsStock?: boolean;
}

export interface ModifierGroup {
  id?: string;
  name: string;
  minSelect?: number;
  maxSelect?: number;
  items: ModifierItem[];
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
  image?: string; // Product image URL
  // Optional advanced data, will be sent once backend supports it
  allergens?: string[];
  variants?: ProductVariant[];
  modifierGroups?: ModifierGroup[];
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
    } catch (error: any) {
      // Log detailed backend error payload if available (e.g., validation errors)
      const status = error?.response?.status;
      const data = error?.response?.data;
      if (status) {
        console.error('Add product failed:', status, data);
      } else {
        console.error('Add product failed:', error);
      }
      // Prepare a friendlier error message for UI
      let friendly = 'Ürün eklenemedi';
      const rawMsg = data?.message;
      if (Array.isArray(rawMsg)) {
        friendly = rawMsg.join('\n');
      } else if (typeof rawMsg === 'string') {
        // Prisma P2002 unique constraint often bubbles up as 500 with generic message; map to clearer Turkish message when possible
        if (rawMsg.toLowerCase().includes('unique') || rawMsg.toLowerCase().includes('constraint')) {
          friendly = 'Bu şirket için ürün kodu benzersiz olmalıdır. Lütfen farklı bir kod girin.';
        } else {
          friendly = rawMsg;
        }
      } else if (status === 409) {
        friendly = 'Bu şirket için ürün kodu zaten mevcut.';
      }

      set({ 
        error: friendly,
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
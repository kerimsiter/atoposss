import { create } from 'zustand';
import axios from 'axios';

export interface Category {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  showInMenu: boolean;
  displayOrder: number;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  createdAt: string;
}

export interface ListCategoriesQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  companyId?: string;
  sortBy?: 'name' | 'displayOrder' | 'createdAt' | 'updatedAt';
  order?: 'asc' | 'desc';
}

interface CategoryStore {
  categories: Category[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };

  fetchCategories: (params?: Partial<ListCategoriesQueryDto>) => Promise<void>;
  addCategory: (data: any) => Promise<void>;
  updateCategory: (id: string, data: any) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

export const useCategoryStore = create<CategoryStore>((set) => ({
  categories: [],
  loading: false,
  error: null,
  pagination: { page: 1, pageSize: 20, total: 0 },

  fetchCategories: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, { params });
      set({
        categories: response.data.data,
        pagination: {
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
        },
        loading: false,
      });
    } catch (error) {
      set({ error: 'Kategoriler yüklenemedi.', loading: false });
    }
  },

  addCategory: async (data) => {
    set({ loading: true });
    try {
      await axios.post(`${API_BASE_URL}/categories`, data);
      set({ loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Kategori eklenemedi.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, loading: false });
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    set({ loading: true });
    try {
      await axios.patch(`${API_BASE_URL}/categories/${id}`, data);
      set({ loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Kategori güncellenemedi.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, loading: false });
      throw error;
    }
  },

  deleteCategory: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${API_BASE_URL}/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter((c) => c.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Kategori silinemedi.', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

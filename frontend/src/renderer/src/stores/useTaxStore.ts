import { create } from 'zustand';
import axios from 'axios';

export interface Tax {
  id: string;
  name: string;
  rate: number;
  code: string;
  type: 'VAT' | 'OTV' | 'OIV' | 'DAMGA';
  isDefault: boolean;
  isIncluded: boolean;
  active: boolean;
}

export interface ListTaxesQueryDto {
  page?: number;
  pageSize?: number;
  search?: string;
  active?: boolean;
  sortBy?: 'name' | 'rate' | 'code' | 'createdAt';
  order?: 'asc' | 'desc';
}

interface TaxStore {
  taxes: Tax[];
  loading: boolean;
  error: string | null;
  pagination: { page: number; pageSize: number; total: number };
  
  fetchTaxes: (params?: Partial<ListTaxesQueryDto>) => Promise<void>;
  addTax: (data: any) => Promise<void>;
  updateTax: (id: string, data: any) => Promise<void>;
  deleteTax: (id: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

export const useTaxStore = create<TaxStore>((set) => ({
  taxes: [],
  loading: false,
  error: null,
  pagination: { page: 1, pageSize: 20, total: 0 },

  fetchTaxes: async (params) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/taxes`, { params });
      set({
        taxes: response.data.data,
        pagination: {
          page: response.data.page,
          pageSize: response.data.pageSize,
          total: response.data.total,
        },
        loading: false,
      });
    } catch (error) {
      set({ error: 'Vergiler yüklenemedi.', loading: false });
    }
  },

  addTax: async (data) => {
    set({ loading: true });
    try {
      await axios.post(`${API_BASE_URL}/taxes`, data);
      set({ loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Vergi eklenemedi.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, loading: false });
      throw error;
    }
  },

  updateTax: async (id, data) => {
    set({ loading: true });
    try {
      await axios.patch(`${API_BASE_URL}/taxes/${id}`, data);
      set({ loading: false });
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Vergi güncellenemedi.';
      set({ error: Array.isArray(msg) ? msg.join(', ') : msg, loading: false });
      throw error;
    }
  },

  deleteTax: async (id) => {
    set({ loading: true });
    try {
      await axios.delete(`${API_BASE_URL}/taxes/${id}`);
      set((state) => ({
        taxes: state.taxes.filter((t) => t.id !== id),
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Vergi silinemedi.', loading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

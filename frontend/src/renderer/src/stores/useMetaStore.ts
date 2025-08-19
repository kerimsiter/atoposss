import { create } from 'zustand';
import axios from 'axios';

export interface Company {
  id: string;
  name: string;
  taxNumber: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  displayOrder: number;
}

export interface Tax {
  id: string;
  name: string;
  rate: number;
  code: string;
  isDefault: boolean;
}

export interface ModifierMetaItem {
  id: string;
  name: string;
  price: number | string;
}

export interface ModifierGroupMeta {
  id: string;
  name: string;
  minSelection?: number;
  maxSelection?: number;
  modifiers?: ModifierMetaItem[];
}

interface MetaStore {
  companies: Company[];
  categories: Category[];
  taxes: Tax[];
  modifierGroups: ModifierGroupMeta[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchCompanies: () => Promise<void>;
  fetchCategories: (companyId?: string) => Promise<void>;
  fetchTaxes: (companyId?: string) => Promise<void>;
  fetchModifierGroups: () => Promise<void>;
  fetchAllMeta: (companyId?: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE_URL = 'http://localhost:3000';

export const useMetaStore = create<MetaStore>((set, get) => ({
  companies: [],
  categories: [],
  taxes: [],
  modifierGroups: [],
  loading: false,
  error: null,

  fetchCompanies: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE_URL}/products/meta/companies`);
      set({ companies: response.data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch companies',
        loading: false 
      });
    }
  },

  fetchCategories: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = companyId 
        ? `${API_BASE_URL}/products/meta/categories?companyId=${companyId}`
        : `${API_BASE_URL}/products/meta/categories`;
      const response = await axios.get(url);
      set({ categories: response.data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch categories',
        loading: false 
      });
    }
  },

  fetchTaxes: async (companyId?: string) => {
    set({ loading: true, error: null });
    try {
      const url = companyId 
        ? `${API_BASE_URL}/products/meta/taxes?companyId=${companyId}`
        : `${API_BASE_URL}/products/meta/taxes`;
      const response = await axios.get(url);
      set({ taxes: response.data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch taxes',
        loading: false 
      });
    }
  },

  fetchModifierGroups: async () => {
    set({ loading: true, error: null });
    try {
      const url = `${API_BASE_URL}/products/meta/modifier-groups`;
      const response = await axios.get(url);
      set({ modifierGroups: response.data, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch modifier groups',
        loading: false 
      });
    }
  },

  fetchAllMeta: async (companyId?: string) => {
    const { fetchCompanies, fetchCategories, fetchTaxes, fetchModifierGroups } = get();
    
    set({ loading: true, error: null });
    try {
      await Promise.all([
        fetchCompanies(),
        fetchCategories(companyId),
        fetchTaxes(companyId),
        fetchModifierGroups(),
      ]);
      set({ loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch meta data',
        loading: false 
      });
    }
  },

  clearError: () => {
    set({ error: null });
  }
}));
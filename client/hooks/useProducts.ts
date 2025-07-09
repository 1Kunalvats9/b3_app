import { create } from 'zustand';
import axios from 'axios';

interface Product {
  _id: string;
  id: string; 
  name: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  category: string;
  image_url: string;
  stock: number;
  isOpen: boolean;
  unit: 'piece' | 'kg' | 'gram' | 'liter' | 'ml';
  isActive: boolean;
  createdAt: string; 
  updatedAt: string; 
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface ProductQueryParams {
  category?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface ProductState {
  products: Product[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  queryParams: ProductQueryParams;
  fetchProducts: (params?: Partial<ProductQueryParams>) => Promise<void>;
  refreshProducts: () => Promise<void>;
  setQueryParams: (params: Partial<ProductQueryParams>) => void;
}

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3000'; // Fallback for development

export const useProducts = create<ProductState>((set, get) => ({
  products: [],
  pagination: null,
  loading: false,
  error: null,
  queryParams: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },

  /**
   * Fetches product data from the backend API.
   * @param params Optional partial query parameters to override current ones for this fetch.
   */
  fetchProducts: async (params?: Partial<ProductQueryParams>) => {
    set({ loading: true, error: null }); 
    const currentQueryParams = get().queryParams;
    const mergedParams = { ...currentQueryParams, ...params };

    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/products`, {
        params: mergedParams,
      });

      if (response.data.success) {
        set({
          products: response.data.data,
          pagination: response.data.pagination,
          queryParams: mergedParams,
          loading: false,
        });
      } else {
        set({
          error: response.data.message || 'Failed to fetch products',
          loading: false,
        });
      }
    } catch (err: any) {
      console.error('Error fetching products:', err);
      set({
        error: err.response?.data?.message || err.message || 'An unknown error occurred',
        loading: false,
      });
    }
  },

  /**
   * Refreshes the product list using the current query parameters.
   */
  refreshProducts: async () => {
    await get().fetchProducts(get().queryParams);
  },

  /**
   * Updates the query parameters and triggers a new product fetch.
   * @param newParams Partial query parameters to update.
   */
  setQueryParams: (newParams: Partial<ProductQueryParams>) => {
    set((state) => ({
      queryParams: {
        ...state.queryParams,
        ...newParams,
        page: (newParams.category !== undefined || newParams.search !== undefined) ? 1 : (newParams.page || state.queryParams.page)
      },
    }));
    get().fetchProducts(get().queryParams);
  },
}));

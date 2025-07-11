import { create } from 'zustand';
import axios from 'axios';

export interface Product {
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
  sortBy: 'name' | 'discountedPrice' | 'createdAt';
  sortOrder: 'asc' | 'desc';
}

interface ProductState {
  products: Product[];
  pagination: Pagination | null;
  loading: boolean;
  error: string | null;
  queryParams: ProductQueryParams;
  fetchProducts: (params?: Partial<ProductQueryParams>) => Promise<void>;
  fetchSearchSuggestions: (searchQuery: string) => Promise<void>; // NEW: Dedicated for suggestions
  searchSuggestions: Product[]; // NEW: To store search suggestions from backend
  refreshProducts: () => Promise<void>;
  saveProduct: (params: Product, token: string) => Promise<Product>;
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

export const useProducts = create<ProductState>((set, get) => ({
  products: [],
  searchSuggestions: [], // Initialize new state for suggestions
  pagination: null,
  loading: false,
  error: null,
  queryParams: {
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  },

  fetchProducts: async (params?: Partial<ProductQueryParams>) => {
    set({ loading: true, error: null });
    const currentQueryParams = get().queryParams;

    // Determine if it's a new search or category filter. If so, reset to page 1.
    const isNewSearchOrCategory = (params?.search !== undefined && params.search !== currentQueryParams.search) ||
                                  (params?.category !== undefined && params.category !== currentQueryParams.category);

    const mergedParams = {
      ...currentQueryParams,
      ...params,
      page: isNewSearchOrCategory ? 1 : (params?.page || currentQueryParams.page) // Always reset to page 1 for new searches/filters
    };

    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/products`, {
        params: mergedParams,
      });

      if (response.data.success) {
        const newProducts = response.data.data;
        const existingProducts = get().products;

        // If it's a new search, new category, or explicitly page 1, replace products.
        // Otherwise, append for pagination.
        const finalProducts = (mergedParams.page === 1 || isNewSearchOrCategory)
          ? newProducts
          : [...existingProducts, ...newProducts];

        set({
          products: finalProducts,
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

  // NEW FUNCTION: Fetches search suggestions directly from the backend
  fetchSearchSuggestions: async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      set({ searchSuggestions: [] });
      return;
    }
    try {
      // Request top 8 suggestions from backend, no pagination
      const response = await axios.get(`${BACKEND_BASE_URL}/api/products`, {
        params: {
          search: searchQuery,
          limit: 8, // Request a small limit for suggestions
          page: 1, // Always fetch from page 1 for suggestions
          sortBy: 'name', // Default sort for suggestions
          sortOrder: 'asc'
        },
      });

      if (response.data.success) {
        set({ searchSuggestions: response.data.data });
      } else {
        console.error('Failed to fetch search suggestions:', response.data.message);
        set({ searchSuggestions: [] });
      }
    } catch (err: any) {
      console.error('Error fetching search suggestions:', err);
      set({ searchSuggestions: [] });
    }
  },

  saveProduct: async (productData: Product, token: string): Promise<Product> => {
    set({ loading: true, error: null });
    try {
      const isUpdate = !!productData._id;

      let url: string;
      let method: 'POST' | 'PUT';

      if (isUpdate) {
        if (!productData.id) {
          throw new Error("Product 'id' is required for update operations.");
        }
        url = `${BACKEND_BASE_URL}/api/products/save/${productData.id}`;
        method = 'PUT';
      } else {
        url = `${BACKEND_BASE_URL}/api/products`;
        method = 'POST';
      }

      const response = await axios({
        method: method,
        url: url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        data: productData,
      });

      if (response.data.success) {
        // After save/update, refresh the main product list (optional, but good for consistency)
        // This will re-fetch the current page, ensuring new data is visible if it falls within the current filter/pagination.
        get().refreshProducts();
        set({ loading: false });
        return response.data.data;
      } else {
        const errorMessage = response.data.message || `Failed to ${isUpdate ? 'update' : 'add'} product`;
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('Axios Error Response Status:', err.response.status);
        console.error('Axios Error Response Headers:', err.response.headers);
        console.error('Axios Error Response Data (RAW):', err.response.data);
      } else if (err.request) {
        console.error('Axios Error Request:', err.request);
      } else {
        console.error('Axios Error Message:', err.message);
      }

      const errorMessage = err.response?.data?.message || err.message || `An unknown error occurred while saving product`;
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage);
    }
  },

  refreshProducts: async () => {
    // Re-fetch the current view based on current queryParams
    await get().fetchProducts(get().queryParams);
  },
}));
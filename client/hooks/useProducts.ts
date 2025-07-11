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
  refreshProducts: () => Promise<void>;
  setQueryParams: (params: Partial<ProductQueryParams>) => void;
  saveProduct:(params: Product, token: string) => Promise<Product>;
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

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
    
    const isNewQuery = params?.search !== undefined || params?.category !== undefined;
    if (isNewQuery && params?.page === 1) {
      set({ products: [] });
    }

    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/products`, {
        params: mergedParams,
      });

      if (response.data.success) {
        const newProducts = response.data.data;
        const existingProducts = get().products;
        
        const finalProducts = (mergedParams.page === 1 || isNewQuery) 
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
  saveProduct: async (productData: Product, token: string): Promise<Product> => {
    set({ loading: true, error: null });
    try {
      const isUpdate = !!productData._id;
      
      let url: string;
      let method: 'POST' | 'PUT';

      if (isUpdate) {
        // For update, use the backend's /save/:id endpoint and the product's custom 'id' (uuidv4)
        if (!productData.id) {
          throw new Error("Product 'id' is required for update operations.");
        }
        url = `${BACKEND_BASE_URL}/api/products/save/${productData.id}`;
        method = 'PUT';
      } else {
        // For create, use the backend's root /products endpoint
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
        data: productData, // Axios uses 'data' for request body
      });

      if (response.data.success) {
        set({ loading: false });
        return response.data.data; // Return the saved/updated product
      } else {
        const errorMessage = response.data.message || `Failed to ${isUpdate ? 'update' : 'add'} product`;
        set({ error: errorMessage, loading: false });
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error saving product:', err);
      // Log the response object from Axios for detailed debugging
      if (axios.isAxiosError(err) && err.response) {
          console.error('Axios Error Response Status:', err.response.status);
          console.error('Axios Error Response Headers:', err.response.headers);
          console.error('Axios Error Response Data (RAW):', err.response.data); // This is crucial
      } else if (err.request) {
          console.error('Axios Error Request:', err.request); // Request was made but no response
      } else {
          console.error('Axios Error Message:', err.message); // Other errors
      }

      const errorMessage = err.response?.data?.message || err.message || `An unknown error occurred while saving product`;
      set({ error: errorMessage, loading: false });
      throw new Error(errorMessage); // Re-throw for component to catch
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

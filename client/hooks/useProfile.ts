import { create } from 'zustand';
import axios from 'axios';

interface Address {
  _id: string;
  type: 'home' | 'work' | 'other';
  address: string;
  city: string;
  pincode: string;
  isDefault: boolean;
}

interface BcoinTransaction {
  _id: string;
  id: string;
  user_id: string;
  order_id: string;
  amount_spend: number;
  bcoins_earned: number;
  transaction_type: 'earned' | 'redeemed';
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  unit: string;
}

interface Order {
  _id: string;
  id: string;
  user_id: string;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  total_amount: number;
  delivery_address: string;
  phone_number: string;
  payment_mode: 'cash_on_delivery' | 'online' | 'bcoins';
  payment_status: 'pending' | 'paid' | 'failed';
  bcoins_used: number;
  delivery_fee: number;
  estimated_delivery?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserProfile {
  _id: string;
  clerk_id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'user' | 'admin';
  addresses: Address[];
  total_bcoins: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface ProfileState {
  // User Profile
  profile: UserProfile | null;
  isProfileLoading: boolean;
  profileError: string | null;
  
  // Orders
  orders: Order[];
  isOrdersLoading: boolean;
  ordersError: string | null;
  ordersPagination: Pagination;
  
  // Bcoins
  bcoinTransactions: BcoinTransaction[];
  isBcoinsLoading: boolean;
  bcoinsError: string | null;
  bcoinsPagination: Pagination;
  
  // Actions
  fetchProfile: (token: string) => Promise<void>;
  fetchOrders: (token: string, page?: number, status?: string) => Promise<void>;
  fetchBcoinHistory: (token: string, page?: number) => Promise<void>;
  updateProfile: (token: string, data: { name: string; phone?: string }) => Promise<void>;
  addAddress: (token: string, address: Omit<Address, '_id'>) => Promise<void>;
  updateAddress: (token: string, addressId: string, address: Omit<Address, '_id'>) => Promise<void>;
  deleteAddress: (token: string, addressId: string) => Promise<void>;
  refreshAll: (token: string) => Promise<void>;
  clearProfile: () => void;
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

export const useProfile = create<ProfileState>((set, get) => ({
  // Initial state
  profile: null,
  isProfileLoading: false,
  profileError: null,
  
  orders: [],
  isOrdersLoading: false,
  ordersError: null,
  ordersPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },
  
  bcoinTransactions: [],
  isBcoinsLoading: false,
  bcoinsError: null,
  bcoinsPagination: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  },

  // Fetch user profile
  fetchProfile: async (token: string) => {
    // Don't fetch if already loading
    if (get().isProfileLoading) {
      return;
    }

    set({ isProfileLoading: true, profileError: null });
    
    try {
      const response = await axios.get(`${BACKEND_BASE_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        set({
          profile: response.data.data,
          isProfileLoading: false,
          profileError: null,
        });
      } else {
        set({
          profileError: response.data.message || 'Failed to fetch profile',
          isProfileLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // More detailed error logging
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      
      set({
        profileError: error.response?.data?.message || error.message || 'Failed to fetch profile',
        isProfileLoading: false,
      });
    }
  },

  // Fetch user orders
  fetchOrders: async (token: string, page: number = 1, status?: string) => {
    set({ isOrdersLoading: true, ordersError: null });
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (status) {
        params.append('status', status);
      }

      const response = await axios.get(`${BACKEND_BASE_URL}/api/orders/my-orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const newOrders = response.data.data;
        const existingOrders = get().orders;
        
        // If it's page 1, replace orders; otherwise append
        const finalOrders = page === 1 ? newOrders : [...existingOrders, ...newOrders];
        
        set({
          orders: finalOrders,
          ordersPagination: response.data.pagination,
          isOrdersLoading: false,
          ordersError: null,
        });
      } else {
        set({
          ordersError: response.data.message || 'Failed to fetch orders',
          isOrdersLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      set({
        ordersError: error.response?.data?.message || error.message || 'Failed to fetch orders',
        isOrdersLoading: false,
      });
    }
  },

  // Fetch bcoin history
  fetchBcoinHistory: async (token: string, page: number = 1) => {
    set({ isBcoinsLoading: true, bcoinsError: null });
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      const response = await axios.get(`${BACKEND_BASE_URL}/api/users/bcoins?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const newTransactions = response.data.data.transactions;
        const existingTransactions = get().bcoinTransactions;
        
        // If it's page 1, replace transactions; otherwise append
        const finalTransactions = page === 1 ? newTransactions : [...existingTransactions, ...newTransactions];
        
        set({
          bcoinTransactions: finalTransactions,
          bcoinsPagination: response.data.pagination,
          isBcoinsLoading: false,
          bcoinsError: null,
        });

        // Update profile with current bcoin balance
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              total_bcoins: response.data.data.currentBalance,
            },
          });
        }
      } else {
        set({
          bcoinsError: response.data.message || 'Failed to fetch bcoin history',
          isBcoinsLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error fetching bcoin history:', error);
      set({
        bcoinsError: error.response?.data?.message || error.message || 'Failed to fetch bcoin history',
        isBcoinsLoading: false,
      });
    }
  },

  // Update profile
  updateProfile: async (token: string, data: { name: string; phone?: string }) => {
    set({ isProfileLoading: true, profileError: null });
    
    try {
      const response = await axios.put(`${BACKEND_BASE_URL}/api/users/profile`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        set({
          profile: response.data.data,
          isProfileLoading: false,
          profileError: null,
        });
      } else {
        set({
          profileError: response.data.message || 'Failed to update profile',
          isProfileLoading: false,
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      set({
        profileError: error.response?.data?.message || error.message || 'Failed to update profile',
        isProfileLoading: false,
      });
    }
  },

  // Add address
  addAddress: async (token: string, address: Omit<Address, '_id'>) => {
    try {
      const response = await axios.post(`${BACKEND_BASE_URL}/api/users/addresses`, address, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              addresses: response.data.data,
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Error adding address:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to add address');
    }
  },

  // Update address
  updateAddress: async (token: string, addressId: string, address: Omit<Address, '_id'>) => {
    try {
      const response = await axios.put(`${BACKEND_BASE_URL}/api/users/addresses/${addressId}`, address, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              addresses: response.data.data,
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Error updating address:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to update address');
    }
  },

  // Delete address
  deleteAddress: async (token: string, addressId: string) => {
    try {
      const response = await axios.delete(`${BACKEND_BASE_URL}/api/users/addresses/${addressId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        const currentProfile = get().profile;
        if (currentProfile) {
          set({
            profile: {
              ...currentProfile,
              addresses: response.data.data,
            },
          });
        }
      }
    } catch (error: any) {
      console.error('Error deleting address:', error);
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete address');
    }
  },

  // Refresh all data
  refreshAll: async (token: string) => {
    await Promise.all([
      get().fetchProfile(token),
      get().fetchOrders(token, 1),
      get().fetchBcoinHistory(token, 1),
    ]);
  },

  // Clear profile data (for logout)
  clearProfile: () => {
    set({
      profile: null,
      isProfileLoading: false,
      profileError: null,
      orders: [],
      isOrdersLoading: false,
      ordersError: null,
      ordersPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      },
      bcoinTransactions: [],
      isBcoinsLoading: false,
      bcoinsError: null,
      bcoinsPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
      },
    });
  },
}));
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware'; // Import createJSONStorage
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  image_url: string;
  quantity: number;
  unit: string;
  isOpen: boolean;
  category: string;
}

interface CartState {
  items: CartItem[];
  totalItems: number;
  totalAmount: number;
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      totalItems: 0,
      totalAmount: 0,

      addToCart: (product, quantity) => {
        const items = get().items;
        const existingItemIndex = items.findIndex(item => item.id === product.id);

        let newItems;
        if (existingItemIndex >= 0) {
          newItems = items.map((item, index) =>
            index === existingItemIndex
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          const newItem: CartItem = {
            id: product.id,
            name: product.name,
            price: product.discountedPrice,
            originalPrice: product.originalPrice,
            image_url: product.image_url,
            quantity,
            unit: product.unit,
            isOpen: product.isOpen,
            category: product.category,
          };
          newItems = [...items, newItem];
        }

        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        set({
          items: newItems,
          totalItems,
          totalAmount,
        });
      },

      removeFromCart: (productId) => {
        const items = get().items;
        const newItems = items.filter(item => item.id !== productId);
        
        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        set({
          items: newItems,
          totalItems,
          totalAmount,
        });
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }

        const items = get().items;
        const newItems = items.map(item =>
          item.id === productId ? { ...item, quantity } : item
        );

        const totalItems = newItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        set({
          items: newItems,
          totalItems,
          totalAmount,
        });
      },

      clearCart: () => {
        set({
          items: [],
          totalItems: 0,
          totalAmount: 0,
        });
      },

      getItemQuantity: (productId) => {
        const item = get().items.find(item => item.id === productId);
        return item ? item.quantity : 0;
      },
    }),
    {
      name: 'cart-storage', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
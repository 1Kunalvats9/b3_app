import axios from "axios";
import { create } from "zustand";

interface Category {
    id: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
}

interface CategoryState {
    categories: Category[];
    loading: boolean;
    error: string | null;
    getCategories: (forceRefresh?: boolean) => Promise<void>; 
    addCategory: (categoryName: string, token: string) => Promise<void>; // Added addCategory
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

export const useCategory = create<CategoryState>((set, get) => ({
    categories: [],
    loading: false,
    error: null,

    /**
     * - If categories are already loaded, it won't re-fetch unless forceRefresh is true.
     * @param forceRefresh Optional boolean to force a re-fetch, bypassing the cache.
     */
    getCategories: async (forceRefresh = false) => {
        if (get().categories.length > 0 && !forceRefresh && !get().loading) {
            console.log("Categories already loaded, skipping fetch.");
            return;
        }

        set({ loading: true, error: null });
        try {
            // Fetch categories for the current user's business
            const response = await axios.get(`${BACKEND_BASE_URL}/api/categories/own-categories`);

            if (response.data.success) {
                // Assuming the backend returns an array of category objects or strings
                // If it returns an array of strings, convert them to Category objects
                const fetchedCategories: Category[] = response.data.data.map((item: any) => {
                    // Check if item is already an object with id and name, or just a string
                    if (typeof item === 'string') {
                        return { id: item, name: item };
                    }
                    return { id: item._id, name: item.name }; // Assuming backend returns _id and name
                });

                set({
                    categories: fetchedCategories,
                    loading: false,
                });
            } else {
                set({
                    error: response.data.message || 'Failed to fetch categories',
                    loading: false,
                });
            }
        } catch (err: any) {
            console.error('Error fetching categories:', err);
            set({
                error: err.response?.data?.message || err.message || 'An unknown error occurred',
                loading: false,
            });
        }
    },
    /**
     * Adds a new category to the backend.
     * @param categoryName The name of the new category to add.
     * @param token Clerk authentication token.
     */
    addCategory: async (categoryName: string, token: string) => {
        set({ loading: true, error: null });
        try {
            const response = await axios.post(
                `${BACKEND_BASE_URL}/api/categories`, // Assuming this is the endpoint for adding categories
                { name: categoryName },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );

            if (response.data.success) {
                // Add the newly created category to the local state
                const newCategory: Category = {
                    id: response.data.data._id || categoryName, // Use ID from backend if available, otherwise name
                    name: response.data.data.name || categoryName,
                };
                set((state) => ({
                    categories: [...state.categories, newCategory],
                    loading: false,
                }));
                return Promise.resolve(); // Indicate success
            } else {
                const errorMessage = response.data.message || 'Failed to add category';
                set({ error: errorMessage, loading: false });
                return Promise.reject(new Error(errorMessage)); // Indicate failure
            }
        } catch (err: any) {
            console.error("Error in addCategory:", err);
            const errorMessage = err.response?.data?.message || err.message || "Error in adding the category";
            set({ error: errorMessage, loading: false });
            return Promise.reject(new Error(errorMessage)); // Indicate failure
        }
    }
}));


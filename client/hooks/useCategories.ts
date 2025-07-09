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
    setCategory: () => Promise<void>; 
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
            const response = await axios.get(`${BACKEND_BASE_URL}/api/categories/own-categories`);

            if (response.data.success) {
                const fetchedCategories: Category[] = response.data.data.map((name: string, index: number) => ({
                    id: name, 
                    name: name,
                }));

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
    setCategory: async () => {
        set({ loading: true, error: null });
        try {
            await axios.get(`${BACKEND_BASE_URL}/api/categories`);
        } catch (err: any) {
            console.error("Error in setCategory:", err);
            set({ error: err.response?.data?.message || err.message || "Error in setting the category" });
        } finally {
            set({ loading: false });
        }
    }
}));
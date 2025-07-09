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
    getCategories: () => Promise<void>;
    setCategory: () => Promise<void>; 
    loading: boolean;
    error: string | null;
}

const BACKEND_BASE_URL = process.env.BACKEND_BASE_URL || 'http://localhost:3000';

export const useCategory = create<CategoryState>((set, get) => ({
    categories: [],
    loading: false,
    error: null,

    getCategories: async () => {
        set({ loading: true, error: null });
        try {
            const response = await axios.get(`${BACKEND_BASE_URL}/api/categories`);

            if (response.data.success) {
                set({
                    categories: response.data.data,
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
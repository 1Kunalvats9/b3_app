import { create } from 'zustand';

interface OrderPayloadItem {
    product_id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    image: string;
}

interface OrderPayload {
    items: OrderPayloadItem[];
    deliveryOption: String;
    paymentOption: 'online' | 'cash_on_delivery'; 
    address: string;
    phoneNumber: string | number;
    bcoins_used?: number;
}

interface OrderResponseData {
    id: string;
    total_amount: number;
    coinsEarned?: number;
}

interface OrderResponse {
    success: boolean;
    message: string;
    data?: OrderResponseData;
    error?: string;
}

interface OrderItemFetched {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    unit: string;
}

interface OrderFetched {
    _id: string;
    id: string;
    user_id: string;
    items: OrderItemFetched[];
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

interface Pagination {
    currentPage: number;
    totalPages: number;
    totalItems: number;
}

interface OrderState {
    isLoading: boolean;
    error: string | null;
    orders: OrderFetched[];
    isOrdersLoading: boolean;
    ordersError: string | null;
    ordersPagination: Pagination;
    createOrder: (orderData: OrderPayload, token: string) => Promise<OrderResponse>;
    getMyOrders: (token: string, page?: number, limit?: number, status?: string) => Promise<void>;
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

export const useOrders = create<OrderState>((set) => ({
    isLoading: false,
    error: null,
    orders: [],
    isOrdersLoading: false,
    ordersError: null,
    ordersPagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 0,
    },

    createOrder: async (orderData: OrderPayload, token: string): Promise<OrderResponse> => {
        set({ isLoading: true, error: null });
        try {
            console.log('Attempting to post to URL:', `${BACKEND_BASE_URL}/api/orders/create-order`);

            const response: Response = await fetch(`${BACKEND_BASE_URL}/api/orders/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    items: orderData.items,
                    delivery_address: orderData.address,
                    phone_number: orderData.phoneNumber,
                    payment_mode: orderData.paymentOption,
                    delivery_option: orderData.deliveryOption, 
                    bcoins_used: orderData.bcoins_used || 0,
                }),
            });

            console.log("Raw Response Status:", response.status);
            let responseText = '';
            try {
                const clonedResponse = response.clone();
                responseText = await clonedResponse.text();
                console.log("Raw Response Text (for debugging):", responseText);
            } catch (textErr) {
                console.error("Failed to read raw response text for debugging:", textErr);
            }

            const responseData = await response.json();
            console.log("Parsed Response Data:", responseData);

            if (!response.ok) {
                const errorMessage = responseData.message || `HTTP error! Status: ${response.status}. Raw response: ${responseText.substring(0, 100)}`;
                console.error("Fetch request error (non-OK response):", errorMessage, responseData);
                set({ isLoading: false, error: errorMessage });
                return { success: false, message: errorMessage, error: errorMessage };
            }

            console.log("Order creation successful!");
            set({ isLoading: false });
            return { success: responseData.success, message: responseData.message, data: responseData.data };

        } catch (err: any) {
            console.error("Fetch request failed:", err);
            const errorMessage = err.message || 'A network error occurred or JSON parsing failed.';
            set({ isLoading: false, error: errorMessage });
            return { success: false, message: errorMessage, error: errorMessage };
        }
    },
    getMyOrders: async (token: string, page: number = 1, limit: number = 10, status?: string) => {
        set({ isOrdersLoading: true, ordersError: null });
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (status) {
                params.append('status', status);
            }

            const url = `${BACKEND_BASE_URL}/api/orders/my-orders?${params.toString()}`;
            console.log('Attempting to fetch orders from URL:', url);

            const response: Response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
            });

            const responseData = await response.json();
            console.log("Raw Response Status for orders:", response.status);
            console.log("Parsed Orders Data:", responseData);

            if (!response.ok) {
                const errorMessage = responseData.message || `HTTP error! Status: ${response.status}`;
                console.error("Fetch orders error (non-OK response):", errorMessage, responseData);
                set({ isOrdersLoading: false, ordersError: errorMessage });
            } else {
                set({
                    orders: responseData.data,
                    ordersPagination: responseData.pagination,
                    isOrdersLoading: false,
                    ordersError: null,
                });
                console.log("Orders fetched successfully!");
            }
        } catch (err: any) {
            console.error("Fetch orders failed:", err);
            const errorMessage = err.message || 'A network error occurred or JSON parsing failed.';
            set({ isOrdersLoading: false, ordersError: errorMessage });
        }
    }
}));

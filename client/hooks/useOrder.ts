import { create } from 'zustand';

interface OrderPayloadItem {
    _id: string;
    name: string;
    price: number;
    quantity: number;
    category: string;
    image: string;
}

interface OrderPayload {
    items: OrderPayloadItem[];
    deliveryOption: String;
    paymentOption: 'online' | 'cod';
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

interface OrderState {
    isLoading: boolean;
    error: string | null;
    createOrder: (orderData: OrderPayload) => Promise<OrderResponse>;
}

// Ensure process.env.EXPO_PUBLIC_BACKEND_BASE_URL is correctly configured in your Expo environment
const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

export const useOrders = create<OrderState>((set) => ({
    isLoading: false,
    error: null,

    createOrder: async (orderData: OrderPayload): Promise<OrderResponse> => {
        set({ isLoading: true, error: null });
        try {
            console.log('Attempting to post to URL:', `${BACKEND_BASE_URL}/api/orders/create-order`);

            // Use the native fetch API for the POST request
            const response: Response = await fetch(`${BACKEND_BASE_URL}/api/orders/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    // Aligning payload keys with your provided fetch body structure
                    items: orderData.items,
                    delivery_address: orderData.address, // Assuming backend expects 'delivery_address'
                    deliveryOption: orderData.deliveryOption,
                    paymentOption: orderData.paymentOption, // Assuming backend expects 'paymentOption'
                    phoneNumber: orderData.phoneNumber, // Assuming backend expects 'phoneNumber'
                    bcoins_used: orderData.bcoins_used || 0,
                }),
            });

            const responseData = await response.json();
            console.log("Response Data:", responseData);

            // Check if the HTTP response was successful (status code 200-299)
            if (!response.ok) {
                // If response.ok is false, it means an HTTP error (e.g., 404, 500) occurred.
                // The actual error message from the backend should be in responseData.message or similar.
                const errorMessage = responseData.message || `HTTP error! Status: ${response.status}`;
                console.error("Fetch request error (non-OK response):", errorMessage, responseData);
                set({ isLoading: false, error: errorMessage });
                return { success: false, message: errorMessage, error: errorMessage };
            }

            console.log("Order creation successful!");
            set({ isLoading: false });
            return { success: responseData.success, message: responseData.message, data: responseData.data };

        } catch (err: any) {
            // This catch block will handle network errors (e.g., server unreachable)
            // or issues with parsing the JSON response.
            console.error("Fetch request failed:", err);
            const errorMessage = err.message || 'A network error occurred or JSON parsing failed.';
            set({ isLoading: false, error: errorMessage });
            return { success: false, message: errorMessage, error: errorMessage };
        }
    },
}));

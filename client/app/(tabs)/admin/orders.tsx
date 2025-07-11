import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal, // Still needed for CustomAlert, but not for order details
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import CustomAlert from '@/components/CustomAlert'; // Keep if you want confirmation, adjust if you remove it.
import CustomToast from '@/components/CustomToast';
import OrderDetailsModal from '@/components/OrderDetailsModal';

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
  id: string; // Your custom UUID
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

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

const AdminOrders = () => {
  const { getToken } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>
  });

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const showAlert = (title: string, message: string, buttons: Array<{ text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive' }>) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToastConfig({
      visible: true,
      message,
      type
    });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#6B7280' },
    { value: 'pending', label: 'Pending', color: '#F59E0B' },
    { value: 'confirmed', label: 'Confirmed', color: '#3B82F6' },
    { value: 'preparing', label: 'Preparing', color: '#8B5CF6' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: '#10B981' },
    { value: 'delivered', label: 'Delivered', color: '#059669' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' },
  ];

  const fetchOrders = async (page: number = 1, status?: string, isRefresh: boolean = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const token = await getToken();
      if (!token) {
        console.log("FETCH ORDERS: Authentication token missing.");
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (status && status !== 'all') {
        params.append('status', status);
      }
      console.log(`FETCH ORDERS: Fetching orders from ${BACKEND_BASE_URL}/api/orders?${params.toString()}`);
      const response = await fetch(`${BACKEND_BASE_URL}/api/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch orders');
      }

      if (page === 1 || isRefresh) {
        setOrders(data.data);
      } else {
        setOrders(prev => [...prev, ...data.data]);
      }

      setPagination(data.pagination);
    } catch (error) {
      console.error('FETCH ORDERS: Error fetching orders:', error);
      showToast(error instanceof Error ? error.message : 'Failed to fetch orders', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      console.log('FETCH ORDERS: Loading/refreshing complete.');
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${BACKEND_BASE_URL}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update order status');
      }

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      // Update selectedOrder if it's the same order
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }
      
      showToast('Order status updated successfully', 'success');
      console.log('UPDATE STATUS: Status update successful.');

    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
      console.log('UPDATE STATUS: isUpdatingStatus set to false.');
    }
  };

  const handleStatusUpdate = (orderToUpdate: Order, newStatus: string) => {
    
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
    
    showAlert(
      'Update Order Status',
      `Are you sure you want to change order #${orderToUpdate.id.substring(0, 8)} status to "${statusLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {
            console.log("HANDLE STATUS UPDATE: Alert cancelled.");
        }},
        {
          text: 'Update',
          onPress: () => {
            console.log("HANDLE STATUS UPDATE: Alert 'Update' pressed. Calling updateOrderStatus.");
            updateOrderStatus(orderToUpdate.id, newStatus);
          },
        },
      ]
    );
  };

  const handleOrderPress = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderModal(true);
  };

  const handleCloseOrderModal = () => {
    setShowOrderModal(false);
    setSelectedOrder(null);
  };
  useEffect(() => {
    console.log(`USE EFFECT: Fetching orders for status: ${selectedStatus}`);
    fetchOrders(1, selectedStatus, true);
  }, [selectedStatus]);

  const onRefresh = useCallback(() => {
    console.log(`ON REFRESH: Triggered for status: ${selectedStatus}`);
    fetchOrders(1, selectedStatus, true);
  }, [selectedStatus]);

  const loadMore = () => {
    console.log(`LOAD MORE: Triggered. Current page: ${pagination.currentPage}, Total pages: ${pagination.totalPages}`);
    if (!isLoading && pagination.currentPage < pagination.totalPages) {
      fetchOrders(pagination.currentPage + 1, selectedStatus);
    }
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    // Determine the next possible statuses for the current order
    const nextStatusActions: { label: string; value: string; color: string }[] = [];

    // Define allowed transitions (simplified for direct buttons)
    switch (item.status) {
      case 'pending':
        nextStatusActions.push(
          { label: 'Confirm', value: 'confirmed', color: '#3B82F6' },
          { label: 'Cancel', value: 'cancelled', color: '#EF4444' }
        );
        break;
      case 'confirmed':
        nextStatusActions.push(
          { label: 'Prepare', value: 'preparing', color: '#8B5CF6' },
          { label: 'Cancel', value: 'cancelled', color: '#EF4444' }
        );
        break;
      case 'preparing':
        nextStatusActions.push(
          { label: 'Out for Delivery', value: 'out_for_delivery', color: '#10B981' },
          { label: 'Cancel', value: 'cancelled', color: '#EF4444' }
        );
        break;
      case 'out_for_delivery':
        nextStatusActions.push(
          { label: 'Delivered', value: 'delivered', color: '#059669' }
        );
        break;
      // No actions for 'delivered' or 'cancelled'
    }

    return (
      <TouchableOpacity
        onPress={() => handleOrderPress(item)}
        className="p-4 mb-4 bg-white border border-gray-100 shadow-sm rounded-xl"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-800">
            Order #{item.id.substring(0, 8)}
          </Text>
          <View
            className="px-3 py-1 rounded-full"
            style={{ backgroundColor: `${getStatusColor(item.status)}20` }}
          >
            <Text
              className="text-sm font-semibold"
              style={{ color: getStatusColor(item.status) }}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-base font-semibold text-gray-700">
            ₹{item.total_amount.toFixed(2)}
          </Text>
          <Text className="text-sm text-gray-500">
            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
          </Text>
          {item.bcoins_used > 0 && (
            <Text className="text-sm text-yellow-600">
              Bcoins Used: {item.bcoins_used}
            </Text>
          )}
        </View>

        <View className="mb-3">
          <Text className="text-sm text-gray-600">
            <Text className="font-medium">Phone:</Text> {item.phone_number}
          </Text>
          <Text className="text-sm text-gray-600" numberOfLines={2}>
            <Text className="font-medium">Address:</Text> {item.delivery_address}
          </Text>
          <Text className="text-sm text-gray-600">
            <Text className="font-medium">Payment:</Text> {item.payment_mode.replace(/_/g, ' ')}
          </Text>
        </View>

        <Text className="mb-4 text-xs text-gray-500">
          {new Date(item.createdAt).toLocaleDateString()} at{' '}
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>

        {/* Tap to view details indicator */}
        <View className="flex-row items-center justify-center py-2 mt-2 rounded-lg bg-gray-50">
          <Feather name="eye" size={16} color="#6B7280" />
          <Text className="ml-2 text-sm text-gray-600">Tap to view details</Text>
        </View>

        {/* Action Buttons based on status */}
        {nextStatusActions.length > 0 && (
          <View className="flex-row justify-around mt-2">
            {nextStatusActions.map((action) => (
              <TouchableOpacity
                key={action.value}
                onPress={(e) => {
                  e.stopPropagation();
                  handleStatusUpdate(item, action.value);
                }}
                disabled={isUpdatingStatus}
                className={`flex-1 px-4 py-2 mx-1 rounded-lg items-center justify-center`}
                style={{ 
                  backgroundColor: isUpdatingStatus ? '#E5E7EB' : action.color, // Gray out when updating
                  opacity: isUpdatingStatus ? 0.6 : 1 
                }}
              >
                <Text className="text-base font-semibold text-white">
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Text className="text-xl font-bold text-center text-gray-800">Orders Management</Text>
        <Text className="mt-1 text-sm text-center text-gray-500">
          {pagination.totalItems} total orders
        </Text>
      </View>

      {/* Status Filter */}
      <View className="bg-white border-b border-gray-100">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {statusOptions.map((status) => (
            <TouchableOpacity
              key={status.value}
              onPress={() => {
                console.log(`STATUS FILTER: Selected new status: ${status.value}`);
                setSelectedStatus(status.value);
              }}
              className={`px-4 py-2 mr-3 rounded-full border ${
                selectedStatus === status.value
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-300 bg-white'
              }`}
            >
              <Text
                className={`font-medium text-sm ${
                  selectedStatus === status.value ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                {status.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Orders List */}
      {isLoading && orders.length === 0 ? (
        <View className="items-center justify-center flex-1">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="mt-4 text-gray-600">Loading orders...</Text>
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={['#8B5CF6']}
              tintColor="#8B5CF6"
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() =>
            isLoading ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : null
          }
        />
      ) : (
        <View className="items-center justify-center flex-1">
          <View className="items-center justify-center w-24 h-24 mb-4 bg-gray-100 rounded-full">
            <Feather name="shopping-bag" size={32} color="#9CA3AF" />
          </View>
          <Text className="mb-2 text-xl font-bold text-gray-800">No orders found</Text>
          <Text className="px-8 text-center text-gray-500">
            {selectedStatus === 'all' 
              ? 'No orders have been placed yet'
              : `No orders with status "${getStatusLabel(selectedStatus)}" found`
            }
          </Text>
        </View>
      )}

      {/* CustomAlert and CustomToast are still here for confirmations and messages */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => {
            console.log("CUSTOM ALERT: Closing alert.");
            setAlertConfig(prev => ({ ...prev, visible: false }));
        }}
      />

      <CustomToast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={() => {
            console.log("CUSTOM TOAST: Hiding toast.");
            setToastConfig(prev => ({ ...prev, visible: false }));
        }}
      />

      <OrderDetailsModal
        visible={showOrderModal}
        order={selectedOrder}
        onClose={handleCloseOrderModal}
        onStatusUpdate={updateOrderStatus}
        isUpdating={isUpdatingStatus}
      />
    </SafeAreaView>
  );
};

export default AdminOrders;
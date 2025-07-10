import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import CustomAlert from '@/components/CustomAlert';
import CustomToast from '@/components/CustomToast';

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
        throw new Error('Authentication required');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (status && status !== 'all') {
        params.append('status', status);
      }

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
      console.error('Error fetching orders:', error);
      showToast(error instanceof Error ? error.message : 'Failed to fetch orders', 'error');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

      // Update local state
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus as any } : order
      ));

      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as any } : null);
      }

      showToast('Order status updated successfully', 'success');
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast(error instanceof Error ? error.message : 'Failed to update order status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStatusUpdate = (order: Order, newStatus: string) => {
    const statusLabel = statusOptions.find(s => s.value === newStatus)?.label || newStatus;
    
    showAlert(
      'Update Order Status',
      `Are you sure you want to change order #${order.id.substring(0, 8)} status to "${statusLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Update',
          onPress: () => updateOrderStatus(order.id, newStatus),
        },
      ]
    );
  };

  useEffect(() => {
    fetchOrders(1, selectedStatus, true);
  }, [selectedStatus]);

  const onRefresh = useCallback(() => {
    fetchOrders(1, selectedStatus, true);
  }, [selectedStatus]);

  const loadMore = () => {
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

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedOrder(item);
        setShowOrderModal(true);
      }}
      className="p-4 mb-4 bg-white border border-gray-100 shadow-sm rounded-xl"
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

      <Text className="text-xs text-gray-500">
        {new Date(item.createdAt).toLocaleDateString()} at{' '}
        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </TouchableOpacity>
  );

  const renderOrderModal = () => {
    if (!selectedOrder) return null;

    const nextStatusOptions = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['out_for_delivery', 'cancelled'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const availableStatuses = nextStatusOptions[selectedOrder.status] || [];

    return (
      <Modal
        visible={showOrderModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowOrderModal(false)}
      >
        <SafeAreaView className="flex-1 bg-gray-50">
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">
              Order Details
            </Text>
            <TouchableOpacity
              onPress={() => setShowOrderModal(false)}
              className="p-2"
            >
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Order Info */}
            <View className="p-4 mx-4 mt-4 bg-white border border-gray-100 shadow-sm rounded-xl">
              <Text className="mb-4 text-lg font-bold text-gray-800">
                Order #{selectedOrder.id.substring(0, 8)}
              </Text>
              
              <View className="mb-3">
                <Text className="text-sm text-gray-500">Status</Text>
                <View
                  className="self-start px-3 py-1 mt-1 rounded-full"
                  style={{ backgroundColor: `${getStatusColor(selectedOrder.status)}20` }}
                >
                  <Text
                    className="text-sm font-semibold"
                    style={{ color: getStatusColor(selectedOrder.status) }}
                  >
                    {getStatusLabel(selectedOrder.status)}
                  </Text>
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Total Amount</Text>
                <Text className="text-xl font-bold text-gray-800">
                  ₹{selectedOrder.total_amount.toFixed(2)}
                </Text>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Phone Number</Text>
                <Text className="text-base text-gray-800">{selectedOrder.phone_number}</Text>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Delivery Address</Text>
                <Text className="text-base text-gray-800">{selectedOrder.delivery_address}</Text>
              </View>

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Payment Method</Text>
                <Text className="text-base text-gray-800">
                  {selectedOrder.payment_mode.replace(/_/g, ' ')}
                </Text>
              </View>

              {selectedOrder.bcoins_used > 0 && (
                <View className="mb-3">
                  <Text className="text-sm text-gray-500">Bcoins Used</Text>
                  <Text className="text-base text-yellow-600 font-semibold">
                    {selectedOrder.bcoins_used} coins
                  </Text>
                </View>
              )}

              <View className="mb-3">
                <Text className="text-sm text-gray-500">Order Date</Text>
                <Text className="text-base text-gray-800">
                  {new Date(selectedOrder.createdAt).toLocaleDateString()} at{' '}
                  {new Date(selectedOrder.createdAt).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            </View>

            {/* Order Items */}
            <View className="p-4 mx-4 mt-4 bg-white border border-gray-100 shadow-sm rounded-xl">
              <Text className="mb-4 text-lg font-bold text-gray-800">Order Items</Text>
              
              {selectedOrder.items.map((item, index) => (
                <View key={index} className="pb-3 mb-3 border-b border-gray-100 last:border-b-0 last:mb-0">
                  <Text className="text-base font-semibold text-gray-800">
                    {item.product_name}
                  </Text>
                  <View className="flex-row items-center justify-between mt-1">
                    <Text className="text-sm text-gray-600">
                      {item.quantity} {item.unit}{item.quantity > 1 ? 's' : ''} × ₹{item.unit_price.toFixed(2)}
                    </Text>
                    <Text className="text-base font-semibold text-gray-800">
                      ₹{item.total_price.toFixed(2)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Status Update Actions */}
            {availableStatuses.length > 0 && (
              <View className="p-4 mx-4 mt-4 mb-8 bg-white border border-gray-100 shadow-sm rounded-xl">
                <Text className="mb-4 text-lg font-bold text-gray-800">Update Status</Text>
                
                {availableStatuses.map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => handleStatusUpdate(selectedOrder, status)}
                    disabled={isUpdatingStatus}
                    className="flex-row items-center justify-between p-3 mb-3 border border-gray-200 rounded-lg last:mb-0"
                    style={{ opacity: isUpdatingStatus ? 0.6 : 1 }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="w-4 h-4 mr-3 rounded-full"
                        style={{ backgroundColor: getStatusColor(status) }}
                      />
                      <Text className="text-base font-medium text-gray-800">
                        Mark as {getStatusLabel(status)}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color="#6B7280" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Text className="text-xl font-bold text-center text-gray-800">Orders Management</Text>
        <Text className="text-sm text-center text-gray-500 mt-1">
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
              onPress={() => setSelectedStatus(status.value)}
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

      {renderOrderModal()}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      <CustomToast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={() => setToastConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

export default AdminOrders;
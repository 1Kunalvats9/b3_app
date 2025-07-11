import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

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

interface OrderDetailsModalProps {
  visible: boolean;
  order: Order | null;
  onClose: () => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  isUpdating: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  visible,
  order,
  onClose,
  onStatusUpdate,
  isUpdating,
}) => {
  if (!order) return null;

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: '#F59E0B', icon: 'clock' },
    { value: 'confirmed', label: 'Confirmed', color: '#3B82F6', icon: 'check-circle' },
    { value: 'preparing', label: 'Preparing', color: '#8B5CF6', icon: 'package' },
    { value: 'out_for_delivery', label: 'Out for Delivery', color: '#10B981', icon: 'truck' },
    { value: 'delivered', label: 'Delivered', color: '#059669', icon: 'check' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444', icon: 'x-circle' },
  ];

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || '#6B7280';
  };

  const getStatusLabel = (status: string) => {
    return statusOptions.find(s => s.value === status)?.label || status;
  };

  const getStatusIcon = (status: string) => {
    return statusOptions.find(s => s.value === status)?.icon || 'help-circle';
  };

  const getNextStatusActions = () => {
    const nextActions: { label: string; value: string; color: string }[] = [];

    switch (order.status) {
      case 'pending':
        nextActions.push(
          { label: 'Confirm Order', value: 'confirmed', color: '#3B82F6' },
          { label: 'Cancel Order', value: 'cancelled', color: '#EF4444' }
        );
        break;
      case 'confirmed':
        nextActions.push(
          { label: 'Start Preparing', value: 'preparing', color: '#8B5CF6' },
          { label: 'Cancel Order', value: 'cancelled', color: '#EF4444' }
        );
        break;
      case 'preparing':
        nextActions.push(
          { label: 'Out for Delivery', value: 'out_for_delivery', color: '#10B981' },
          { label: 'Cancel Order', value: 'cancelled', color: '#EF4444' }
        );
        break;
      case 'out_for_delivery':
        nextActions.push(
          { label: 'Mark as Delivered', value: 'delivered', color: '#059669' }
        );
        break;
    }

    return nextActions;
  };

  const handleStatusUpdate = (newStatus: string) => {
    const statusLabel = getStatusLabel(newStatus);
    
    Alert.alert(
      'Update Order Status',
      `Are you sure you want to change this order status to "${statusLabel}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => onStatusUpdate(order.id, newStatus),
        },
      ]
    );
  };

  const nextActions = getNextStatusActions();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-gray-50">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-800">Order Details</Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Order Header */}
          <View className="p-4 mx-4 mt-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold text-gray-800">
                Order #{order.id.substring(0, 8)}
              </Text>
              <View
                className="px-3 py-2 rounded-full flex-row items-center"
                style={{ backgroundColor: `${getStatusColor(order.status)}20` }}
              >
                <Feather 
                  name={getStatusIcon(order.status) as any} 
                  size={16} 
                  color={getStatusColor(order.status)} 
                />
                <Text
                  className="ml-2 text-sm font-semibold"
                  style={{ color: getStatusColor(order.status) }}
                >
                  {getStatusLabel(order.status)}
                </Text>
              </View>
            </View>

            <View className="space-y-3">
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Total Amount:</Text>
                <Text className="font-bold text-gray-800">₹{order.total_amount.toFixed(2)}</Text>
              </View>
              
              <View className="flex-row justify-between">
                <Text className="text-gray-600">Payment Mode:</Text>
                <Text className="font-medium text-gray-800 capitalize">
                  {order.payment_mode.replace(/_/g, ' ')}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-gray-600">Payment Status:</Text>
                <Text className={`font-medium capitalize ${
                  order.payment_status === 'paid' ? 'text-green-600' : 
                  order.payment_status === 'failed' ? 'text-red-600' : 'text-yellow-600'
                }`}>
                  {order.payment_status}
                </Text>
              </View>

              {order.bcoins_used > 0 && (
                <View className="flex-row justify-between">
                  <Text className="text-gray-600">Bcoins Used:</Text>
                  <Text className="font-medium text-yellow-600">{order.bcoins_used} coins</Text>
                </View>
              )}

              <View className="flex-row justify-between">
                <Text className="text-gray-600">Order Date:</Text>
                <Text className="font-medium text-gray-800">
                  {new Date(order.createdAt).toLocaleDateString()} at{' '}
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          </View>

          {/* Customer Information */}
          <View className="p-4 mx-4 mt-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Text className="mb-3 text-lg font-bold text-gray-800">Customer Information</Text>
            <View className="space-y-2">
              <View>
                <Text className="text-sm text-gray-600">Phone Number</Text>
                <Text className="text-base font-medium text-gray-800">{order.phone_number}</Text>
              </View>
              <View>
                <Text className="text-sm text-gray-600">Delivery Address</Text>
                <Text className="text-base font-medium text-gray-800">{order.delivery_address}</Text>
              </View>
            </View>
          </View>

          {/* Order Items */}
          <View className="p-4 mx-4 mt-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Text className="mb-4 text-lg font-bold text-gray-800">
              Order Items ({order.items.length})
            </Text>
            
            {order.items.map((item, index) => (
              <View 
                key={index} 
                className={`flex-row items-center py-3 ${
                  index !== order.items.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="w-12 h-12 mr-3 bg-gray-100 rounded-lg items-center justify-center">
                  <Feather name="package" size={20} color="#6B7280" />
                </View>
                
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800" numberOfLines={2}>
                    {item.product_name}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {item.quantity} {item.unit}{item.quantity > 1 ? 's' : ''} × ₹{item.unit_price.toFixed(2)}
                  </Text>
                </View>
                
                <Text className="font-bold text-gray-800">
                  ₹{item.total_price.toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Status Update Actions */}
          {nextActions.length > 0 && (
            <View className="p-4 mx-4 mt-4 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
              <Text className="mb-4 text-lg font-bold text-gray-800">Update Order Status</Text>
              
              <View className="space-y-3">
                {nextActions.map((action) => (
                  <TouchableOpacity
                    key={action.value}
                    onPress={() => handleStatusUpdate(action.value)}
                    disabled={isUpdating}
                    className={`flex-row items-center justify-center py-3 px-4 rounded-lg ${
                      isUpdating ? 'opacity-50' : ''
                    }`}
                    style={{ backgroundColor: action.color }}
                  >
                    {isUpdating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Feather 
                          name={action.value === 'cancelled' ? 'x-circle' : 'arrow-right'} 
                          size={18} 
                          color="white" 
                        />
                        <Text className="ml-2 text-base font-semibold text-white">
                          {action.label}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default OrderDetailsModal;
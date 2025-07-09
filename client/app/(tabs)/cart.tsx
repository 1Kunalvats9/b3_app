import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useCart, CartItem } from '@/hooks/useCart';
import initiateUpiPayment from "../../utils/upiPayment";
import SuccessModal from '@/components/SuccessModal';
import CustomAlert from '@/components/CustomAlert';
import CustomToast from '@/components/CustomToast';
//@ts-ignore

const Cart = () => {
  const { items, totalItems, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();

  const [address, setAddress] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'delivery' | 'takeaway'>('delivery');
  const [paymentOption, setPaymentOption] = useState<'online' | 'cod'>('online');

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

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
  };

  const handleRemoveItem = async (productId: string) => {
    const product = items.find(p => p.id === productId);
    showAlert(
      'Remove Item',
      `Are you sure you want to remove "${product?.name}" from your cart?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { } },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              removeFromCart(productId);
              showToast('Item removed from cart', 'success');
            } catch (error) {
              console.error('Failed to remove item:', error);
              showToast('Failed to remove item from cart', 'error');
            }
          },
        },
      ]
    );
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(productId);
      return;
    }
    try {
      updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
      showToast('Failed to update item quantity', 'error');
    }
  };

  const handleClearCart = async () => {
    showAlert(
      'Clear Cart',
      'Are you sure you want to remove all items from your cart?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => { } },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              clearCart();
              showToast('Cart cleared successfully', 'success');
            } catch (error) {
              console.error('Failed to clear cart:', error);
              showToast('Failed to clear cart', 'error');
            }
          },
        },
      ]
    );
  };

  const calculateTotalWithDelivery = () => {
    return totalAmount + (deliveryOption === 'delivery' ? 50 : 0);
  };

  const calculateCoinsToEarn = () => {
    const total = calculateTotalWithDelivery();
    return Math.floor(total / 100);
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      showToast('Your cart is empty. Please add items to place an order.', 'warning');
      return;
    }
    if (!phoneNumber.trim()) {
      showToast('Please enter your phone number.', 'warning');
      return;
    }
    if (deliveryOption === 'delivery' && !address.trim()) {
      showToast('Please enter your delivery address.', 'warning');
      return;
    }

    const orderTotal = calculateTotalWithDelivery();

    const orderData = {
      items: items.map(item => ({
        _id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        image: item.image_url,
      })),
      total: orderTotal,
      deliveryOption,
      paymentOption,
      address: deliveryOption === 'delivery' ? address : 'Store Pickup',
      phoneNumber,
    };

    console.log('Preparing to place order with data:', orderData);
    setIsPlacingOrder(true);

    try {
      if (paymentOption === 'online') {
        const paymentSuccess = await initiateUpiPayment(orderTotal, "Your Order Payment");
        if (!paymentSuccess) {
          setIsPlacingOrder(false);
          return;
        }
      }

      // Simulate order creation and user data refresh
      // In a real application, you would call your backend API here
      const simulatedOrderResponse = {
        _id: `ORDER${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        coinsEarned: calculateCoinsToEarn(),
      };

      clearCart();

      const orderNum = simulatedOrderResponse._id ? simulatedOrderResponse._id.slice(-6).toUpperCase() : 'UNKNOWN';
      const earned = simulatedOrderResponse.coinsEarned || calculateCoinsToEarn();

      setOrderNumber(orderNum);
      setCoinsEarned(earned);
      setShowSuccessModal(true);

      setAddress('');
      setPhoneNumber('');
      setDeliveryOption('delivery');
      setPaymentOption('online');

      showToast('Order placed successfully!', 'success');

    } catch (error) {
      console.error('Order placement error:', error);
      showAlert(
        'Order Failed',
        error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        [{ text: 'OK', onPress: () => { } }]
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <View className="p-4 mx-4 mb-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
      <View className="flex-row">
        <View className="w-20 h-20 mr-4 overflow-hidden bg-gray-100 rounded-xl">
          {item.image_url ? (
            <Image
              source={{ uri: item.image_url }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="items-center justify-center w-full h-full">
              <Feather name="image" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>

        <View className="flex-1">
          <Text className="mb-1 text-lg font-bold text-gray-800" numberOfLines={2}>
            {item.name}
          </Text>
          <Text className="mb-2 text-sm text-gray-500 capitalize">
            {item.category}
          </Text>
          <Text className="text-xl font-bold text-purple-600">
            ₹{item.price.toFixed(2)}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => handleRemoveItem(item.id)}
          className="flex items-center justify-center p-3 h-14 bg-red-50 rounded-xl "
        >
          <Feather name="trash-2" size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <View className="flex-row items-center p-1 bg-gray-50 rounded-xl">
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
            className="items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm"
          >
            <Feather name="minus" size={16} color="#374151" />
          </TouchableOpacity>
          <Text className="mx-6 text-lg font-bold text-gray-800">
            {item.quantity}
          </Text>
          <TouchableOpacity
            onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
            className="items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm"
          >
            <Feather name="plus" size={16} color="#374151" />
          </TouchableOpacity>
        </View>
        <Text className="text-xl font-bold text-gray-800">
          ₹{(item.price * item.quantity).toFixed(2)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Header component is assumed to be available, if not, you'll need to define it or remove this line */}
      {/* <Header title="Shopping Cart" showProfile={false} /> */} 

      {items.length > 0 ? (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
            <Text className="text-lg font-bold text-gray-800">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </Text>
            <TouchableOpacity
              onPress={handleClearCart}
              className="flex-row items-center px-4 py-2 bg-red-50 rounded-xl"
            >
              <Feather name="trash-2" size={16} color="#EF4444" />
              <Text className="ml-2 font-semibold text-red-600">Clear All</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={items}
            renderItem={renderCartItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingTop: 16 }}
            scrollEnabled={false}
          />

          <View className="p-6 mx-4 mt-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Text className="mb-6 text-xl font-bold text-gray-800">Order Details</Text>

            <View className="mb-6">
              <Text className="mb-3 text-base font-semibold text-gray-700">Phone Number *</Text>
              <TextInput
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholder="Enter your phone number"
                keyboardType="phone-pad"
                className="px-4 py-4 text-base border border-gray-200 rounded-xl bg-gray-50"
              />
            </View>

            <View className="mb-6">
              <Text className="mb-4 text-base font-semibold text-gray-700">Delivery Option</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => setDeliveryOption('delivery')}
                  className={`flex-1 flex-row items-center justify-center py-4 px-4 rounded-xl border-2 ${
                    deliveryOption === 'delivery' ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Feather name="truck" size={20} color={deliveryOption === 'delivery' ? '#8B5CF6' : '#6B7280'} />
                  <Text className={`ml-3 font-semibold ${deliveryOption === 'delivery' ? 'text-purple-600' : 'text-gray-600'}`}>
                    Home Delivery
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeliveryOption('takeaway')}
                  className={`flex-1 flex-row items-center justify-center py-4 px-4 rounded-xl border-2 ${
                    deliveryOption === 'takeaway' ? 'bg-purple-50 border-purple-500' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Feather name="shopping-bag" size={20} color={deliveryOption === 'takeaway' ? '#8B5CF6' : '#6B7280'} />
                  <Text className={`ml-3 font-semibold ${deliveryOption === 'takeaway' ? 'text-purple-600' : 'text-gray-600'}`}>
                    Takeaway
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {deliveryOption === 'delivery' && (
              <View className="mb-6">
                <Text className="mb-3 text-base font-semibold text-gray-700">Delivery Address *</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Enter your complete address"
                  multiline
                  numberOfLines={4}
                  className="px-4 py-4 text-base border border-gray-200 rounded-xl bg-gray-50"
                  textAlignVertical="top"
                />
              </View>
            )}

            <View className="mb-6">
              <Text className="mb-4 text-base font-semibold text-gray-700">Payment Method</Text>
              <View className="flex-row space-x-4">
                <TouchableOpacity
                  onPress={() => setPaymentOption('online')}
                  className={`flex-1 flex-row items-center justify-center py-4 px-4 rounded-xl border-2 ${
                    paymentOption === 'online' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Feather name="credit-card" size={20} color={paymentOption === 'online' ? '#10B981' : '#6B7280'} />
                  <Text className={`ml-3 font-semibold ${paymentOption === 'online' ? 'text-green-600' : 'text-gray-600'}`}>
                    Online Payment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setPaymentOption('cod')}
                  className={`flex-1 flex-row items-center justify-center py-4 px-4 rounded-xl border-2 ${
                    paymentOption === 'cod' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <Feather name="dollar-sign" size={20} color={paymentOption === 'cod' ? '#10B981' : '#6B7280'} />
                  <Text className={`ml-3 font-semibold ${paymentOption === 'cod' ? 'text-green-600' : 'text-gray-600'}`}>
                    Cash on {deliveryOption === 'delivery' ? 'Delivery' : 'Pickup'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View className="p-6 mx-4 mt-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <Text className="mb-4 text-xl font-bold text-gray-800">Order Summary</Text>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-base text-gray-600">Subtotal</Text>
              <Text className="text-base font-bold">₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-base text-gray-600">Delivery Fee</Text>
              <Text className="text-base font-bold">
                {deliveryOption === 'delivery' ? '₹50.00' : '₹0.00'}
              </Text>
            </View>
            <View className="pt-4 mt-4 border-t border-gray-200">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-800">Total</Text>
                <Text className="text-2xl font-bold text-purple-600">
                  ₹{calculateTotalWithDelivery().toFixed(2)}
                </Text>
              </View>

              <View className="flex-row items-center justify-between p-4 border border-yellow-200 bg-yellow-50 rounded-xl">
                <View className="flex-row items-center">
                  <Feather name="star" size={20} color="#F59E0B" />
                  <Text className="ml-2 text-base font-semibold text-yellow-700">You'll earn</Text>
                </View>
                <Text className="text-base font-bold text-yellow-700">
                  {calculateCoinsToEarn()} coin{calculateCoinsToEarn() !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>
          </View>

          <View className="px-4 pb-8">
            <TouchableOpacity
              onPress={handleCheckout}
              disabled={isPlacingOrder}
              className={`rounded-2xl py-5 items-center shadow-lg ${
                isPlacingOrder ? 'bg-gray-400' : 'bg-purple-500'
              }`}
            >
              {isPlacingOrder ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="ml-3 text-lg font-bold text-white">
                    Placing Order...
                  </Text>
                </View>
              ) : (
                <Text className="text-lg font-bold text-white">
                  Place Order - ₹{calculateTotalWithDelivery().toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View className="items-center justify-center flex-1 px-8">
          <View className="items-center justify-center w-32 h-32 mb-6 bg-gray-100 rounded-full">
            <Feather name="shopping-cart" size={48} color="#9CA3AF" />
          </View>
          <Text className="mb-3 text-2xl font-bold text-center text-gray-800">
            Your cart is empty
          </Text>
          <Text className="text-base leading-6 text-center text-gray-500">
            Add some delicious items to get started with your order
          </Text>
        </View>
      )}

      <SuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        orderNumber={orderNumber}
        coinsEarned={coinsEarned}
      />

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

export default Cart;
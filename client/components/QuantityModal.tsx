import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface Product {
  id: string;
  name: string;
  unit: string;
  discountedPrice: number;
}

interface QuantityModalProps {
  visible: boolean;
  product: Product;
  onConfirm: (quantity: number) => void;
  onCancel: () => void;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  visible,
  product,
  onConfirm,
  onCancel,
}) => {
  const [quantity, setQuantity] = useState('1');

  const handleConfirm = () => {
    const numQuantity = parseFloat(quantity);
    
    if (isNaN(numQuantity) || numQuantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity');
      return;
    }

    if (numQuantity > 50) {
      Alert.alert('Quantity Limit', 'Maximum quantity allowed is 50');
      return;
    }

    onConfirm(numQuantity);
    setQuantity('1');
  };

  const handleCancel = () => {
    setQuantity('1');
    onCancel();
  };

  const incrementQuantity = () => {
    const current = parseFloat(quantity) || 0;
    if (current < 50) {
      setQuantity((current + (product.unit === 'kg' ? 0.5 : 1)).toString());
    }
  };

  const decrementQuantity = () => {
    const current = parseFloat(quantity) || 0;
    const step = product.unit === 'kg' ? 0.5 : 1;
    if (current > step) {
      setQuantity((current - step).toString());
    }
  };

  const totalPrice = (parseFloat(quantity) || 0) * product.discountedPrice;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View className="items-center justify-center flex-1 px-4 bg-black/50">
        <View className="w-full max-w-sm p-6 bg-white rounded-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-gray-800">Select Quantity</Text>
            <TouchableOpacity onPress={handleCancel} activeOpacity={0.7}>
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Product Info */}
          <Text className="mb-4 text-gray-600" numberOfLines={2}>
            {product.name}
          </Text>

          {/* Quantity Input */}
          <View className="mb-4">
            <Text className="mb-2 font-medium text-gray-700">
              Quantity ({product.unit})
            </Text>
            
            <View className="flex-row items-center justify-between p-2 rounded-lg bg-gray-50">
              <TouchableOpacity
                onPress={decrementQuantity}
                className="p-2 bg-green-500 rounded-full"
                activeOpacity={0.8}
              >
                <Feather name="minus" size={20} color="white" />
              </TouchableOpacity>

              <TextInput
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
                className="flex-1 mx-4 text-lg font-bold text-center text-gray-800"
                placeholder="0"
              />

              <TouchableOpacity
                onPress={incrementQuantity}
                className="p-2 bg-green-500 rounded-full"
                activeOpacity={0.8}
              >
                <Feather name="plus" size={20} color="white" />
              </TouchableOpacity>
            </View>

            <Text className="mt-1 text-sm text-center text-gray-500">
              Price per {product.unit}: ₹{product.discountedPrice}
            </Text>
          </View>

          {/* Total Price */}
          <View className="p-3 mb-4 rounded-lg bg-green-50">
            <View className="flex-row items-center justify-between">
              <Text className="font-medium text-gray-700">Total Amount:</Text>
              <Text className="text-lg font-bold text-green-600">
                ₹{totalPrice.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-2 space-x-3">
            <TouchableOpacity
              onPress={handleCancel}
              className="flex-1 py-3 bg-gray-200 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="font-medium text-center text-gray-700">Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              className="flex-1 py-3 bg-green-500 rounded-lg"
              activeOpacity={0.8}
            >
              <Text className="font-medium text-center text-white">Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default QuantityModal;
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PaymentConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmPayment: () => Promise<void>;
  orderTotal: number;
  paymentMethod: string;
}

const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirmPayment,
  orderTotal,
  paymentMethod,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaymentConfirmation = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPayment();
    } catch (error) {
      console.error('Payment confirmation error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-center items-center px-4">
        <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
          {/* Header */}
          <View className="items-center mb-6">
            <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
              <Feather name="credit-card" size={24} color="#3B82F6" />
            </View>
            <Text className="text-xl font-bold text-gray-800 text-center">
              Confirm Payment
            </Text>
          </View>

          {/* Payment Details */}
          <View className="mb-6">
            <View className="bg-gray-50 rounded-lg p-4 mb-4">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-gray-600">Payment Method:</Text>
                <Text className="font-semibold text-gray-800 capitalize">
                  {paymentMethod.replace(/_/g, ' ')}
                </Text>
              </View>
              <View className="flex-row justify-between items-center">
                <Text className="text-gray-600">Total Amount:</Text>
                <Text className="text-xl font-bold text-green-600">
                  ₹{orderTotal.toFixed(2)}
                </Text>
              </View>
            </View>

            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <View className="flex-row items-start">
                <Feather name="info" size={16} color="#F59E0B" />
                <Text className="ml-2 text-sm text-yellow-700">
                  You will be redirected to your UPI app to complete the payment. 
                  Please complete the transaction and return to confirm your order.
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="space-y-3">
            <TouchableOpacity
              onPress={handlePaymentConfirmation}
              disabled={isProcessing}
              className={`py-3 px-4 rounded-xl ${
                isProcessing ? 'bg-gray-400' : 'bg-blue-500'
              }`}
            >
              {isProcessing ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator size="small" color="white" />
                  <Text className="ml-2 text-center font-semibold text-white">
                    Processing Payment...
                  </Text>
                </View>
              ) : (
                <Text className="text-center font-semibold text-white">
                  Proceed to Payment
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onClose}
              disabled={isProcessing}
              className="py-3 px-4 rounded-xl bg-gray-200"
            >
              <Text className="text-center font-semibold text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentConfirmationModal;
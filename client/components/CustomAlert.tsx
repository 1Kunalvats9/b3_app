import React from 'react';
import { View, Text, TouchableOpacity, Modal, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>;
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  buttons,
  onClose,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'destructive':
        return 'bg-red-500';
      case 'cancel':
        return 'bg-gray-200';
      default:
        return 'bg-blue-500';
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return 'text-gray-700';
      default:
        return 'text-white';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="items-center justify-center flex-1 px-4 bg-black/50">
        <Animated.View
          style={{
            transform: [{ scale: scaleAnim }],
          }}
          className="w-full max-w-sm p-6 bg-white rounded-2xl"
        >
          {/* Header */}
          <View className="items-center mb-4">
            <View className="items-center justify-center w-16 h-16 mb-3 bg-blue-100 rounded-full">
              <Feather name="info" size={24} color="#3B82F6" />
            </View>
            <Text className="text-xl font-bold text-center text-gray-800">
              {title}
            </Text>
          </View>

          {/* Message */}
          <Text className="mb-6 leading-5 text-center text-gray-600">
            {message}
          </Text>

          {/* Buttons */}
          <View className="space-y-3">
            {buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  button.onPress();
                  onClose();
                }}
                className={`py-3 px-4 rounded-xl mb-2 ${getButtonStyle(button.style)}`}
              >
                <Text className={`text-center font-semibold ${getButtonTextStyle(button.style)}`}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CustomAlert;
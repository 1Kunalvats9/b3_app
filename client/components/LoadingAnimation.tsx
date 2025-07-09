import React from 'react';
import { View, Text } from 'react-native';
import { Video } from 'expo-av';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = "Loading products..." 
}) => {
  return (
    <View className="flex-1 items-center justify-center py-8">
      <Video
        source={require('../assets/anims/loadingHand.webm')}
        style={{ width: 120, height: 120 }}
        shouldPlay
        isLooping
        resizeMode="contain"
      />
      <Text className="mt-4 text-gray-600 text-base font-medium">
        {message}
      </Text>
    </View>
  );
};

export default LoadingAnimation;
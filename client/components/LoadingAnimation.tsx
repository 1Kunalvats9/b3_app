import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native'; // Import ActivityIndicator

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({ 
  message = "Loading products..." 
}) => {
  return (
    <View className="items-center justify-center flex-1 py-8">
      {/* Replaced VideoView with ActivityIndicator */}
      <ActivityIndicator size="large" color="#6B46C1" /> {/* Example color: purple-600 */}
    </View>
  );
};

export default LoadingAnimation;
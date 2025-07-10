import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AdminProducts = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Text className="text-xl font-bold text-center text-gray-800">Products Management</Text>
      </View>
      
      <View className="items-center justify-center flex-1">
        <Text className="text-lg text-gray-600">Products management coming soon...</Text>
      </View>
    </SafeAreaView>
  );
};

export default AdminProducts;
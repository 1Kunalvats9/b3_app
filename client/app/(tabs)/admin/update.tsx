import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo'; 

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

const UpdateScreen = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const { getToken } = useAuth();

  const handleMigrateProducts = async () => {
    setIsMigrating(true);
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Authentication Error', 'Could not retrieve authentication token. Please log in again.');
        setIsMigrating(false);
        return;
      }
      const migrationUrl = `${BACKEND_BASE_URL}/api/migrate/migrate-products`; 

      const response = await fetch(migrationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, 
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Migration Success', data.message);
      } else {
        const errorMessage = data.message || `Failed to migrate products. Status: ${response.status}`;
        Alert.alert('Migration Failed', errorMessage);
        console.error('Migration API Error:', data);
      }
    } catch (error: any) {
      console.error('Error during migration request:', error);
      Alert.alert('Migration Error', error.message || 'An unexpected error occurred during migration.');
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <SafeAreaView className="items-center justify-center flex-1 bg-gray-50">
      <View className="items-center p-6 bg-white rounded-lg shadow-md">
        <Text className="mb-4 text-xl font-bold text-gray-800">Product Database Update</Text>
        <Text className="mb-6 text-base text-center text-gray-600">
          Click the button below to synchronize products from your old database to the current one.
          This will update existing product stock/prices and add new products.
        </Text>
        <TouchableOpacity
          onPress={handleMigrateProducts}
          disabled={isMigrating}
          className={`px-6 py-3 rounded-lg flex-row items-center justify-center ${
            isMigrating ? 'bg-blue-300' : 'bg-blue-500'
          }`}
        >
          {isMigrating ? (
            <>
              <ActivityIndicator size="small" color="white" className="mr-2" />
              <Text className="text-base font-semibold text-white">Migrating Products...</Text>
            </>
          ) : (
            <Text className="text-base font-semibold text-white">Start Product Migration</Text>
          )}
        </TouchableOpacity>
        <Text className="mt-4 text-xs text-center text-gray-400">
          This operation requires admin privileges and may take some time depending on data volume.
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default UpdateScreen;

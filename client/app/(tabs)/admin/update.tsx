import { View, Text, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';

const BACKEND_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:3000';

const UpdateScreen = () => {
  const [isMigrating, setIsMigrating] = useState(false);
  const [isFixingKeys, setIsFixingKeys] = useState(false);
  const [isCategorizingAI, setIsCategorizingAI] = useState(false);
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

  const handleFixDuplicateKeys = async () => {
    setIsFixingKeys(true);
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Authentication Error', 'Could not retrieve authentication token. Please log in again.');
        setIsFixingKeys(false);
        return;
      }

      const fixKeysUrl = `${BACKEND_BASE_URL}/api/migrate/fix-duplicate-keys`;

      const response = await fetch(fixKeysUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Fix Keys Success', data.message);
      } else {
        const errorMessage = data.message || `Failed to fix duplicate keys. Status: ${response.status}`;
        Alert.alert('Fix Keys Failed', errorMessage);
        console.error('Fix Keys API Error:', data);
      }
    } catch (error: any) {
      console.error('Error during fix keys request:', error);
      Alert.alert('Fix Keys Error', error.message || 'An unexpected error occurred during key fixing.');
    } finally {
      setIsFixingKeys(false);
    }
  };

  const handleAICategorization = async () => {
    setIsCategorizingAI(true);
    try {
      const token = await getToken();

      if (!token) {
        Alert.alert('Authentication Error', 'Could not retrieve authentication token. Please log in again.');
        setIsCategorizingAI(false);
        return;
      }

      const aiCategorizeUrl = `${BACKEND_BASE_URL}/api/migrate/ai-categorize`;

      const response = await fetch(aiCategorizeUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('AI Categorization Success', data.message);
      } else {
        const errorMessage = data.message || `Failed to categorize products. Status: ${response.status}`;
        Alert.alert('AI Categorization Failed', errorMessage);
        console.error('AI Categorization API Error:', data);
      }
    } catch (error: any) {
      console.error('Error during AI categorization request:', error);
      Alert.alert('AI Categorization Error', error.message || 'An unexpected error occurred during categorization.');
    } finally {
      setIsCategorizingAI(false);
    }
  };

  const updateActions = [
    {
      title: 'Product Database Migration',
      description: 'Synchronize products from your old database to the current one. This will update existing product stock/prices and add new products.',
      buttonText: 'Start Product Migration',
      loadingText: 'Migrating Products...',
      isLoading: isMigrating,
      onPress: handleMigrateProducts,
      icon: 'database',
      color: 'bg-blue-500',
    },
    {
      title: 'Fix Duplicate Keys',
      description: 'Fix duplicate key issues in the product database that may cause rendering errors in the home screen.',
      buttonText: 'Fix Duplicate Keys',
      loadingText: 'Fixing Keys...',
      isLoading: isFixingKeys,
      onPress: handleFixDuplicateKeys,
      icon: 'key',
      color: 'bg-green-500',
    },
    {
      title: 'AI Product Categorization',
      description: 'Automatically categorize products using AI. Items will be sorted into categories like snacks, beverages, etc. Weight-based items (kg, grams, liters) will be marked as loose items.',
      buttonText: 'Start AI Categorization',
      loadingText: 'Categorizing Products...',
      isLoading: isCategorizingAI,
      onPress: handleAICategorization,
      icon: 'cpu',
      color: 'bg-purple-500',
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Text className="text-xl font-bold text-center text-gray-800">Database Updates</Text>
        <Text className="mt-1 text-sm text-center text-gray-500">
          Manage and update your product database
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {updateActions.map((action, index) => (
          <View key={index} className="p-6 mb-4 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <View className="flex-row items-start mb-4">
              <View className={`w-12 h-12 ${action.color} rounded-xl items-center justify-center mr-4`}>
                <Feather name={action.icon as any} size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-800 mb-2">{action.title}</Text>
                <Text className="text-sm text-gray-600 leading-5">{action.description}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={action.onPress}
              disabled={action.isLoading}
              className={`px-6 py-4 rounded-xl flex-row items-center justify-center ${
                action.isLoading ? 'bg-gray-300' : action.color
              }`}
            >
              {action.isLoading ? (
                <>
                  <ActivityIndicator size="small" color="white" className="mr-3" />
                  <Text className="text-base font-semibold text-white">{action.loadingText}</Text>
                </>
              ) : (
                <>
                  <Feather name="play" size={18} color="white" className="mr-3" />
                  <Text className="text-base font-semibold text-white">{action.buttonText}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}

        {/* Warning Section */}
        <View className="p-4 mt-6 border border-yellow-200 bg-yellow-50 rounded-xl">
          <View className="flex-row items-start">
            <Feather name="alert-triangle" size={20} color="#F59E0B" />
            <View className="flex-1 ml-3">
              <Text className="font-semibold text-yellow-800 mb-1">Important Notes</Text>
              <Text className="text-sm text-yellow-700 leading-5">
                • These operations require admin privileges and may take some time depending on data volume.{'\n'}
                • Always backup your data before running migration operations.{'\n'}
                • AI categorization will overwrite existing categories for uncategorized items.{'\n'}
                • Fix duplicate keys should be run if you see rendering errors on the home screen.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UpdateScreen;
import { FlatList, Text, TextInput, View, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Feather } from '@expo/vector-icons';
import CategoryScroll from '@/components/CategoryScroll';
import ProductCard from '@/components/ProductCard';
import { useNavigation } from '@react-navigation/native';
import { Redirect } from 'expo-router';
const home = () => {
  const { products, loading, fetchProducts, pagination } = useProducts();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation<any>();
  
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: 1
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts({
      search: searchQuery || undefined,
      category: selectedCategory || undefined,
      page: 1
    });
    setRefreshing(false);
  }, [selectedCategory]);

  const handleLoadMore = () => {
    if (!loading && pagination?.hasNext) {
      fetchProducts({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: (pagination?.currentPage || 0) + 1
      });
    }
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={{ width: '48%' }}>
      <ProductCard product={item} />
    </View>
  );

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      {/* Header with Cart */}
      <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">B3</Text>
        <TouchableOpacity
          className="relative p-2"
          activeOpacity={0.7}
          onPress={() => navigation.navigate('cart')}
        >
          <Feather name="shopping-cart" size={24} color="#374151" />
          {totalItems > 0 && (
            <View className="absolute -top-1 -right-1 bg-green-500 rounded-full min-w-[20px] h-5 items-center justify-center">
              <Text className="text-xs font-bold text-white">
                {totalItems > 99 ? '99+' : totalItems}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      <View className='flex items-center px-2 mt-4'>
        <View className='flex flex-row items-center w-full gap-2 px-4 py-2 border border-gray-200 rounded-full bg-gray-50'>
          <Feather name='search' size={20} color='#9ca3af' />
          <TextInput
            placeholder='Search for products'
            placeholderTextColor={"#9ca3af"}
            className='flex-1 text-black'
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name='x' size={20} color='#9ca3af' />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <CategoryScroll
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#10B981']}
            tintColor="#10B981"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          flexGrow: 1,
          paddingBottom: 20,
          marginTop:6,
        }}
      />
    </SafeAreaView>
  );
};

export default home
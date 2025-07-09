import { FlatList, Text, TextInput, View, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Feather } from '@expo/vector-icons';
import CategoryScroll from '@/components/CategoryScroll';
import ProductCard from '@/components/ProductCard';
import LoadingAnimation from '@/components/LoadingAnimation';
const home = () => {
  const { signOut } = useAuth();
  const { products, loading, fetchProducts, pagination } = useProducts();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts({
        search: searchQuery || undefined,
        category: selectedCategory || undefined,
        page: 1
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedCategory]);

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
  }, [searchQuery, selectedCategory]);

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

  const renderHeader = () => (
    <>
      {/* Search Bar */}
      <View className='flex flex-row items-center w-full gap-2 px-4 py-3 mx-4 mb-2 border border-gray-200 rounded-full bg-gray-50'>
        <Feather name='search' size={20} color='#9ca3af' />
        <TextInput 
          placeholder='Search for products' 
          placeholderTextColor={"#9ca3af"} 
          className='flex-1 text-base text-black' 
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Feather name='x' size={20} color='#9ca3af' />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Scroll */}
      <CategoryScroll 
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      {/* Results Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-lg font-bold text-gray-800">
          {selectedCategory ? `${selectedCategory} Products` : 'All Products'}
        </Text>
        {pagination && (
          <Text className="text-sm text-gray-500">
            {pagination.totalItems} items
          </Text>
        )}
      </View>
    </>
  );

  const renderFooter = () => {
    if (!loading || products.length === 0) return null;
    
    return (
      <View className="py-4">
        <LoadingAnimation message="Loading more products..." />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading && products.length === 0) {
      return <LoadingAnimation />;
    }

    return (
      <View className="items-center justify-center flex-1 py-8">
        <Feather name="search" size={64} color="#D1D5DB" />
        <Text className="mt-4 text-lg font-medium text-gray-500">
          No products found
        </Text>
        <Text className="px-8 mt-2 text-sm text-center text-gray-400">
          {searchQuery 
            ? `No results for "${searchQuery}"`
            : selectedCategory 
              ? `No products in ${selectedCategory} category`
              : "No products available"
          }
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      {/* Header with Cart */}
      <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">Fresh Market</Text>
        <TouchableOpacity 
          className="relative p-2"
          activeOpacity={0.7}
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

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
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
          paddingBottom: 20
        }}
      />
    </SafeAreaView>
  );
};

export default home
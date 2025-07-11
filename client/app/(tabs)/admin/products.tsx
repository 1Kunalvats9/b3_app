import { FlatList, Text, TextInput, View, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useEffect, useState, useCallback, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProducts } from '@/hooks/useProducts';
import { Feather } from '@expo/vector-icons';
import CategoryScroll from '@/components/CategoryScroll';
import ProductCard from '@/components/ProductCard';
import { useNavigation } from '@react-navigation/native';
import EditProductModal from '@/components/EditProductModal';
import type { Product } from '@/hooks/useProducts';

const AdminProductScreen = () => {
  const { products, loading, error, fetchProducts, pagination } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const navigation = useNavigation<any>();

  const searchSubmitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (searchSubmitTimeoutRef.current) {
      clearTimeout(searchSubmitTimeoutRef.current);
    }

    searchSubmitTimeoutRef.current = setTimeout(() => {
      fetchProducts({
        search: activeSearchQuery || undefined,
        category: selectedCategory || undefined,
        page: 1,
        // Assuming default sortBy/sortOrder from useProducts store if not explicitly set here
      });
    }, 500);

    return () => {
      if (searchSubmitTimeoutRef.current) {
        clearTimeout(searchSubmitTimeoutRef.current);
      }
    };
  }, [activeSearchQuery, selectedCategory, fetchProducts]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setActiveSearchQuery(""); // Clear search when category changes
    setSearchQuery(""); // Clear search input
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
  };

  const handleSearchSubmit = () => {
    setActiveSearchQuery(searchQuery);
    setSelectedCategory(null); // Clear category when submitting a search
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts({
      search: activeSearchQuery || undefined,
      category: selectedCategory || undefined,
      page: 1,
    });
    setRefreshing(false);
  }, [activeSearchQuery, selectedCategory, fetchProducts]);

  const handleLoadMore = () => {
    if (!loading && pagination?.hasNext) {
      fetchProducts({
        search: activeSearchQuery || undefined,
        category: selectedCategory || undefined,
        page: (pagination?.currentPage || 0) + 1,
      });
    }
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setSelectedProduct(null);
    fetchProducts({ // Re-fetch products to ensure updates are reflected
      search: activeSearchQuery || undefined,
      category: selectedCategory || undefined,
      page: pagination?.currentPage || 1, // Stay on current page, or go to 1 if no page info
    });
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={{ width: '48%' }}>
      <ProductCard product={item} isAdmin={true} onEdit={handleEditProduct} />
    </View>
  );

  const renderFooter = () => {
    if (loading) {
      return (
        <View className="py-4">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      );
    }
    if (!pagination?.hasNext && products.length > 0 && !loading) {
      return (
        <View className="items-center py-4">
          <Text className="text-sm text-gray-500">No more products to load.</Text>
        </View>
      );
    }
    return null;
  };

  if (loading && products.length === 0) {
    return (
      <SafeAreaView className='items-center justify-center flex-1 bg-gray-50'>
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-2 text-gray-600">Loading products...</Text>
      </SafeAreaView>
    );
  }

  if (error && products.length === 0) {
    return (
      <SafeAreaView className='items-center justify-center flex-1 bg-gray-50'>
        <Feather name="alert-triangle" size={48} color="#EF4444" />
        <Text className="mt-4 text-lg font-bold text-center text-red-500">Error Loading Products</Text>
        <Text className="px-4 mt-2 text-center text-gray-600">{error}</Text>
        <TouchableOpacity onPress={handleRefresh} className="px-4 py-2 mt-4 bg-blue-500 rounded-lg">
          <Text className="font-semibold text-white">Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className='flex-1 bg-gray-50'>
      <View className="flex-row items-center justify-between px-4 py-2 bg-white border-b border-gray-100">
        <Text className="text-xl font-bold text-gray-800">Admin Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate('admin/add-product')} className="px-3 py-1 bg-green-500 rounded-lg">
          <Text className="font-semibold text-white">Add New</Text>
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
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <View className="flex-row items-center space-x-2">
              <TouchableOpacity onPress={handleSearchSubmit} className="p-1">
                <Feather name='search' size={18} color='#10B981' />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearSearch} className="p-1">
                <Feather name='x' size={18} color='#EF4444' />
              </TouchableOpacity>
            </View>
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
        keyExtractor={(item) => item.id}
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
          marginTop: 6,
        }}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          !loading && products.length === 0 && !error ? (
            <View className="items-center py-10">
              <Feather name="box" size={48} color="#9CA3AF" />
              <Text className="mt-4 text-lg text-gray-500">No products found.</Text>
              <Text className="text-sm text-gray-400">
                Try adjusting your search or filters.
              </Text>
            </View>
          ) : null
        }
      />
      <EditProductModal
        visible={showEditModal}
        product={selectedProduct}
        onClose={handleCloseModal}
        onProductUpdated={handleCloseModal} // This will re-fetch products after update
      />
    </SafeAreaView>
  );
};

export default AdminProductScreen;
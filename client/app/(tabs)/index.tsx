import { FlatList, Text, TextInput, View, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useProducts } from '@/hooks/useProducts'; // Updated import
import { useCart } from '@/hooks/useCart';
import { Feather } from '@expo/vector-icons';
import CategoryScroll from '@/components/CategoryScroll';
import ProductCard from '@/components/ProductCard';
import { useNavigation } from '@react-navigation/native';

const home = () => {
  // Destructure the new states and functions from useProducts
  const { products, pagination, loading, error, fetchProducts, fetchSearchSuggestions, searchSuggestions, refreshProducts } = useProducts();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState(""); // This will drive the main product list filter
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  // `searchResults` state is no longer needed; `searchSuggestions` from store will be used.
  // const [searchResults, setSearchResults] = useState<any[]>([]); // REMOVE THIS LINE
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const navigation = useNavigation<any>();

  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial fetch when component mounts or filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts({
        search: activeSearchQuery || undefined,
        category: selectedCategory || undefined,
        page: 1, // Always reset to page 1 when filters or search changes
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price' ? 'discountedPrice' : 'name',
        sortOrder: sortOrder
      });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, activeSearchQuery, sortBy, sortOrder, fetchProducts]);

  // Effect for search suggestions (using backend API)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      searchTimeoutRef.current = setTimeout(() => {
        fetchSearchSuggestions(searchQuery); // Call backend for suggestions
        setShowSearchResults(true);
      }, 300); // Debounce for search suggestions
    } else {
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, fetchSearchSuggestions]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setActiveSearchQuery(""); // Clear main search when category is selected
    setSearchQuery(""); // Clear search input
    setShowSearchResults(false);
    // fetchProducts is triggered by useEffect on activeSearchQuery/selectedCategory change
  };

  const handleSearchSubmit = () => {
    setActiveSearchQuery(searchQuery); // Apply the search query to the main product list
    setSelectedCategory(null); // Clear category filter when submitting a search
    setShowSearchResults(false);
    // fetchProducts is triggered by useEffect on activeSearchQuery change
  };

  const handleSearchResultSelect = (productName: string) => {
    setSearchQuery(productName);
    setActiveSearchQuery(productName); // Set active search from suggestion
    setSelectedCategory(null);
    setShowSearchResults(false);
    // fetchProducts is triggered by useEffect on activeSearchQuery change
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setShowSearchResults(false);
    // fetchProducts is triggered by useEffect on activeSearchQuery change
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts({
      search: activeSearchQuery || undefined,
      category: selectedCategory || undefined,
      page: 1, // Always refresh from page 1
      sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price' ? 'discountedPrice' : 'name',
      sortOrder: sortOrder
    });
    setRefreshing(false);
  }, [activeSearchQuery, selectedCategory, sortBy, sortOrder, fetchProducts]);


  const handleLoadMore = () => {
    if (!loading && pagination?.hasNext) {
      fetchProducts({
        search: activeSearchQuery || undefined,
        category: selectedCategory || undefined,
        page: (pagination?.currentPage || 0) + 1,
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price' ? 'discountedPrice' : 'name',
        sortOrder: sortOrder
      });
    }
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width: '48%' }}>
      <ProductCard product={item} key={`${item._id}-${index}`} />
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

  // Initial loading state when products array is empty
  if (loading && products.length === 0) {
    return (
      <SafeAreaView className='items-center justify-center flex-1 bg-gray-50'>
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="mt-2 text-gray-600">Loading products...</Text>
      </SafeAreaView>
    );
  }

  // Error state if initial load failed
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

      <View className='px-4 mt-4 space-y-3'>
        <View className='relative'>
          <View className='flex flex-row items-center w-full gap-3 px-4 py-3 border border-gray-200 rounded-full bg-gray-50'>
            <Feather name='search' size={20} color='#9ca3af' />
            <TextInput
              placeholder='Search for products'
              placeholderTextColor={"#9ca3af"}
              className='flex-1 text-black'
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <View className="flex-row items-center space-x-3">
                <TouchableOpacity onPress={handleSearchSubmit} className="p-1">
                  <Feather name='search' size={18} color='#10B981' />
                </TouchableOpacity>
                <TouchableOpacity onPress={clearSearch} className="p-1">
                  <Feather name='x' size={18} color='#EF4444' />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {showSearchResults && searchSuggestions.length > 0 && (
            <View className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 shadow-lg top-full rounded-xl max-h-80">
              <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-sm font-semibold text-gray-600">
                  {searchSuggestions.length} result{searchSuggestions.length !== 1 ? 's' : ''} found
                </Text>
              </View>
              <FlatList
                data={searchSuggestions} // Use searchSuggestions from the store
                keyExtractor={(item, index) => `search-${item._id}-${index}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handleSearchResultSelect(item.name)}
                    className={`px-4 py-3 flex-row items-center justify-between ${
                      index !== searchSuggestions.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="items-center justify-center w-8 h-8 mr-3 bg-gray-100 rounded-lg">
                        <Feather name="package" size={14} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-gray-800" numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text className="text-xs text-gray-500 capitalize">
                          {item.category}
                        </Text>
                      </View>
                    </View>
                    <View className="items-end">
                      <Text className="text-sm font-bold text-green-600">
                        ₹{item.discountedPrice}
                      </Text>
                      {item.originalPrice > item.discountedPrice && (
                        <Text className="text-xs text-gray-400 line-through">
                          ₹{item.originalPrice}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                style={{ maxHeight: 240 }}
              />
            </View>
          )}

          {showSearchResults && searchQuery.length > 0 && searchSuggestions.length === 0 && (
            <View className="absolute left-0 right-0 z-50 mt-2 bg-white border border-gray-200 shadow-lg top-full rounded-xl">
              <View className="items-center px-4 py-6">
                <Feather name="search" size={32} color="#9CA3AF" />
                <Text className="mt-2 text-center text-gray-500">
                  No products found for "{searchQuery}"
                </Text>
                <Text className="mt-1 text-sm text-center text-gray-400">
                  Try searching with different keywords
                </Text>
              </View>
            </View>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {(activeSearchQuery || selectedCategory) && (
              <Text className="text-sm text-gray-600">
                {activeSearchQuery ? `Searching for "${activeSearchQuery}"` : `Category: ${selectedCategory}`}
                {pagination?.totalItems !== undefined && ` (${pagination.totalItems} items)`}
              </Text>
            )}
          </View>
        </View>
      </View>

      <CategoryScroll
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
      />

      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item, index) => `${item._id}-${index}`}
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
    </SafeAreaView>
  );
};

export default home;
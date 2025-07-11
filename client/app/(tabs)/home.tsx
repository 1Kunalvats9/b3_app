import { FlatList, Text, TextInput, View, TouchableOpacity, RefreshControl } from 'react-native'
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@clerk/clerk-expo';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Feather } from '@expo/vector-icons';
import CategoryScroll from '@/components/CategoryScroll';
import ProductCard from '@/components/ProductCard';
import { useNavigation } from '@react-navigation/native';

const home = () => {
  const { products, loading, fetchProducts, pagination } = useProducts();
  const { totalItems } = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'newest'>('newest');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const navigation = useNavigation<any>();
  
  // Use ref to store the debounce timeout
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize filtered search results for better performance
  const filteredSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    return products
      .filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      )
      .slice(0, 8) // Increased from 5 to 8 for better UX
      .sort((a, b) => {
        // Prioritize exact matches and name starts
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        if (aName.startsWith(query) && !bName.startsWith(query)) return -1;
        if (!aName.startsWith(query) && bName.startsWith(query)) return 1;
        
        return aName.localeCompare(bName);
      });
  }, [searchQuery, products]);

  // Optimized search effect with faster debounce
  useEffect(() => {
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim().length > 0) {
      // Immediate update for better responsiveness
      setSearchResults(filteredSearchResults);
      setShowSearchResults(true);
      
      // Very short debounce for real-time feel
      searchTimeoutRef.current = setTimeout(() => {
        setSearchResults(filteredSearchResults);
      }, 100); // Reduced from 300ms to 100ms
    } else {
      setShowSearchResults(false);
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filteredSearchResults, searchQuery]);

  // Fetch products when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts({
        search: activeSearchQuery || undefined,
        category: selectedCategory || undefined,
        page: 1,
        sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price' ? 'discountedPrice' : 'name',
        sortOrder: sortOrder
      });
    }, 300); // Keep this timeout for actual API calls

    return () => clearTimeout(timeoutId);
  }, [selectedCategory, activeSearchQuery, sortBy, sortOrder]);

  const handleCategorySelect = (category: string | null) => {
    setSelectedCategory(category);
    setActiveSearchQuery("");
    setSearchQuery("");
    setShowSearchResults(false);
  };

  const handleSearchSubmit = () => {
    setActiveSearchQuery(searchQuery);
    setSelectedCategory(null);
    setShowSearchResults(false);
  };

  const handleSearchResultSelect = (productName: string) => {
    setSearchQuery(productName);
    setActiveSearchQuery(productName);
    setSelectedCategory(null);
    setShowSearchResults(false);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearchQuery("");
    setShowSearchResults(false);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProducts({
      search: activeSearchQuery || undefined,
      category: selectedCategory || undefined,
      page: 1,
      sortBy: sortBy === 'newest' ? 'createdAt' : sortBy === 'price' ? 'discountedPrice' : 'name',
      sortOrder: sortOrder
    });
    setRefreshing(false);
  }, [selectedCategory, activeSearchQuery, sortBy, sortOrder]);

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

  const sortOptions = [
    { key: 'newest', label: 'Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
    { key: 'oldest', label: 'Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
    { key: 'price-low', label: 'Price: Low to High', sortBy: 'discountedPrice', sortOrder: 'asc' },
    { key: 'price-high', label: 'Price: High to Low', sortBy: 'discountedPrice', sortOrder: 'desc' },
    { key: 'name-az', label: 'Name: A to Z', sortBy: 'name', sortOrder: 'asc' },
    { key: 'name-za', label: 'Name: Z to A', sortBy: 'name', sortOrder: 'desc' },
  ];

  const handleSortSelect = (option: any) => {
    setSortBy(option.sortBy);
    setSortOrder(option.sortOrder);
    setShowSortOptions(false);
  };

  const getCurrentSortLabel = () => {
    const current = sortOptions.find(option => 
      option.sortBy === (sortBy === 'newest' ? 'createdAt' : sortBy === 'price' ? 'discountedPrice' : 'name') && 
      option.sortOrder === sortOrder
    );
    return current?.label || 'Sort';
  };

  const renderProduct = ({ item, index }: { item: any; index: number }) => (
    <View style={{ width: '48%' }}>
      <ProductCard product={item} key={`${item._id}-${index}`} />
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

      {/* Search and Sort Section */}
      <View className='px-4 mt-4 space-y-3'>
        {/* Search Bar */}
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

          {/* Enhanced Search Results Dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <View className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-80">
              <View className="px-4 py-3 border-b border-gray-100">
                <Text className="text-sm font-semibold text-gray-600">
                  {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                </Text>
              </View>
              <FlatList
                data={searchResults}
                keyExtractor={(item, index) => `search-${item._id}-${index}`}
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handleSearchResultSelect(item.name)}
                    className={`px-4 py-3 flex-row items-center justify-between ${
                      index !== searchResults.length - 1 ? 'border-b border-gray-50' : ''
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-1 flex-row items-center">
                      <View className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center mr-3">
                        <Feather name="package" size={14} color="#9CA3AF" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium" numberOfLines={1}>
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

          {/* No Results Message */}
          {showSearchResults && searchQuery.length > 0 && searchResults.length === 0 && (
            <View className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50">
              <View className="px-4 py-6 items-center">
                <Feather name="search" size={32} color="#9CA3AF" />
                <Text className="text-gray-500 mt-2 text-center">
                  No products found for "{searchQuery}"
                </Text>
                <Text className="text-gray-400 text-sm mt-1 text-center">
                  Try searching with different keywords
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Sort Options */}
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            {(activeSearchQuery || selectedCategory) && (
              <Text className="text-sm text-gray-600">
                {activeSearchQuery ? `Searching for "${activeSearchQuery}"` : `Category: ${selectedCategory}`}
                {products.length > 0 && ` (${products.length} items)`}
              </Text>
            )}
          </View>
          
          <View className="relative">
            <TouchableOpacity
              onPress={() => setShowSortOptions(!showSortOptions)}
              className="flex-row items-center px-3 py-2 bg-white border border-gray-200 rounded-lg"
            >
              <Feather name="filter" size={16} color="#6B7280" />
              <Text className="ml-2 text-sm text-gray-700">{getCurrentSortLabel()}</Text>
              <Feather name="chevron-down" size={16} color="#6B7280" />
            </TouchableOpacity>

            {showSortOptions && (
              <View className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-40 min-w-[200px]">
                {sortOptions.map((option, index) => (
                  <TouchableOpacity
                    key={option.key}
                    onPress={() => handleSortSelect(option)}
                    className={`px-4 py-3 ${index !== sortOptions.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <Text className="text-gray-800">{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
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
      />
    </SafeAreaView>
  );
};

export default home
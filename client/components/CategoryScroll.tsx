import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import { useCategory } from '@/hooks/useCategories'; 
import { useProducts } from '@/hooks/useProducts'; 
import { Feather } from '@expo/vector-icons';

interface CategoryScrollProps {
    selectedCategory: string | null;
    onCategorySelect: (category: string | null) => void;
}

const CategoryScroll: React.FC<CategoryScrollProps> = ({ selectedCategory, onCategorySelect }) => {
    const { categories, loading, getCategories } = useCategory();
    const { loading: productsLoading } = useProducts(); 
    useEffect(() => {
        getCategories(); 
    }, [getCategories]);

    if (loading) {
        return (
            <View className="items-center justify-center py-4">
                <ActivityIndicator size="small" color="#000" />
                <Text className="mt-2 text-sm text-gray-700">Loading categories...</Text>
            </View>
        );
    }

    // --- Empty Categories State ---
    // Show message if no categories are found after loading
    if (categories.length === 0) {
        return (
            <View className="items-center justify-center py-4">
                <Text className="text-base text-gray-500">No categories available.</Text>
            </View>
        );
    }

    // --- Render Categories ---
    return (
        <View className="mt-4 bg-transparent">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                className="flex-grow-0"
            >
                {/* "All" Category Button */}
                <TouchableOpacity
                    onPress={() => onCategorySelect(null)}
                    activeOpacity={0.7}
                    className={`px-4 py-2 mr-3 rounded-full border min-w-[80px] h-10 items-center justify-center flex-row ${
                        selectedCategory === null
                            ? 'bg-green-500 border-green-500'
                            : 'bg-white border-gray-300'
                    }`}
                >
                    <Feather 
                        name="grid" 
                        size={16} 
                        color={selectedCategory === null ? 'white' : '#6B7280'} 
                        style={{ marginRight: 4 }}
                    />
                    <Text
                        className={`font-medium text-sm ${
                            selectedCategory === null ? 'text-white' : 'text-gray-600'
                        }`}
                    >
                        All
                    </Text>
                </TouchableOpacity>

                {/* Dynamically Render Fetched Categories */}
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id} // Ensure category.id is unique (e.g., if you mapped name to id)
                        onPress={() => onCategorySelect(category.name)}
                        activeOpacity={0.7}
                        className={`px-4 py-2 mr-3 rounded-full border min-w-[70px] h-10 items-center justify-center ${
                            selectedCategory === category.name
                                ? 'bg-green-500 border-green-500'
                                : 'bg-white border-gray-300'
                        }`}
                    >
                        <Text
                            className={`font-medium text-sm text-center ${
                                selectedCategory === category.name ? 'text-white' : 'text-gray-600'
                            }`}
                            numberOfLines={1}
                        >
                            {category.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default CategoryScroll;
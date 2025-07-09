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

    if (categories.length === 0) {
        return (
            <View className="items-center justify-center py-4">
                <Text className="text-base text-gray-500">No categories available.</Text>
            </View>
        );
    }

    return (
        <View className="mt-4 bg-transparent">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
                className="flex-grow-0"
            >
                {/* All Products Button */}
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

                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id}
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
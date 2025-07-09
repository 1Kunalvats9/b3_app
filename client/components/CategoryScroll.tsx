import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { useEffect } from 'react';
import { useCategory } from '@/hooks/useCategories';
import { useAuth } from '@clerk/clerk-expo';

const CategoryScroll = () => {
    const { categories, loading, getCategories } = useCategory();
    const { isLoaded } = useAuth();

    useEffect(() => {
        if (isLoaded) {
            getCategories();
        }
    }, [getCategories, isLoaded]);

    if (!isLoaded || loading) {
        return (
            <View className="items-center justify-center flex-1 py-5">
                <ActivityIndicator size="small" color="#000" />
                <Text className="mt-2 text-sm text-gray-700">Loading categories...</Text>
            </View>
        );
    }

    if (categories.length === 0) {
        return (
            <View className="items-center justify-center flex-1 py-5">
                <Text className="text-base text-gray-500">No categories available.</Text>
            </View>
        );
    }

    return (
        <View className="mt-2 bg-transparent border-b border-gray-100">
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerClassName="px-4 py-3 items-center" 
                className="flex-grow-0" 
            >
                {categories.map((category) => (
                    <TouchableOpacity
                        key={category.id} 
                        activeOpacity={0.7}
                        className={`px-4 py-2 mr-3 rounded-full border border-gray-600 bg-white min-w-[70px] h-9 items-center justify-center`} 
                    >
                        <Text
                            className={`font-medium text-sm text-gray-400 text-center`}
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
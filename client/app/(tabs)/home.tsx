import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useProducts } from '@/hooks/useProducts';
import { Feather } from '@expo/vector-icons';
import CategoryScroll from '@/components/CategoryScroll';
const home = () => {

  const {signOut} = useAuth();
  const {products,loading,fetchProducts} = useProducts();
  const [searchQuery, setsearchQuery] = useState("")

  return (
    <SafeAreaView className='items-center flex-1 px-4'>
      <View className='flex flex-row items-center w-full gap-1 px-4 py-2 border border-black rounded-full'>
      <Feather name='search' size={24} color='#9ca3af' />
      <TextInput placeholder='Search for products' placeholderTextColor={"#9ca3af"} className='flex-1 w-full text-black' onChangeText={text=>{
        setsearchQuery(text);
      }} />
      </View>
      <CategoryScroll />
    </SafeAreaView>
  );
};

export default home

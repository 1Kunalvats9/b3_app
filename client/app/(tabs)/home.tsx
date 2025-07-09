import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import { useProducts } from '@/hooks/useProducts';
const home = () => {

  const {signOut} = useAuth();
  const {products,loading,fetchProducts} = useProducts();

  return (
    <SafeAreaView>
      <Text>This is Home</Text>
      <Button title='Logout' onPress={()=>{
        signOut();
      }} />

      {
        products && (
          <FlatList 
          data={products}
          keyExtractor={products=>products._id}
          renderItem={({ item }) => <Text>{item.name}</Text>}
          />
        )
      }
      {
        loading && <ActivityIndicator size={'small'} color={"#000"} />
      }
      {
        products.length==0 && (
          <Text>No products available</Text>
        )
      }
      <Button title='Get Products' onPress={()=>{
        fetchProducts();
      }} />
    </SafeAreaView>
  );
};

export default home

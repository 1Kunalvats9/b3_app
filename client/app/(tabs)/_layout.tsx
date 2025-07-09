import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Tabs } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo'
import { Feather } from "@expo/vector-icons"
import { useCart } from '@/hooks/useCart'

const _layout = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const { totalItems } = useCart();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  
  if(!isSignedIn){
    return <Redirect href={"/(auth)"} />
  }
  
  return (
    <Tabs>
        <Tabs.Screen 
          name='home' 
          options={{
            headerShown: false,
            title: 'Home',
            tabBarIcon: ({ color, size }) => <Feather size={size} color={color} name='home' />,
            tabBarBadge: totalItems > 0 ? (totalItems > 99 ? '99+' : totalItems.toString()) : undefined,
          }} 
        />
        <Tabs.Screen 
          name='cart' 
          options={{
            headerShown: false,
            title: 'Cart',
            tabBarIcon: ({ color, size }) => <Feather size={size} color={color} name='shopping-cart' />,
            tabBarBadge: totalItems > 0 ? (totalItems > 99 ? '99+' : totalItems.toString()) : undefined,
          }} 
        />
        <Tabs.Screen
                name='admin'
                options={{
                    title: 'Admin',
                    tabBarIcon: ({ color, size }) => <Feather size={size} color={color} name='settings' />,
                    href: isAdmin ? '/(tabs)/admin' : null,
                }}
            />
    </Tabs>
  )
}

export default _layout
import { View, Text } from 'react-native'
import React from 'react'
import { Redirect, Tabs } from 'expo-router'
import { useAuth, useUser } from '@clerk/clerk-expo'
import {Feather} from "@expo/vector-icons"

const _layout = () => {
  const { isSignedIn } = useAuth();
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';
  if(!isSignedIn){
    return <Redirect href={"/(auth)"} />
  }
  return (
    <Tabs>
        <Tabs.Screen name='home' options={{headerShown:false}} />
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
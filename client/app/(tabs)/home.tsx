import { Alert, Button, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Redirect } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
const home = () => {

  const {signOut} = useAuth();
  const [isLoading, setIsLoading] = useState(false)
  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await signOut();
            } catch (error) {
              console.log("error",error)
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  return (
    <SafeAreaView>
      <Text>This is Home</Text>
      <Button title='Logout' onPress={()=>{
        signOut();
      }} />
    </SafeAreaView>
  );
};

export default home

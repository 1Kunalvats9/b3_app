import { Tabs } from 'expo-router';
import { useAuthRole } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Platform } from 'react-native';

export default function AdminLayout() {
  const { isAdmin } = useAuthRole();

  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#8B5CF6',
      tabBarInactiveTintColor: '#6B7280',
      tabBarStyle: {
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        elevation: 0,
        shadowOpacity: 0,
        zIndex: 1000,
      },
      tabBarHideOnKeyboard: Platform.OS === 'android',
    }}>
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Feather name="shopping-bag" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color, size }) => (
            <Feather name="package" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen 
        name='index'
        options={{
          title: 'Dashboard',
          tabBarIcon:({ color, size }) => (
            <Feather name="home" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
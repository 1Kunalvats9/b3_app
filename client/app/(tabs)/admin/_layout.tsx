import { Tabs } from 'expo-router';
import { useAuthRole } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

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
      },
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
        name="past-orders"
        options={{
          title: 'Past Orders',
          tabBarIcon: ({ color, size }) => (
            <Feather name="archive" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
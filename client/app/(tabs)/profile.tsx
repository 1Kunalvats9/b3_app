import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, RefreshControl, ActivityIndicator, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-expo';
import { Feather } from '@expo/vector-icons';
import { Redirect } from 'expo-router';

import CustomAlert from '@/components/CustomAlert';
import CustomToast from '@/components/CustomToast';
import { useProfile } from '@/hooks/useProfile';

const Profile = () => {
  const { signOut, isSignedIn, getToken } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const {
    profile,
    isProfileLoading,
    profileError,
    orders,
    isOrdersLoading,
    ordersError,
    ordersPagination,
    bcoinTransactions,
    isBcoinsLoading,
    bcoinsError,
    bcoinsPagination,
    fetchProfile,
    fetchOrders,
    fetchBcoinHistory,
    refreshAll,
    clearProfile,
  } = useProfile();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'orders' | 'bcoins'>('profile');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as Array<{text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive'}>
  });

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

  const showAlert = (title: string, message: string, buttons: Array<{text: string; onPress: () => void; style?: 'default' | 'cancel' | 'destructive'}>) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setToastConfig({
      visible: true,
      message,
      type
    });
    setTimeout(() => {
      setToastConfig(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Initial data fetch
  useEffect(() => {
    const initializeProfile = async () => {
      if (!isSignedIn) return;
      
      try {
        const token = await getToken();
        if (token) {
          console.log('Fetching profile with token...');
          await fetchProfile(token);
        }
      } catch (error) {
        console.error('Error initializing profile:', error);
      }
    };

    initializeProfile();
  }, [isSignedIn]);

  // Fetch data based on active tab
  useEffect(() => {
    const fetchTabData = async () => {
      try {
        const token = await getToken();
        if (!token) return;

        if (activeTab === 'orders' && orders.length === 0) {
          await fetchOrders(token);
        } else if (activeTab === 'bcoins' && bcoinTransactions.length === 0) {
          await fetchBcoinHistory(token);
        }
      } catch (error) {
        console.error('Error fetching tab data:', error);
      }
    };

    fetchTabData();
  }, [activeTab]);

  const handleSignOut = async () => {
    showAlert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setIsSigningOut(true);
            try {
              clearProfile();
              await signOut();
              showToast('Signed out successfully', 'success');
            } catch (error) {
              console.error('Sign out error:', error);
              showToast('Failed to sign out. Please try again.', 'error');
            } finally {
              setIsSigningOut(false);
            }
          },
        },
      ]
    );
  };

  const onRefreshControl = async () => {
    setIsRefreshing(true);
    try {
      const token = await getToken();
      if (token) {
        await refreshAll(token);
        showToast('Profile refreshed successfully', 'success');
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
      showToast('Failed to refresh profile', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const loadMoreOrders = async () => {
    if (!isOrdersLoading && ordersPagination.currentPage < ordersPagination.totalPages) {
      try {
        const token = await getToken();
        if (token) {
          await fetchOrders(token, ordersPagination.currentPage + 1);
        }
      } catch (error) {
        console.error('Error loading more orders:', error);
      }
    }
  };

  const loadMoreBcoins = async () => {
    if (!isBcoinsLoading && bcoinsPagination.currentPage < bcoinsPagination.totalPages) {
      try {
        const token = await getToken();
        if (token) {
          await fetchBcoinHistory(token, bcoinsPagination.currentPage + 1);
        }
      } catch (error) {
        console.error('Error loading more bcoins:', error);
      }
    }
  };

  if (!isSignedIn) {
    return <Redirect href="/(auth)" />;
  }

  const profileOptions = [
    {
      icon: 'user',
      title: 'Edit Profile',
      subtitle: 'Update your personal information',
      onPress: () => showToast('Profile editing will be available soon!', 'info'),
    },
    {
      icon: 'map-pin',
      title: 'Manage Addresses',
      subtitle: 'Add or edit delivery addresses',
      onPress: () => showToast('Address management will be available soon!', 'info'),
    },
    {
      icon: 'heart',
      title: 'Wishlist',
      subtitle: 'Your saved items',
      onPress: () => showToast('Wishlist feature will be available soon!', 'info'),
    },
    {
      icon: 'help-circle',
      title: 'Help & Support',
      subtitle: 'Get help and contact support',
      onPress: () => showToast('Help & support will be available soon!', 'info'),
    },
    {
      icon: 'info',
      title: 'About',
      subtitle: 'App version and information',
      onPress: () => showAlert('About B3 Store', 'Version 1.0.0\nBuilt with React Native & Expo\n\nA modern shopping experience for your daily needs.', [{ text: 'OK', onPress: () => {} }]),
    },
  ];

  const renderProfileContent = () => (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefreshControl} />
      }
    >
      {isProfileLoading ? (
        <View className="items-center justify-center py-20">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="mt-4 text-gray-600">Loading profile...</Text>
        </View>
      ) : profileError ? (
        <View className="items-center justify-center py-20">
          <Feather name="alert-triangle" size={48} color="#EF4444" />
          <Text className="mt-4 text-xl font-bold text-gray-800">Error loading profile</Text>
          <Text className="px-8 mt-2 text-center text-gray-500">{profileError}</Text>
        </View>
      ) : (
        <>
          <View className="p-8 mx-4 mt-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            <View className="items-center">
              <View className="relative">
                <Image
                  source={{
                    uri: clerkUser?.imageUrl || 'https://via.placeholder.com/120x120/8B5CF6/FFFFFF?text=U'
                  }}
                  className="border-4 border-purple-100 rounded-full w-28 h-28"
                />
                <TouchableOpacity className="absolute p-3 bg-purple-500 rounded-full shadow-lg -bottom-2 -right-2">
                  <Feather name="camera" size={18} color="white" />
                </TouchableOpacity>
              </View>
              <Text className="mt-6 text-2xl font-bold text-gray-800">
                {profile?.name || clerkUser?.fullName || 'User'}
              </Text>
              <Text className="mt-2 text-base text-gray-500">
                {profile?.email || clerkUser?.primaryEmailAddress?.emailAddress}
              </Text>
              {profile?.phone && (
                <Text className="mt-1 text-sm text-gray-500">
                  {profile.phone}
                </Text>
              )}

              <View className="mt-6">
                <View className="flex-row items-center px-4 py-2 bg-yellow-100 rounded-full">
                  <Feather name="star" size={20} color="#F59E0B" />
                  <Text className="ml-2 text-lg font-bold text-yellow-800">
                    {profile?.total_bcoins || 0} Coins
                  </Text>
                </View>
                <Text className="mt-3 text-sm text-center text-gray-500">
                  Earn 1 coin for every ₹100 spent • 1 coin = ₹2 discount
                </Text>
              </View>
            </View>
          </View>

          <View className="mx-4 mt-6 bg-white border border-gray-100 shadow-sm rounded-2xl">
            {profileOptions.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                onPress={option.onPress}
                className={`flex-row items-center p-5 ${
                  index !== profileOptions.length - 1 ? 'border-b border-gray-50' : ''
                }`}
              >
                <View className="items-center justify-center w-12 h-12 mr-4 bg-purple-50 rounded-xl">
                  <Feather name={option.icon as any} size={20} color="#8B5CF6" />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    {option.title}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-500">
                    {option.subtitle}
                  </Text>
                </View>
                <Feather name="chevron-right" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            disabled={isSigningOut}
            className="p-5 mx-4 mt-6 mb-8 bg-white border border-gray-100 shadow-sm rounded-2xl"
          >
            <View className="flex-row items-center justify-center">
              <Feather name="log-out" size={20} color="#EF4444" />
              <Text className="ml-3 text-lg font-bold text-red-500">
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </Text>
            </View>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );

  const renderOrderItem = ({ item }: { item: any }) => (
    <View className="p-4 mb-4 bg-white border border-gray-100 shadow-sm rounded-xl">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-lg font-bold text-gray-800">Order #{item.id.substring(0, 8)}</Text>
        <Text className={`font-semibold text-sm ${
          item.status === 'delivered' ? 'text-green-600' :
          item.status === 'cancelled' ? 'text-red-600' :
          'text-yellow-600'
        }`}>
          {item.status.replace(/_/g, ' ').charAt(0).toUpperCase() + item.status.replace(/_/g, ' ').slice(1)}
        </Text>
      </View>
      <Text className="mb-1 text-gray-600">Total: ₹{item.total_amount.toFixed(2)}</Text>
      <Text className="mb-1 text-sm text-gray-500">Items: {item.items.length}</Text>
      {item.bcoins_used > 0 && (
        <Text className="mb-1 text-sm text-yellow-600">Bcoins Used: {item.bcoins_used}</Text>
      )}
      <Text className="text-xs text-gray-500">
        Date: {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

  const renderOrdersContent = () => (
    <View className="flex-1">
      {isOrdersLoading && orders.length === 0 ? (
        <View className="items-center justify-center flex-1 py-20">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="mt-4 text-gray-600">Loading your orders...</Text>
        </View>
      ) : ordersError ? (
        <View className="items-center justify-center flex-1 py-20">
          <Feather name="alert-triangle" size={32} color="#EF4444" />
          <Text className="mt-4 mb-2 text-xl font-bold text-gray-800">Error loading orders</Text>
          <Text className="px-8 text-center text-gray-500">{ordersError}</Text>
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefreshControl} />
          }
          onEndReached={loadMoreOrders}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={() => (
            <View className="p-4 mb-6 bg-blue-50 rounded-xl">
              <Text className="mb-1 text-base font-semibold text-blue-800">Order History</Text>
              <Text className="text-sm text-blue-600">
                {ordersPagination.totalItems} order{ordersPagination.totalItems !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}
          ListFooterComponent={() => 
            isOrdersLoading ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : null
          }
        />
      ) : (
        <View className="items-center justify-center flex-1 py-20">
          <View className="items-center justify-center w-24 h-24 mb-4 bg-gray-100 rounded-full">
            <Feather name="shopping-bag" size={32} color="#9CA3AF" />
          </View>
          <Text className="mb-2 text-xl font-bold text-gray-800">No orders yet</Text>
          <Text className="px-8 text-center text-gray-500">
            Your order history will appear here once you place your first order
          </Text>
        </View>
      )}
    </View>
  );

  const renderBcoinItem = ({ item }: { item: any }) => (
    <View className="p-4 mb-3 bg-white border border-gray-100 shadow-sm rounded-xl">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
            item.transaction_type === 'earned' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <Feather 
              name={item.transaction_type === 'earned' ? 'plus' : 'minus'} 
              size={16} 
              color={item.transaction_type === 'earned' ? '#10B981' : '#EF4444'} 
            />
          </View>
          <View>
            <Text className="font-semibold text-gray-800">
              {item.transaction_type === 'earned' ? 'Earned' : 'Redeemed'}
            </Text>
            <Text className="text-sm text-gray-500">{item.description}</Text>
          </View>
        </View>
        <View className="items-end">
          <Text className={`font-bold ${
            item.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
          }`}>
            {item.transaction_type === 'earned' ? '+' : '-'}{item.bcoins_earned} coins
          </Text>
          <Text className="text-xs text-gray-500">
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
      {item.amount_spend > 0 && (
        <Text className="text-sm text-gray-500">Order Amount: ₹{item.amount_spend.toFixed(2)}</Text>
      )}
    </View>
  );

  const renderBcoinsContent = () => (
    <View className="flex-1">
      {isBcoinsLoading && bcoinTransactions.length === 0 ? (
        <View className="items-center justify-center flex-1 py-20">
          <ActivityIndicator size="large" color="#8B5CF6" />
          <Text className="mt-4 text-gray-600">Loading bcoin history...</Text>
        </View>
      ) : bcoinsError ? (
        <View className="items-center justify-center flex-1 py-20">
          <Feather name="alert-triangle" size={32} color="#EF4444" />
          <Text className="mt-4 mb-2 text-xl font-bold text-gray-800">Error loading bcoins</Text>
          <Text className="px-8 text-center text-gray-500">{bcoinsError}</Text>
        </View>
      ) : bcoinTransactions.length > 0 ? (
        <FlatList
          data={bcoinTransactions}
          renderItem={renderBcoinItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={onRefreshControl} />
          }
          onEndReached={loadMoreBcoins}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={() => (
            <View className="p-4 mb-6 bg-yellow-50 rounded-xl">
              <Text className="mb-1 text-base font-semibold text-yellow-800">Bcoin History</Text>
              <Text className="text-sm text-yellow-600">
                Current Balance: {profile?.total_bcoins || 0} coins
              </Text>
              <Text className="mt-1 text-xs text-yellow-600">
                1 coin = ₹2 discount on your next order
              </Text>
            </View>
          )}
          ListFooterComponent={() => 
            isBcoinsLoading ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#8B5CF6" />
              </View>
            ) : null
          }
        />
      ) : (
        <View className="items-center justify-center flex-1 py-20">
          <View className="items-center justify-center w-24 h-24 mb-4 bg-gray-100 rounded-full">
            <Feather name="star" size={32} color="#9CA3AF" />
          </View>
          <Text className="mb-2 text-xl font-bold text-gray-800">No bcoin transactions</Text>
          <Text className="px-8 text-center text-gray-500">
            Start shopping to earn bcoins and see your transaction history here
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-4 py-4 bg-white border-b border-gray-100 shadow-sm">
        <Text className="text-xl font-bold text-center text-gray-800">Profile</Text>
      </View>

      <View className="bg-white border-b border-gray-100 shadow-sm">
        <View className="flex-row px-4 py-2">
          <TouchableOpacity
            onPress={() => setActiveTab('profile')}
            className={`flex-1 py-4 items-center border-b-3 ${
              activeTab === 'profile' ? 'border-purple-500' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center">
              <Feather
                name="user"
                size={18}
                color={activeTab === 'profile' ? '#8B5CF6' : '#6B7280'}
              />
              <Text
                className={`ml-2 font-bold ${
                  activeTab === 'profile' ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                Profile
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('orders')}
            className={`flex-1 py-4 items-center border-b-3 ${
              activeTab === 'orders' ? 'border-purple-500' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center">
              <Feather
                name="shopping-bag"
                size={18}
                color={activeTab === 'orders' ? '#8B5CF6' : '#6B7280'}
              />
              <Text
                className={`ml-2 font-bold ${
                  activeTab === 'orders' ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                Orders
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveTab('bcoins')}
            className={`flex-1 py-4 items-center border-b-3 ${
              activeTab === 'bcoins' ? 'border-purple-500' : 'border-transparent'
            }`}
          >
            <View className="flex-row items-center">
              <Feather
                name="star"
                size={18}
                color={activeTab === 'bcoins' ? '#8B5CF6' : '#6B7280'}
              />
              <Text
                className={`ml-2 font-bold ${
                  activeTab === 'bcoins' ? 'text-purple-600' : 'text-gray-600'
                }`}
              >
                Bcoins
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'profile' && renderProfileContent()}
      {activeTab === 'orders' && renderOrdersContent()}
      {activeTab === 'bcoins' && renderBcoinsContent()}

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />

      <CustomToast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHide={() => setToastConfig(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

export default Profile;
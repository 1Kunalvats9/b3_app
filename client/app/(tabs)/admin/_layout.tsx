import { Stack } from 'expo-router';
import { useAuthRole } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function AdminLayout() {
  const { isAdmin } = useAuthRole();

  if (!isAdmin) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
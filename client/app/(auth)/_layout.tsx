import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect } from "react";

export default function AuthLayout() {
    const { isSignedIn, isLoaded } = useAuth();

    // Wait for auth to load
    if (!isLoaded) {
        return null;
    }

    if (isSignedIn) {
        return <Redirect href="/(tabs)" />;
    }

    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
        </Stack>
    );
}
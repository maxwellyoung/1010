import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { ConvexProvider } from 'convex/react';
import { LocationProvider } from '../src/context/LocationContext';
import { Colors } from '../src/constants/Theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { convex, isConvexConfigured, initializeDeviceId } from '../src/lib/convex';
import { initSentry, setUser } from '../src/lib/sentry';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        Inter: Inter_400Regular,
        'Inter-Medium': Inter_500Medium,
        'Inter-SemiBold': Inter_600SemiBold,
    });
    const [authReady, setAuthReady] = useState(!isConvexConfigured);

    // Initialize Sentry and device ID
    useEffect(() => {
        // Initialize Sentry first
        initSentry();

        if (!isConvexConfigured) {
            setAuthReady(true);
            return;
        }

        const initAuth = async () => {
            try {
                const deviceId = await initializeDeviceId();
                setUser(deviceId);
                console.log('[AUTH] Device ID initialized');
            } catch (err) {
                console.warn('[AUTH] Failed to initialize device ID:', err);
            } finally {
                setAuthReady(true);
            }
        };

        initAuth();
    }, []);

    useEffect(() => {
        if (loaded && authReady) {
            SplashScreen.hideAsync();
        }
    }, [loaded, authReady]);

    if (!loaded || !authReady) {
        return null;
    }

    // Wrap with Convex provider if configured
    const content = (
        <ErrorBoundary>
            <LocationProvider>
                <ThemeProvider value={DarkTheme}>
                    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
                        <Stack.Screen name="index" />
                        <Stack.Screen name="network" />
                        <Stack.Screen name="out-of-range" />
                        <Stack.Screen name="+not-found" />
                    </Stack>
                    <StatusBar style="light" />
                </ThemeProvider>
            </LocationProvider>
        </ErrorBoundary>
    );

    if (isConvexConfigured && convex) {
        return <ConvexProvider client={convex}>{content}</ConvexProvider>;
    }

    return content;
}

import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import { LocationProvider } from '../src/context/LocationContext';
import { Colors } from '../src/constants/Theme';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ensureAnonymousSession, isSupabaseConfigured } from '../src/lib/supabase';
import { initSentry, setUser } from '../src/lib/sentry';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });
    const [authReady, setAuthReady] = useState(!isSupabaseConfigured);

    // Initialize Sentry and anonymous auth
    useEffect(() => {
        // Initialize Sentry first
        initSentry();

        if (!isSupabaseConfigured) {
            setAuthReady(true);
            return;
        }

        const initAuth = async () => {
            try {
                const session = await ensureAnonymousSession();
                if (session?.data?.session?.user?.id) {
                    setUser(session.data.session.user.id);
                }
                console.log('[AUTH] Session initialized');
            } catch (err) {
                console.warn('[AUTH] Failed to initialize session:', err);
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

    return (
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
}

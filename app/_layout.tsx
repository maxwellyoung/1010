import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { LocationProvider } from '../src/context/LocationContext';
import { Colors } from '../src/constants/Theme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    });

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return (
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
    );
}

import { Redirect } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors } from '../src/constants/Theme';
import { useLocation } from '../src/context/LocationContext';
import { useEffect, useState } from 'react';

export default function Index() {
    const { location } = useLocation();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Wait for location to be ready
        if (location) {
            setIsReady(true);
        }
    }, [location]);

    if (!isReady) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <Text style={{ color: Colors.primary }}>INITIALIZING NETWORK...</Text>
            </View>
        );
    }

    // Always allow access, regardless of location
    return <Redirect href="/onboarding" />;
}

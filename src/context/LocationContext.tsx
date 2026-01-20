import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_ZONE, isInsideZone } from '../config/NetworkZones';

interface LocationContextType {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    isInsideNetwork: boolean;
    requestPermissions: () => Promise<void>;
    setOverride: (value: boolean | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isInsideNetwork, setIsInsideNetwork] = useState(false);
    const [override, setOverride] = useState<boolean | null>(null);
    const watchSubscriptionRef = useRef<Location.LocationSubscription | null>(null);
    const overrideRef = useRef<boolean | null>(null);

    // Keep ref in sync with state for use in callbacks
    useEffect(() => {
        overrideRef.current = override;
    }, [override]);

    const checkInsideNetwork = useCallback((loc: Location.LocationObject) => {
        if (overrideRef.current !== null) {
            setIsInsideNetwork(overrideRef.current);
            return;
        }

        const { latitude, longitude } = loc.coords;
        setIsInsideNetwork(isInsideZone(latitude, longitude, DEFAULT_ZONE));
    }, []);

    const requestPermissions = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({});
        setLocation(currentLocation);
        checkInsideNetwork(currentLocation);

        // Clean up any existing subscription
        if (watchSubscriptionRef.current) {
            watchSubscriptionRef.current.remove();
        }

        // Watch for updates and store subscription
        watchSubscriptionRef.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (newLoc) => {
                setLocation(newLoc);
                checkInsideNetwork(newLoc);
            }
        );
    }, [checkInsideNetwork]);

    useEffect(() => {
        requestPermissions();

        // Cleanup subscription on unmount
        return () => {
            if (watchSubscriptionRef.current) {
                watchSubscriptionRef.current.remove();
                watchSubscriptionRef.current = null;
            }
        };
    }, [requestPermissions]);

    // Re-check when override changes
    useEffect(() => {
        if (location) {
            checkInsideNetwork(location);
        }
    }, [override, location, checkInsideNetwork]);

    return (
        <LocationContext.Provider value={{
            location,
            errorMsg,
            isInsideNetwork,
            requestPermissions,
            setOverride
        }}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
};

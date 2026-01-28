import React, { createContext, useContext, useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as Location from 'expo-location';
import { DEFAULT_ZONE, isInsideZone } from '../config/NetworkZones';

interface LocationContextType {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    isInsideNetwork: boolean;
    requestPermissions: () => Promise<void>;
    setOverride: (value: boolean | null) => void;
}

const LocationContext = createContext<LocationContextType | null>(null);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isInsideNetwork, setIsInsideNetwork] = useState(false);

    // Refs for stable references
    const overrideRef = useRef<boolean | null>(null);
    const watchRef = useRef<Location.LocationSubscription | null>(null);
    const hasInitializedRef = useRef(false);

    // Stable setOverride function
    const setOverride = useCallback((value: boolean | null) => {
        overrideRef.current = value;
        if (value !== null) {
            setIsInsideNetwork(value);
        }
    }, []);

    // Stable requestPermissions - no-op since we init on mount
    const requestPermissions = useCallback(async () => {
        // Location is initialized on mount, this is here for interface compatibility
    }, []);

    // Initialize location on mount
    useEffect(() => {
        if (hasInitializedRef.current) return;
        hasInitializedRef.current = true;

        let isMounted = true;

        const initLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (!isMounted) return;

                if (status !== 'granted') {
                    setErrorMsg('Permission denied');
                    return;
                }

                const currentLoc = await Location.getCurrentPositionAsync({});
                if (!isMounted) return;

                setLocation(currentLoc);
                if (overrideRef.current === null) {
                    const inside = isInsideZone(
                        currentLoc.coords.latitude,
                        currentLoc.coords.longitude,
                        DEFAULT_ZONE
                    );
                    setIsInsideNetwork(inside);
                }

                // Start watching position
                watchRef.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.Balanced,
                        timeInterval: 10000,
                        distanceInterval: 20
                    },
                    (newLoc) => {
                        if (!isMounted) return;
                        setLocation(newLoc);
                        if (overrideRef.current === null) {
                            const inside = isInsideZone(
                                newLoc.coords.latitude,
                                newLoc.coords.longitude,
                                DEFAULT_ZONE
                            );
                            setIsInsideNetwork(inside);
                        }
                    }
                );
            } catch (err) {
                if (isMounted) {
                    setErrorMsg('Location error');
                }
            }
        };

        initLocation();

        return () => {
            isMounted = false;
            watchRef.current?.remove();
        };
    }, []);

    // Memoize context value - only changes when state actually changes
    const value = useMemo<LocationContextType>(() => ({
        location,
        errorMsg,
        isInsideNetwork,
        requestPermissions,
        setOverride,
    }), [location, errorMsg, isInsideNetwork, requestPermissions, setOverride]);

    return (
        <LocationContext.Provider value={value}>
            {children}
        </LocationContext.Provider>
    );
};

export const useLocation = () => {
    const context = useContext(LocationContext);
    if (!context) {
        throw new Error('useLocation must be used within LocationProvider');
    }
    return context;
};

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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

// Stable references outside component to prevent re-creation
let globalOverride: boolean | null = null;
let hasInitialized = false;

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isInsideNetwork, setIsInsideNetwork] = useState(false);
    const watchRef = useRef<Location.LocationSubscription | null>(null);

    // Store stable function refs
    const stateRef = useRef({ setLocation, setErrorMsg, setIsInsideNetwork });
    stateRef.current = { setLocation, setErrorMsg, setIsInsideNetwork };

    useEffect(() => {
        if (hasInitialized) return;
        hasInitialized = true;

        let mounted = true;

        const init = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (!mounted) return;

                if (status !== 'granted') {
                    stateRef.current.setErrorMsg('Permission denied');
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({});
                if (!mounted) return;

                stateRef.current.setLocation(loc);
                if (globalOverride === null) {
                    stateRef.current.setIsInsideNetwork(
                        isInsideZone(loc.coords.latitude, loc.coords.longitude, DEFAULT_ZONE)
                    );
                }

                const subscription = await Location.watchPositionAsync(
                    { accuracy: Location.Accuracy.Balanced, timeInterval: 10000, distanceInterval: 20 },
                    (newLoc) => {
                        if (!mounted) return;
                        stateRef.current.setLocation(newLoc);
                        if (globalOverride === null) {
                            stateRef.current.setIsInsideNetwork(
                                isInsideZone(newLoc.coords.latitude, newLoc.coords.longitude, DEFAULT_ZONE)
                            );
                        }
                    }
                );
                watchRef.current = subscription;
            } catch (err) {
                if (mounted) {
                    stateRef.current.setErrorMsg('Location error');
                }
            }
        };

        init();

        return () => {
            mounted = false;
            watchRef.current?.remove();
        };
    }, []); // Empty deps - runs once

    // Stable context value using refs for functions
    const contextValue = useRef<LocationContextType>({
        location: null,
        errorMsg: null,
        isInsideNetwork: false,
        requestPermissions: async () => {
            // Already initialized on mount, this is a no-op
        },
        setOverride: (value: boolean | null) => {
            globalOverride = value;
            if (value !== null) {
                stateRef.current.setIsInsideNetwork(value);
            }
        },
    });

    // Update only the values, keep function references stable
    contextValue.current.location = location;
    contextValue.current.errorMsg = errorMsg;
    contextValue.current.isInsideNetwork = isInsideNetwork;

    return (
        <LocationContext.Provider value={contextValue.current}>
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

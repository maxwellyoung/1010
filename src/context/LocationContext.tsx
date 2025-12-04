import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationContextType {
    location: Location.LocationObject | null;
    errorMsg: string | null;
    isInsideNetwork: boolean;
    requestPermissions: () => Promise<void>;
    setOverride: (value: boolean | null) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

// 1010 Auckland CBD Bounding Box (Accurate)
// Covers the core CBD area: Queen St, Britomart, Viaduct, University
// North: -36.835 (Viaduct/Waterfront)
// South: -36.865 (Symonds St/University)
// West: 174.755 (Western Park)
// East: 174.780 (Parnell Rise)
const NETWORK_BOUNDS = {
    minLat: -36.870,  // Southern boundary (with buffer)
    maxLat: -36.830,  // Northern boundary (with buffer)
    minLng: 174.750,  // Western boundary (with buffer)
    maxLng: 174.785,  // Eastern boundary (with buffer)
};

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isInsideNetwork, setIsInsideNetwork] = useState(false);
    const [override, setOverride] = useState<boolean | null>(null);

    const checkInsideNetwork = (loc: Location.LocationObject) => {
        if (override !== null) {
            setIsInsideNetwork(override);
            return;
        }

        const { latitude, longitude } = loc.coords;
        const isInside =
            latitude >= NETWORK_BOUNDS.minLat &&
            latitude <= NETWORK_BOUNDS.maxLat &&
            longitude >= NETWORK_BOUNDS.minLng &&
            longitude <= NETWORK_BOUNDS.maxLng;
        setIsInsideNetwork(isInside);
    };

    const requestPermissions = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            setErrorMsg('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        checkInsideNetwork(location);

        // Watch for updates
        await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
            (newLoc) => {
                setLocation(newLoc);
                checkInsideNetwork(newLoc);
            }
        );
    };

    useEffect(() => {
        requestPermissions();
    }, []);

    // Re-check when override changes
    useEffect(() => {
        if (location) {
            checkInsideNetwork(location);
        }
    }, [override]);

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

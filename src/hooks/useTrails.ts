import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useLocation } from '../context/LocationContext';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
import { DEFAULT_ZONE } from '../config/NetworkZones';
import * as Crypto from 'expo-crypto';

export interface TrailPoint {
    x: number;
    y: number;
    timestamp: number;
    lat?: number;
    lng?: number;
}

const SIZE = 300; // Default visualization size

// Convert coordinates to screen position for trail visualization
const latToY = (lat: number): number => {
    const normalized = (lat - DEFAULT_ZONE.bounds.minLat) / (DEFAULT_ZONE.bounds.maxLat - DEFAULT_ZONE.bounds.minLat);
    return (1 - normalized) * SIZE;
};

const lngToX = (lng: number): number => {
    const normalized = (lng - DEFAULT_ZONE.bounds.minLng) / (DEFAULT_ZONE.bounds.maxLng - DEFAULT_ZONE.bounds.minLng);
    return normalized * SIZE;
};

const TRAIL_POINT_INTERVAL = 10000; // 10 seconds between trail points
const TRAIL_MAX_AGE = 30 * 60 * 1000; // 30 minutes
const HISTORIC_TRAIL_DAYS = 7;

export const useTrails = () => {
    const { isInsideNetwork, location } = useLocation();
    const [currentTrail, setCurrentTrail] = useState<TrailPoint[]>([]);
    const [historicTrails, setHistoricTrails] = useState<TrailPoint[][]>([]);
    const [isResonating, setIsResonating] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const sequenceRef = useRef(0);
    const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);

    // Convex mutation
    const insertTrailPoint = useMutation(api.mutations.trails.insertTrailPoint);

    // Fetch historic trails
    const since = Date.now() - HISTORIC_TRAIL_DAYS * 24 * 60 * 60 * 1000;
    const historicTrailsData = useQuery(
        api.queries.temporal.getTrailsInRange,
        deviceId && sessionId && isConvexConfigured
            ? { deviceId, since, excludeSessionId: sessionId }
            : 'skip'
    );

    // Initialize device ID and session ID
    useEffect(() => {
        const init = async () => {
            if (isConvexConfigured) {
                const id = await getDeviceId();
                setDeviceId(id);
            }
            const sid = await Crypto.randomUUID();
            setSessionId(sid);
        };
        init();
    }, []);

    // Process historic trails when data changes
    useEffect(() => {
        if (historicTrailsData && Array.isArray(historicTrailsData)) {
            const trails = historicTrailsData.slice(-5).map((session) =>
                session.points.map((p) => ({
                    x: lngToX(p.lng),
                    y: latToY(p.lat),
                    timestamp: p.ts,
                }))
            );
            setHistoricTrails(trails);
        }
    }, [historicTrailsData]);

    // Add trail point
    const addTrailPoint = useCallback(async () => {
        if (!location || !sessionId || !deviceId) return;

        const { latitude, longitude, accuracy } = location.coords;
        const now = Date.now();

        // Skip if too close to last point (< 5 meters movement)
        if (lastPointRef.current) {
            const dlat = latitude - lastPointRef.current.lat;
            const dlng = longitude - lastPointRef.current.lng;
            const distance = Math.sqrt(dlat * dlat + dlng * dlng) * 111000; // Rough meters
            if (distance < 5) return;
        }

        const point: TrailPoint = {
            x: lngToX(longitude),
            y: latToY(latitude),
            timestamp: now,
            lat: latitude,
            lng: longitude,
        };

        // Add to local trail
        setCurrentTrail(prev => {
            const filtered = prev.filter(p => now - p.timestamp < TRAIL_MAX_AGE);
            return [...filtered, point];
        });

        lastPointRef.current = { lat: latitude, lng: longitude };

        // Save to Convex
        if (isConvexConfigured) {
            try {
                sequenceRef.current += 1;
                await insertTrailPoint({
                    deviceId,
                    sessionId,
                    lat: latitude,
                    lng: longitude,
                    accuracy: accuracy || 0,
                    seq: sequenceRef.current,
                });
            } catch (err) {
                console.warn('[TRAIL] Insert failed:', err);
            }
        }
    }, [location, sessionId, deviceId, insertTrailPoint]);

    // Check for resonance (current path overlaps historic)
    const checkResonance = useCallback(() => {
        if (currentTrail.length < 3 || historicTrails.length === 0) {
            setIsResonating(false);
            return;
        }

        const latest = currentTrail[currentTrail.length - 1];
        const threshold = 15; // pixels

        for (const trail of historicTrails) {
            for (const point of trail) {
                const dx = latest.x - point.x;
                const dy = latest.y - point.y;
                if (Math.sqrt(dx * dx + dy * dy) < threshold) {
                    setIsResonating(true);
                    return;
                }
            }
        }
        setIsResonating(false);
    }, [currentTrail, historicTrails]);

    // Track location when inside network
    useEffect(() => {
        if (!isInsideNetwork || !sessionId || !deviceId) {
            return;
        }

        // Initial point
        addTrailPoint();

        // Add points periodically
        const interval = setInterval(addTrailPoint, TRAIL_POINT_INTERVAL);

        return () => clearInterval(interval);
    }, [isInsideNetwork, sessionId, deviceId, addTrailPoint]);

    // Check resonance when trail updates
    useEffect(() => {
        checkResonance();
    }, [checkResonance]);

    // Clear old points from current trail
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now();
            setCurrentTrail(prev => prev.filter(p => now - p.timestamp < TRAIL_MAX_AGE));
        }, 60000);

        return () => clearInterval(cleanup);
    }, []);

    // Clear current trail (for manual reset)
    const clearCurrentTrail = useCallback(() => {
        setCurrentTrail([]);
        lastPointRef.current = null;
    }, []);

    return {
        currentTrail,
        historicTrails,
        isResonating,
        sessionId,
        clearCurrentTrail,
    };
};

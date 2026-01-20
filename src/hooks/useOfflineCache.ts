import { useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Offline Cache Hook
 *
 * Provides persistent local storage for trails, encounters, and other data.
 * Inspired by Georgi Gerganov's efficiency principles:
 * - Work offline first
 * - Minimize network dependency
 * - Cache aggressively
 */

const CACHE_KEYS = {
    TRAILS: '1010_TRAILS_CACHE',
    ENCOUNTERS: '1010_ENCOUNTERS_CACHE',
    GHOST_PINGS: '1010_GHOST_PINGS_CACHE',
    LAST_SYNC: '1010_LAST_SYNC',
} as const;

const CACHE_TTL = {
    TRAILS: 7 * 24 * 60 * 60 * 1000,      // 7 days
    ENCOUNTERS: 30 * 24 * 60 * 60 * 1000, // 30 days
    GHOST_PINGS: 15 * 60 * 1000,          // 15 minutes
} as const;

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: number;
}

interface TrailPoint {
    lat: number;
    lng: number;
    timestamp: number;
}

interface Encounter {
    id: string;
    peerId: string;
    timestamp: number;
    location?: { lat: number; lng: number };
    resonance: number;
}

interface GhostPing {
    id: string;
    x: number;
    y: number;
    ageMinutes: number;
    receivedAt: number;
}

const CURRENT_VERSION = 1;

export function useOfflineCache() {
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Generic cache get
    const getCache = useCallback(async <T>(key: string, ttl: number): Promise<T | null> => {
        try {
            const stored = await AsyncStorage.getItem(key);
            if (!stored) return null;

            const entry: CacheEntry<T> = JSON.parse(stored);

            // Check version compatibility
            if (entry.version !== CURRENT_VERSION) {
                await AsyncStorage.removeItem(key);
                return null;
            }

            // Check TTL
            if (Date.now() - entry.timestamp > ttl) {
                await AsyncStorage.removeItem(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            console.warn(`Cache read error for ${key}:`, error);
            return null;
        }
    }, []);

    // Generic cache set
    const setCache = useCallback(async <T>(key: string, data: T): Promise<void> => {
        try {
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                version: CURRENT_VERSION,
            };
            await AsyncStorage.setItem(key, JSON.stringify(entry));
        } catch (error) {
            console.warn(`Cache write error for ${key}:`, error);
        }
    }, []);

    // Trail-specific methods
    const getTrails = useCallback(async (): Promise<TrailPoint[][] | null> => {
        return getCache<TrailPoint[][]>(CACHE_KEYS.TRAILS, CACHE_TTL.TRAILS);
    }, [getCache]);

    const saveTrails = useCallback(async (trails: TrailPoint[][]): Promise<void> => {
        // Keep only last 10 trails to prevent unbounded growth
        const trimmed = trails.slice(-10);
        await setCache(CACHE_KEYS.TRAILS, trimmed);
    }, [setCache]);

    const appendTrailPoint = useCallback(async (point: TrailPoint): Promise<void> => {
        const existing = await getTrails() ?? [[]];
        const currentTrail = existing[existing.length - 1] ?? [];

        // Dedupe: don't add if within 10 meters of last point
        const lastPoint = currentTrail[currentTrail.length - 1];
        if (lastPoint) {
            const distance = getDistance(lastPoint, point);
            if (distance < 10) return;
        }

        currentTrail.push(point);

        // Limit points per trail to prevent memory issues
        if (currentTrail.length > 500) {
            currentTrail.shift();
        }

        existing[existing.length - 1] = currentTrail;
        await saveTrails(existing);
    }, [getTrails, saveTrails]);

    const startNewTrail = useCallback(async (): Promise<void> => {
        const existing = await getTrails() ?? [];
        existing.push([]);
        await saveTrails(existing);
    }, [getTrails, saveTrails]);

    // Encounter-specific methods
    const getEncounters = useCallback(async (): Promise<Encounter[] | null> => {
        return getCache<Encounter[]>(CACHE_KEYS.ENCOUNTERS, CACHE_TTL.ENCOUNTERS);
    }, [getCache]);

    const saveEncounter = useCallback(async (encounter: Encounter): Promise<void> => {
        const existing = await getEncounters() ?? [];

        // Check for duplicate (same peer within 5 minutes)
        const isDuplicate = existing.some(e =>
            e.peerId === encounter.peerId &&
            Math.abs(e.timestamp - encounter.timestamp) < 5 * 60 * 1000
        );

        if (isDuplicate) return;

        existing.push(encounter);

        // Keep only last 100 encounters
        const trimmed = existing.slice(-100);
        await setCache(CACHE_KEYS.ENCOUNTERS, trimmed);
    }, [getEncounters, setCache]);

    const getEncounterCount = useCallback(async (peerId: string): Promise<number> => {
        const encounters = await getEncounters() ?? [];
        return encounters.filter(e => e.peerId === peerId).length;
    }, [getEncounters]);

    // Ghost ping caching (short TTL)
    const getGhostPings = useCallback(async (): Promise<GhostPing[] | null> => {
        return getCache<GhostPing[]>(CACHE_KEYS.GHOST_PINGS, CACHE_TTL.GHOST_PINGS);
    }, [getCache]);

    const saveGhostPings = useCallback(async (pings: GhostPing[]): Promise<void> => {
        await setCache(CACHE_KEYS.GHOST_PINGS, pings.slice(0, 20));
    }, [setCache]);

    // Sync timestamp
    const getLastSync = useCallback(async (): Promise<number | null> => {
        const stored = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
        return stored ? parseInt(stored, 10) : null;
    }, []);

    const updateLastSync = useCallback(async (): Promise<void> => {
        await AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, Date.now().toString());
    }, []);

    // Clear all cache
    const clearAll = useCallback(async (): Promise<void> => {
        await Promise.all(
            Object.values(CACHE_KEYS).map(key => AsyncStorage.removeItem(key))
        );
    }, []);

    return {
        // Trails
        getTrails,
        saveTrails,
        appendTrailPoint,
        startNewTrail,

        // Encounters
        getEncounters,
        saveEncounter,
        getEncounterCount,

        // Ghost pings
        getGhostPings,
        saveGhostPings,

        // Sync
        getLastSync,
        updateLastSync,

        // Utility
        clearAll,
    };
}

// Haversine distance in meters
function getDistance(
    p1: { lat: number; lng: number },
    p2: { lat: number; lng: number }
): number {
    const R = 6371e3; // Earth radius in meters
    const lat1 = (p1.lat * Math.PI) / 180;
    const lat2 = (p2.lat * Math.PI) / 180;
    const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
        Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

export type OfflineCache = ReturnType<typeof useOfflineCache>;

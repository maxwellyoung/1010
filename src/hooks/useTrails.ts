import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../context/LocationContext';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '../lib/supabase';
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
    const sequenceRef = useRef(0);
    const lastPointRef = useRef<{ lat: number; lng: number } | null>(null);

    // Generate session ID on mount
    useEffect(() => {
        const generateSessionId = async () => {
            const id = await Crypto.randomUUID();
            setSessionId(id);
        };
        generateSessionId();
    }, []);

    // Add trail point
    const addTrailPoint = useCallback(async () => {
        if (!location || !sessionId) return;

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

        // Save to Supabase
        if (isSupabaseConfigured) {
            const userId = await getCurrentUserId();
            if (userId) {
                sequenceRef.current += 1;
                const { error } = await supabase.from('trails').insert({
                    profile_id: userId,
                    session_id: sessionId,
                    lat: latitude,
                    lng: longitude,
                    accuracy,
                    seq: sequenceRef.current,
                });
                if (error) {
                    console.warn('[TRAIL] Insert failed:', error.message);
                }
            }
        }
    }, [location, sessionId]);

    // Fetch historic trails
    const fetchHistoricTrails = useCallback(async () => {
        if (!isSupabaseConfigured) return;

        const userId = await getCurrentUserId();
        if (!userId) return;

        try {
            const since = new Date();
            since.setDate(since.getDate() - HISTORIC_TRAIL_DAYS);

            const { data, error } = await supabase
                .from('trails')
                .select('session_id, lat, lng, created_at, seq')
                .eq('profile_id', userId)
                .neq('session_id', sessionId) // Exclude current session
                .gte('created_at', since.toISOString())
                .order('session_id')
                .order('seq');

            if (error) {
                console.warn('[TRAIL] Historic fetch failed:', error.message);
                return;
            }

            if (data && data.length > 0) {
                // Group by session
                const sessions = new Map<string, TrailPoint[]>();
                for (const row of data) {
                    const points = sessions.get(row.session_id) || [];
                    points.push({
                        x: lngToX(row.lng),
                        y: latToY(row.lat),
                        timestamp: new Date(row.created_at).getTime(),
                    });
                    sessions.set(row.session_id, points);
                }

                // Take last 5 sessions
                const trails = Array.from(sessions.values()).slice(-5);
                setHistoricTrails(trails);
            }
        } catch (err) {
            console.error('[TRAIL] Error fetching historic trails:', err);
        }
    }, [sessionId]);

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
        if (!isInsideNetwork || !sessionId) {
            return;
        }

        // Initial point
        addTrailPoint();

        // Add points periodically
        const interval = setInterval(addTrailPoint, TRAIL_POINT_INTERVAL);

        return () => clearInterval(interval);
    }, [isInsideNetwork, sessionId, addTrailPoint]);

    // Fetch historic trails once on session start
    useEffect(() => {
        if (sessionId && isInsideNetwork) {
            fetchHistoricTrails();
        }
    }, [sessionId, isInsideNetwork, fetchHistoricTrails]);

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

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from '../context/LocationContext';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '../lib/supabase';
import { DEFAULT_ZONE, coordsToNormalized } from '../config/NetworkZones';

export interface HeatPoint {
    id: string;
    x: number; // Relative position -1 to 1
    y: number; // Relative position -1 to 1
    intensity: number; // 0 to 1
    ageMinutes?: number;
}

export const usePings = () => {
    const { isInsideNetwork, location } = useLocation();
    const [heatMap, setHeatMap] = useState<HeatPoint[]>([]);
    const [lastPingAt, setLastPingAt] = useState<number | null>(null);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const sendPing = useCallback(async () => {
        if (!isSupabaseConfigured || !location) {
            return;
        }

        const userId = await getCurrentUserId();
        if (!userId) {
            console.warn('[PING] No user session');
            return;
        }

        const { latitude, longitude } = location.coords;

        try {
            // Insert ping for stats
            const { error: pingError } = await supabase.from('pings').insert({
                profile_id: userId,
                postcode: '1010',
                lat: latitude,
                lng: longitude,
                source: 'app',
            });

            if (pingError) {
                console.warn('[PING] Insert failed:', pingError.message);
            }

            // Upsert presence signal for heat map
            const { error: presenceError } = await supabase.from('presence_signals').insert({
                profile_id: userId,
                lat: latitude,
                lng: longitude,
                intensity: 1.0,
            });

            if (presenceError) {
                console.warn('[PING] Presence insert failed:', presenceError.message);
            }

            setLastPingAt(Date.now());
            console.log('[PING] Sent presence ping');
        } catch (err) {
            console.error('[PING] Error:', err);
        }
    }, [location]);

    const fetchHeatMap = useCallback(async () => {
        if (!isSupabaseConfigured || !location) {
            return;
        }

        const { latitude, longitude } = location.coords;

        try {
            const { data, error } = await supabase.rpc('get_nearby_presence', {
                user_lat: latitude,
                user_lng: longitude,
                radius_km: 0.5,
            });

            if (error) {
                // Function might not exist yet
                console.warn('[PING] Heat map query failed:', error.message);
                return;
            }

            if (data && Array.isArray(data)) {
                const points: HeatPoint[] = data.map((p: any) => {
                    const normalized = coordsToNormalized(p.lat, p.lng, DEFAULT_ZONE);
                    return {
                        id: p.id,
                        x: normalized.x,
                        y: normalized.y,
                        intensity: Math.max(0.3, p.intensity * (1 - (p.age_minutes || 0) / 15)),
                        ageMinutes: p.age_minutes,
                    };
                });
                setHeatMap(points.slice(0, 12));
            }
        } catch (err) {
            console.error('[PING] Heat map error:', err);
        }
    }, [location]);

    useEffect(() => {
        if (!isInsideNetwork) {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            if (heatIntervalRef.current) {
                clearInterval(heatIntervalRef.current);
                heatIntervalRef.current = null;
            }
            setHeatMap([]);
            return;
        }

        // Initial ping and fetch
        sendPing();
        fetchHeatMap();

        // Ping every 60 seconds, fetch heat map every 30 seconds
        pingIntervalRef.current = setInterval(() => {
            sendPing();
            fetchHeatMap();
        }, 60000);

        heatIntervalRef.current = setInterval(fetchHeatMap, 30000);

        return () => {
            if (pingIntervalRef.current) {
                clearInterval(pingIntervalRef.current);
                pingIntervalRef.current = null;
            }
            if (heatIntervalRef.current) {
                clearInterval(heatIntervalRef.current);
                heatIntervalRef.current = null;
            }
        };
    }, [isInsideNetwork, sendPing, fetchHeatMap]);

    return { heatMap, lastPingAt, sendPing };
};

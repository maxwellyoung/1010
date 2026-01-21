import { useState, useEffect, useRef, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { useLocation } from '../context/LocationContext';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
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
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const heatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Convex mutation for sending pings
    const sendPingMutation = useMutation(api.mutations.pings.sendPing);

    // Get nearby presence using query (will auto-update)
    const nearbyPresence = useQuery(
        api.queries.presence.getNearbyPresence,
        location && isConvexConfigured
            ? {
                  lat: location.coords.latitude,
                  lng: location.coords.longitude,
                  radiusKm: 0.5,
              }
            : 'skip'
    );

    // Initialize device ID
    useEffect(() => {
        if (isConvexConfigured) {
            getDeviceId().then(setDeviceId);
        }
    }, []);

    // Update heat map when presence data changes
    useEffect(() => {
        if (nearbyPresence && Array.isArray(nearbyPresence)) {
            const points: HeatPoint[] = nearbyPresence.map((p) => {
                const normalized = coordsToNormalized(p.lat, p.lng, DEFAULT_ZONE);
                return {
                    id: p.id,
                    x: normalized.x,
                    y: normalized.y,
                    intensity: Math.max(0.3, p.intensity * (1 - (p.ageMinutes || 0) / 15)),
                    ageMinutes: p.ageMinutes,
                };
            });
            setHeatMap(points.slice(0, 12));
        }
    }, [nearbyPresence]);

    const sendPing = useCallback(async () => {
        if (!isConvexConfigured || !location || !deviceId) {
            return;
        }

        const { latitude, longitude } = location.coords;

        try {
            await sendPingMutation({
                deviceId,
                postcode: '1010',
                lat: latitude,
                lng: longitude,
                source: 'app',
            });

            setLastPingAt(Date.now());
            console.log('[PING] Sent presence ping');
        } catch (err) {
            console.error('[PING] Error:', err);
        }
    }, [location, deviceId, sendPingMutation]);

    useEffect(() => {
        if (!isInsideNetwork || !deviceId) {
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

        // Initial ping
        sendPing();

        // Ping every 60 seconds
        pingIntervalRef.current = setInterval(sendPing, 60000);

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
    }, [isInsideNetwork, deviceId, sendPing]);

    return { heatMap, lastPingAt, sendPing };
};

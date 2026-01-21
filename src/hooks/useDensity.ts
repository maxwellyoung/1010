import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';

const SEND_INTERVAL_MS = 30000;

const getCellId = (latitude: number, longitude: number) => {
    const latKey = Math.round(latitude * 500);
    const lngKey = Math.round(longitude * 500);
    return `${latKey}:${lngKey}`;
};

export const useDensity = (coords?: { latitude: number; longitude: number }) => {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [cellId, setCellId] = useState<string | null>(null);
    const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize device ID
    useEffect(() => {
        if (isConvexConfigured) {
            getDeviceId().then(setDeviceId);
        }
    }, []);

    // Update cell ID when coords change
    useEffect(() => {
        if (!coords) {
            setCellId(null);
            return;
        }
        setCellId(getCellId(coords.latitude, coords.longitude));
    }, [coords?.latitude, coords?.longitude]);

    // Convex mutation
    const sendDensityPingMutation = useMutation(api.mutations.broadcasts.sendDensityPing);

    // Convex query for density
    const densityData = useQuery(
        api.queries.broadcasts.getDensityForCell,
        cellId && isConvexConfigured ? { cellId } : 'skip'
    );

    // Send density pings periodically
    useEffect(() => {
        if (!isConvexConfigured || !cellId || !deviceId) {
            return;
        }

        const sendPing = async () => {
            try {
                await sendDensityPingMutation({ deviceId, cellId });
            } catch (err) {
                console.warn('[DENSITY] Failed to send ping:', err);
            }
        };

        // Send initial ping
        sendPing();

        // Send periodically
        sendIntervalRef.current = setInterval(sendPing, SEND_INTERVAL_MS);

        return () => {
            if (sendIntervalRef.current) {
                clearInterval(sendIntervalRef.current);
                sendIntervalRef.current = null;
            }
        };
    }, [cellId, deviceId, sendDensityPingMutation]);

    const densityScore = densityData?.densityScore ?? 0;

    return useMemo(() => ({ densityScore, cellId }), [densityScore, cellId]);
};

// Re-export as useSupabaseDensity for backwards compatibility
export const useSupabaseDensity = useDensity;

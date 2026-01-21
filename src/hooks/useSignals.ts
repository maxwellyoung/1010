import { useEffect, useMemo, useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
import type { GhostPing } from './useGhostPings';

export type WindowMomentSignal = {
    isOpen: boolean;
    startedAt: number | null;
    endsAt: number | null;
    position: { x: number; y: number } | null;
};

const MAX_GHOSTS = 8;

type StoredGhost = GhostPing & { receivedAt: number };

export const useSignals = () => {
    const [deviceId, setDeviceId] = useState<string | null>(null);

    // Initialize device ID
    useEffect(() => {
        if (isConvexConfigured) {
            getDeviceId().then(setDeviceId);
        }
    }, []);

    // Convex mutations
    const sendGhostPingMutation = useMutation(api.mutations.broadcasts.sendGhostPing);
    const sendWindowBroadcastMutation = useMutation(api.mutations.broadcasts.sendWindowBroadcast);
    const updatePresenceMutation = useMutation(api.mutations.presence.updatePresence);

    // Convex queries for real-time data
    const ghostPingsData = useQuery(
        api.queries.broadcasts.getRecentGhostPings,
        isConvexConfigured ? {} : 'skip'
    );

    const windowMomentData = useQuery(
        api.queries.broadcasts.getCurrentWindowMoment,
        isConvexConfigured ? {} : 'skip'
    );

    const presenceCountData = useQuery(
        api.queries.presence.getPresenceCount,
        isConvexConfigured ? {} : 'skip'
    );

    // Keep presence alive with heartbeat
    useEffect(() => {
        if (!isConvexConfigured || !deviceId) return;

        // Send initial presence
        updatePresenceMutation({ deviceId });

        // Heartbeat every 30 seconds
        const interval = setInterval(() => {
            updatePresenceMutation({ deviceId });
        }, 30000);

        return () => clearInterval(interval);
    }, [deviceId, updatePresenceMutation]);

    // Process ghost pings
    const ghostPings = useMemo<StoredGhost[]>(() => {
        if (!ghostPingsData) return [];
        return ghostPingsData.slice(0, MAX_GHOSTS).map((g: { id: string; x: number; y: number; ageMinutes?: number; receivedAt: number }) => ({
            id: g.id,
            x: g.x,
            y: g.y,
            ageMinutes: g.ageMinutes ?? 0,
            receivedAt: g.receivedAt,
        })) as StoredGhost[];
    }, [ghostPingsData]);

    // Process window moment
    const windowMoment = useMemo<WindowMomentSignal>(() => {
        if (!windowMomentData) {
            return {
                isOpen: false,
                startedAt: null,
                endsAt: null,
                position: null,
            };
        }
        return windowMomentData as WindowMomentSignal;
    }, [windowMomentData]);

    // Presence counts
    const presenceCount = presenceCountData?.total ?? 0;
    const recentPresenceCount = presenceCountData?.recent ?? 0;

    // Send ghost ping
    const sendGhostPing = useCallback(async (ghost: GhostPing) => {
        if (!isConvexConfigured || !deviceId) return;
        try {
            await sendGhostPingMutation({
                deviceId,
                payload: {
                    id: ghost.id,
                    x: ghost.x,
                    y: ghost.y,
                    ageMinutes: ghost.ageMinutes,
                },
            });
        } catch (err) {
            console.warn('[SIGNALS] Failed to send ghost ping:', err);
        }
    }, [deviceId, sendGhostPingMutation]);

    // Send window moment broadcast
    const sendWindowMoment = useCallback(async (moment: WindowMomentSignal) => {
        if (!isConvexConfigured || !deviceId) return;
        try {
            await sendWindowBroadcastMutation({
                deviceId,
                payload: {
                    isOpen: moment.isOpen,
                    startedAt: moment.startedAt,
                    endsAt: moment.endsAt,
                    position: moment.position,
                },
            });
        } catch (err) {
            console.warn('[SIGNALS] Failed to send window moment:', err);
        }
    }, [deviceId, sendWindowBroadcastMutation]);

    // Strip receivedAt from ghostPings for external use
    const mappedGhostPings = useMemo(
        () => ghostPings.map(({ receivedAt: _receivedAt, ...ghost }) => ghost),
        [ghostPings]
    );

    return useMemo(() => ({
        ghostPings: mappedGhostPings,
        windowMoment,
        sendGhostPing,
        sendWindowMoment,
        isConfigured: isConvexConfigured,
        presenceCount,
        recentPresenceCount,
    }), [mappedGhostPings, windowMoment, sendGhostPing, sendWindowMoment, presenceCount, recentPresenceCount]);
};

// Re-export as useSupabaseSignals for backwards compatibility
export const useSupabaseSignals = useSignals;

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
import { DEFAULT_ZONE } from '../config/NetworkZones';

/**
 * Temporal Layers Hook
 *
 * View the network at different points in time.
 * "The network remembers. Scroll through the echoes."
 *
 * Time Modes:
 * - 'live': Current real-time state
 * - 'hour': Last hour
 * - 'day': Last 24 hours
 * - 'week': Last 7 days
 */

export type TimeMode = 'live' | 'hour' | 'day' | 'week';

export interface TemporalSnapshot {
    mode: TimeMode;
    timestamp: number;
    presenceCount: number;
    encounterCount: number;
    windowCount: number;
    trails: HistoricTrail[];
    hotspots: Hotspot[];
}

export interface HistoricTrail {
    id: string;
    points: { x: number; y: number }[];
    timestamp: number;
    opacity: number;
}

export interface Hotspot {
    id: string;
    x: number;
    y: number;
    intensity: number;
    encounterCount: number;
}

const SIZE = 300;

// Convert coordinates to screen position
const latToY = (lat: number): number => {
    const normalized = (lat - DEFAULT_ZONE.bounds.minLat) / (DEFAULT_ZONE.bounds.maxLat - DEFAULT_ZONE.bounds.minLat);
    return (1 - normalized) * SIZE;
};

const lngToX = (lng: number): number => {
    const normalized = (lng - DEFAULT_ZONE.bounds.minLng) / (DEFAULT_ZONE.bounds.maxLng - DEFAULT_ZONE.bounds.minLng);
    return normalized * SIZE;
};

const getModeInterval = (mode: TimeMode): number => {
    switch (mode) {
        case 'hour': return 60 * 60 * 1000;
        case 'day': return 24 * 60 * 60 * 1000;
        case 'week': return 7 * 24 * 60 * 60 * 1000;
        default: return 0;
    }
};

const getModeLabel = (mode: TimeMode): string => {
    switch (mode) {
        case 'hour': return 'Last hour';
        case 'day': return 'Last 24h';
        case 'week': return 'Last 7 days';
        default: return 'Live';
    }
};

export function useTemporalLayers() {
    const [mode, setMode] = useState<TimeMode>('live');
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [scrubPosition, setScrubPosition] = useState(1); // 0-1, 1 = most recent

    const isLive = mode === 'live';

    // Initialize device ID
    useEffect(() => {
        if (isConvexConfigured) {
            getDeviceId().then(setDeviceId);
        }
    }, []);

    // Calculate time range
    const since = useMemo(() => {
        if (mode === 'live') return 0;
        return Date.now() - getModeInterval(mode);
    }, [mode]);

    // Convex query for temporal snapshot
    const snapshotData = useQuery(
        api.queries.temporal.getTemporalSnapshot,
        deviceId && isConvexConfigured && mode !== 'live'
            ? { deviceId, since, currentSessionId: undefined }
            : 'skip'
    );

    // Process snapshot data
    const snapshot = useMemo<TemporalSnapshot | null>(() => {
        if (mode === 'live' || !snapshotData) return null;

        const now = Date.now();
        const interval = getModeInterval(mode);

        // Process trails
        type SessionData = {
            sessionId: string;
            points: Array<{ lat: number; lng: number; ts: number }>;
        };
        const trails: HistoricTrail[] = snapshotData.trails.slice(0, 10).map((session: SessionData) => {
            const points = session.points.map((p) => ({
                x: lngToX(p.lng),
                y: latToY(p.lat),
            }));
            const latestTs = Math.max(...session.points.map((p) => p.ts));
            const age = (now - latestTs) / interval;

            return {
                id: session.sessionId,
                points,
                timestamp: latestTs,
                opacity: Math.max(0.1, 0.6 * (1 - age)),
            };
        });

        // Process encounters into hotspots
        const grid = new Map<string, { count: number; resonance: number; lat: number; lng: number }>();
        for (const enc of snapshotData.encounters) {
            if (!enc.lat || !enc.lng) continue;
            const cellX = Math.floor(lngToX(enc.lng) / 30);
            const cellY = Math.floor(latToY(enc.lat) / 30);
            const key = `${cellX}-${cellY}`;

            const existing = grid.get(key) || { count: 0, resonance: 0, lat: enc.lat, lng: enc.lng };
            existing.count += 1;
            existing.resonance = Math.max(existing.resonance, enc.maxResonance || 0);
            grid.set(key, existing);
        }

        const hotspots: Hotspot[] = Array.from(grid.entries()).map(([key, cell]) => ({
            id: key,
            x: lngToX(cell.lng),
            y: latToY(cell.lat),
            intensity: Math.min(1, cell.count / 5),
            encounterCount: cell.count,
        }));

        return {
            mode,
            timestamp: now,
            presenceCount: snapshotData.presenceCount,
            encounterCount: snapshotData.encounterCount,
            windowCount: snapshotData.windowCount,
            trails,
            hotspots,
        };
    }, [mode, snapshotData]);

    const isLoading = mode !== 'live' && snapshotData === undefined && isConvexConfigured;

    // Cycle through modes
    const cycleMode = useCallback(() => {
        setMode(current => {
            switch (current) {
                case 'live': return 'hour';
                case 'hour': return 'day';
                case 'day': return 'week';
                case 'week': return 'live';
            }
        });
    }, []);

    const setTimeMode = useCallback((newMode: TimeMode) => {
        setMode(newMode);
    }, []);

    // Scrub through time (0 = oldest in range, 1 = most recent)
    const scrub = useCallback((position: number) => {
        setScrubPosition(Math.max(0, Math.min(1, position)));
    }, []);

    // Filter snapshot data based on scrub position
    const filteredSnapshot = useMemo(() => {
        if (!snapshot || scrubPosition === 1) return snapshot;

        const interval = getModeInterval(mode);
        const cutoff = snapshot.timestamp - (interval * (1 - scrubPosition));

        return {
            ...snapshot,
            trails: snapshot.trails.filter(t => t.timestamp <= cutoff),
            hotspots: snapshot.hotspots, // Hotspots don't scrub well, keep all
        };
    }, [snapshot, scrubPosition, mode]);

    return {
        mode,
        isLive,
        isLoading,
        snapshot: filteredSnapshot,
        scrubPosition,
        cycleMode,
        setTimeMode,
        scrub,
        refresh: () => {}, // Convex handles auto-refresh
        getModeLabel: () => getModeLabel(mode),
    };
}

export type TemporalLayers = ReturnType<typeof useTemporalLayers>;

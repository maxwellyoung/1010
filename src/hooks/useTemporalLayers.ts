import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '../lib/supabase';
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
    const [snapshot, setSnapshot] = useState<TemporalSnapshot | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [scrubPosition, setScrubPosition] = useState(1); // 0-1, 1 = most recent

    const isLive = mode === 'live';

    // Fetch temporal data for the selected mode
    const fetchTemporalData = useCallback(async () => {
        if (!isSupabaseConfigured || mode === 'live') {
            setSnapshot(null);
            return;
        }

        setIsLoading(true);
        const userId = await getCurrentUserId();

        try {
            const now = Date.now();
            const interval = getModeInterval(mode);
            const since = new Date(now - interval).toISOString();

            // Fetch historic trails
            const { data: trailData } = await supabase
                .from('trails')
                .select('session_id, lat, lng, created_at')
                .eq('profile_id', userId)
                .gte('created_at', since)
                .order('created_at', { ascending: true });

            // Fetch encounters in time range
            const { data: encounterData } = await supabase
                .from('encounters')
                .select('id, lat, lng, created_at, max_resonance')
                .gte('created_at', since);

            // Fetch window moments
            const { data: windowData } = await supabase
                .from('window_moments')
                .select('id')
                .gte('created_at', since);

            // Fetch presence signals (for count)
            const { data: presenceData } = await supabase
                .from('pings')
                .select('profile_id')
                .gte('created_at', since);

            // Process trails into grouped paths
            const trails: HistoricTrail[] = [];
            if (trailData) {
                const sessions = new Map<string, { x: number; y: number; ts: number }[]>();
                for (const point of trailData) {
                    const points = sessions.get(point.session_id) || [];
                    points.push({
                        x: lngToX(point.lng),
                        y: latToY(point.lat),
                        ts: new Date(point.created_at).getTime(),
                    });
                    sessions.set(point.session_id, points);
                }

                let i = 0;
                for (const [sessionId, points] of sessions) {
                    const latestTs = Math.max(...points.map(p => p.ts));
                    const age = (now - latestTs) / interval;
                    trails.push({
                        id: sessionId,
                        points: points.map(p => ({ x: p.x, y: p.y })),
                        timestamp: latestTs,
                        opacity: Math.max(0.1, 0.6 * (1 - age)),
                    });
                    i++;
                    if (i >= 10) break; // Limit to 10 trails
                }
            }

            // Process encounters into hotspots
            const hotspots: Hotspot[] = [];
            if (encounterData) {
                // Group encounters by approximate location (grid cells)
                const grid = new Map<string, { count: number; resonance: number; lat: number; lng: number }>();

                for (const enc of encounterData) {
                    if (!enc.lat || !enc.lng) continue;
                    const cellX = Math.floor(lngToX(enc.lng) / 30);
                    const cellY = Math.floor(latToY(enc.lat) / 30);
                    const key = `${cellX}-${cellY}`;

                    const existing = grid.get(key) || { count: 0, resonance: 0, lat: enc.lat, lng: enc.lng };
                    existing.count += 1;
                    existing.resonance = Math.max(existing.resonance, enc.max_resonance || 0);
                    grid.set(key, existing);
                }

                for (const [key, cell] of grid) {
                    hotspots.push({
                        id: key,
                        x: lngToX(cell.lng),
                        y: latToY(cell.lat),
                        intensity: Math.min(1, cell.count / 5),
                        encounterCount: cell.count,
                    });
                }
            }

            // Count unique presences
            const uniqueProfiles = new Set(presenceData?.map(p => p.profile_id) || []);

            setSnapshot({
                mode,
                timestamp: now,
                presenceCount: uniqueProfiles.size,
                encounterCount: encounterData?.length || 0,
                windowCount: windowData?.length || 0,
                trails,
                hotspots,
            });
        } catch (err) {
            console.error('[TEMPORAL] Fetch error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [mode]);

    // Fetch when mode changes
    useEffect(() => {
        fetchTemporalData();
    }, [fetchTemporalData]);

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
        refresh: fetchTemporalData,
        getModeLabel: () => getModeLabel(mode),
    };
}

export type TemporalLayers = ReturnType<typeof useTemporalLayers>;

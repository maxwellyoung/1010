import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface NetworkStats {
    totalParticipants: number;
    activeLast24h: number;
    activeLastHour: number;
    pingDensity: number; // 0-4 scale
}

const EMPTY_STATS: NetworkStats = {
    totalParticipants: 0,
    activeLast24h: 0,
    activeLastHour: 0,
    pingDensity: 0,
};

export const useNetworkStats = () => {
    const [stats, setStats] = useState<NetworkStats>(EMPTY_STATS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStats = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setLoading(false);
            return;
        }

        try {
            const { data, error: queryError } = await supabase
                .from('network_stats')
                .select('*')
                .single();

            if (queryError) {
                // View might not exist yet, fail silently
                console.warn('[STATS] Query failed:', queryError.message);
                setError(queryError.message);
                return;
            }

            if (data) {
                setStats({
                    totalParticipants: data.total_participants ?? 0,
                    activeLast24h: data.active_last_24h ?? 0,
                    activeLastHour: data.active_last_hour ?? 0,
                    pingDensity: data.ping_density ?? 0,
                });
                setError(null);
            }
        } catch (err) {
            console.error('[STATS] Error fetching network stats:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();

        // Refresh every 60 seconds
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, [fetchStats]);

    return { stats, loading, error, refresh: fetchStats };
};

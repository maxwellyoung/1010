import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface NetworkStats {
    totalParticipants: number;
    activeLast24h: number;
    pingDensity: number; // 0-4 scale
}

export const useNetworkStats = () => {
    const [stats, setStats] = useState<NetworkStats>({
        totalParticipants: 0,
        activeLast24h: 0,
        pingDensity: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();

        // Refresh every minute
        const interval = setInterval(fetchStats, 60000);
        return () => clearInterval(interval);
    }, []);

    const fetchStats = async () => {
        try {
            // TODO: Replace with actual Supabase RPC or View query
            // const { data, error } = await supabase.from('network_stats').select('*').single();

            // Mock data for now
            const mockStats = {
                totalParticipants: 37 + Math.floor(Math.random() * 5),
                activeLast24h: 12,
                pingDensity: Math.floor(Math.random() * 3) + 1, // Random 1-3 bars
            };

            setStats(mockStats);
        } catch (error) {
            console.error('Error fetching network stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return { stats, loading };
};

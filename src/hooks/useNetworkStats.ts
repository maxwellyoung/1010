import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { isConvexConfigured } from '../lib/convex';
import { api } from '../../convex/_generated/api';

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
    // Convex query - auto-updates when data changes
    const statsData = useQuery(
        api.queries.networkStats.getNetworkStats,
        isConvexConfigured ? {} : 'skip'
    );

    const stats = useMemo<NetworkStats>(() => {
        if (!statsData) return EMPTY_STATS;
        return {
            totalParticipants: statsData.totalParticipants,
            activeLast24h: statsData.activeLast24h,
            activeLastHour: statsData.activeLastHour,
            pingDensity: statsData.pingDensity,
        };
    }, [statsData]);

    const loading = statsData === undefined && isConvexConfigured;

    return {
        stats,
        loading,
        error: null,
        refresh: () => {}, // Convex handles auto-refresh
    };
};

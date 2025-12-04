import { useState, useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext';

export interface HeatPoint {
    id: string;
    x: number; // Relative position -1 to 1
    y: number; // Relative position -1 to 1
    intensity: number; // 0 to 1
}

export const usePings = () => {
    const { isInsideNetwork } = useLocation();
    const [heatMap, setHeatMap] = useState<HeatPoint[]>([]);
    const pingInterval = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (isInsideNetwork) {
            startPinging();
        } else {
            stopPinging();
        }

        return () => stopPinging();
    }, [isInsideNetwork]);

    const startPinging = () => {
        // Initial ping
        sendPing();

        // Ping every 60s
        pingInterval.current = setInterval(() => {
            sendPing();
        }, 60000);
    };

    const stopPinging = () => {
        if (pingInterval.current) {
            clearInterval(pingInterval.current);
            pingInterval.current = null;
        }
    };

    const sendPing = async () => {
        console.log('[NETWORK] Sending presence ping...');
        // TODO: Real Supabase insert

        // Mock receiving local heat
        updateHeatMap();
    };

    const updateHeatMap = () => {
        // Generate 3-5 random heat points to simulate nearby users
        const count = 3 + Math.floor(Math.random() * 3);
        const newHeat: HeatPoint[] = [];

        for (let i = 0; i < count; i++) {
            newHeat.push({
                id: Math.random().toString(36),
                x: (Math.random() * 2 - 1) * 0.8, // Keep somewhat central
                y: (Math.random() * 2 - 1) * 0.8,
                intensity: 0.5 + Math.random() * 0.5,
            });
        }

        setHeatMap(newHeat);
    };

    return { heatMap };
};

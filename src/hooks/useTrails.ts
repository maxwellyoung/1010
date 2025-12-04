import { useState, useEffect, useRef } from 'react';
import { useLocation } from '../context/LocationContext';

export interface TrailPoint {
    x: number;
    y: number;
    timestamp: number;
}

export const useTrails = () => {
    const { isInsideNetwork } = useLocation();
    const [currentTrail, setCurrentTrail] = useState<TrailPoint[]>([]);
    const [historicTrails, setHistoricTrails] = useState<TrailPoint[][]>([]);
    const [isResonating, setIsResonating] = useState(false);

    // Mock tracking loop
    useEffect(() => {
        if (!isInsideNetwork) return;

        const interval = setInterval(() => {
            // Simulate movement
            const newPoint = {
                x: Math.random() * 300,
                y: Math.random() * 300,
                timestamp: Date.now(),
            };

            setCurrentTrail(prev => [...prev, newPoint]);

            // Mock resonance check
            if (Math.random() > 0.8) {
                setIsResonating(true);
                setTimeout(() => setIsResonating(false), 2000);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [isInsideNetwork]);

    // Load mock historic trails
    useEffect(() => {
        const mockHistory = [
            Array.from({ length: 10 }, (_, i) => ({ x: i * 20, y: i * 10, timestamp: 0 })),
            Array.from({ length: 10 }, (_, i) => ({ x: 200 - i * 10, y: i * 20, timestamp: 0 })),
        ];
        setHistoricTrails(mockHistory);
    }, []);

    return { currentTrail, historicTrails, isResonating };
};

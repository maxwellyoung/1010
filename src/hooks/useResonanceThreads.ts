import { useEffect, useMemo, useRef, useState } from 'react';

type Encounter = {
    id: string;
    at: number;
} | null;

export type ResonanceThread = {
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    createdAt: number;
    ttlMs: number;
};

const randomPoint = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.25 + Math.random() * 0.6;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
    };
};

export const useResonanceThreads = (encounter: Encounter, demoMode: boolean) => {
    const [threads, setThreads] = useState<ResonanceThread[]>([]);
    const lastSeenByPeer = useRef<Record<string, { at: number; point: { x: number; y: number } }>>({});

    useEffect(() => {
        if (!encounter) {
            return;
        }

        const previous = lastSeenByPeer.current[encounter.id];
        const now = Date.now();
        const point = randomPoint();
        lastSeenByPeer.current[encounter.id] = { at: now, point };

        if (previous && now - previous.at < 7 * 24 * 60 * 60 * 1000) {
            setThreads(prev => [
                {
                    id: `${encounter.id}-${now}`,
                    from: previous.point,
                    to: point,
                    createdAt: now,
                    ttlMs: 7 * 24 * 60 * 60 * 1000,
                },
                ...prev,
            ].slice(0, 4));
        }
    }, [encounter?.id, encounter?.at]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setThreads(prev => prev.filter(thread => now - thread.createdAt < thread.ttlMs));
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!demoMode) {
            return;
        }
        const interval = setInterval(() => {
            const now = Date.now();
            setThreads(prev => [
                {
                    id: `demo-${now}`,
                    from: randomPoint(),
                    to: randomPoint(),
                    createdAt: now,
                    ttlMs: 5 * 60 * 1000,
                },
                ...prev,
            ].slice(0, 3));
        }, 18000);
        return () => clearInterval(interval);
    }, [demoMode]);

    return useMemo(() => threads, [threads]);
};

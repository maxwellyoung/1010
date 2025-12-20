import { useCallback, useEffect, useMemo, useState } from 'react';

export type PassingEcho = {
    id: string;
    x: number;
    y: number;
    createdAt: number;
    ttlMs: number;
    label: string;
};

type Encounter = {
    id: string;
    at: number;
} | null;

const echoLabel = (peerId?: string) => {
    if (!peerId) {
        return 'passing signal';
    }
    return `with ${peerId}`;
};

export const usePassingEchoes = (encounter: Encounter, demoMode: boolean) => {
    const [echoes, setEchoes] = useState<PassingEcho[]>([]);

    const addEcho = useCallback((label?: string) => {
        const now = Date.now();
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.15 + Math.random() * 0.65;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        setEchoes(prev => [
            {
                id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
                x,
                y,
                createdAt: now,
                ttlMs: 9000,
                label: label ?? 'passing signal',
            },
            ...prev,
        ]);
    }, []);

    useEffect(() => {
        if (!encounter) {
            return;
        }
        addEcho(echoLabel(encounter.id));
    }, [addEcho, encounter?.id, encounter?.at]);

    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setEchoes(prev => prev.filter(item => now - item.createdAt < item.ttlMs));
        }, 500);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!demoMode) {
            return;
        }
        const interval = setInterval(() => {
            addEcho();
        }, 7000);
        return () => clearInterval(interval);
    }, [addEcho, demoMode]);

    const activeEchoes = useMemo(() => echoes.slice(0, 6), [echoes]);

    return activeEchoes;
};

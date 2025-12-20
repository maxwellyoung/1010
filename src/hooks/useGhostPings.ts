import { useEffect, useMemo, useState } from 'react';

export type GhostPing = {
    id: string;
    x: number;
    y: number;
    ageMinutes: number;
};

const createGhosts = () => {
    const count = 4 + Math.floor(Math.random() * 4);
    return Array.from({ length: count }).map((_, index) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.25 + Math.random() * 0.65;
        return {
            id: `ghost-${Date.now()}-${index}`,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            ageMinutes: 5 + Math.floor(Math.random() * 11),
        };
    });
};

export const useGhostPings = (active: boolean) => {
    const [ghosts, setGhosts] = useState<GhostPing[]>(() => (active ? createGhosts() : []));

    useEffect(() => {
        if (!active) {
            setGhosts([]);
            return;
        }
        const interval = setInterval(() => {
            setGhosts(createGhosts());
        }, 20000);
        return () => clearInterval(interval);
    }, [active]);

    return useMemo(() => ghosts, [ghosts]);
};

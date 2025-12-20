import { useEffect, useMemo, useState } from 'react';

export type PatternWalk = {
    id: string;
    name: string;
    description: string;
    points: Array<{ x: number; y: number }>;
};

const walks: PatternWalk[] = [
    {
        id: 'arcade',
        name: 'ARCADE LOOP',
        description: 'Covered passages, tight turns, and a slow drift back.',
        points: [
            { x: -0.6, y: -0.4 },
            { x: -0.2, y: -0.5 },
            { x: 0.2, y: -0.2 },
            { x: 0.4, y: 0.1 },
            { x: 0.1, y: 0.4 },
            { x: -0.4, y: 0.3 },
        ],
    },
    {
        id: 'threshold',
        name: 'THRESHOLD RUN',
        description: 'Edges and crossings, a corridor of subtle shifts.',
        points: [
            { x: -0.5, y: 0.5 },
            { x: -0.1, y: 0.2 },
            { x: 0.3, y: 0.1 },
            { x: 0.6, y: -0.2 },
        ],
    },
    {
        id: 'harbour',
        name: 'HARBOUR TRACE',
        description: 'A line that grazes the water and bends inland.',
        points: [
            { x: -0.7, y: -0.1 },
            { x: -0.2, y: -0.2 },
            { x: 0.2, y: -0.1 },
            { x: 0.6, y: 0.2 },
        ],
    },
];

export const usePatternWalks = (demoMode: boolean, selectedId?: string | null) => {
    const [activeId, setActiveId] = useState(walks[0].id);

    useEffect(() => {
        if (selectedId) {
            setActiveId(selectedId);
        }
    }, [selectedId]);

    useEffect(() => {
        if (!demoMode) {
            return;
        }
        if (selectedId) {
            return;
        }
        const interval = setInterval(() => {
            setActiveId(prev => {
                const currentIndex = walks.findIndex(walk => walk.id === prev);
                const nextIndex = (currentIndex + 1) % walks.length;
                return walks[nextIndex].id;
            });
        }, 20000);
        return () => clearInterval(interval);
    }, [demoMode, selectedId]);

    return useMemo(() => {
        const active = walks.find(walk => walk.id === activeId) ?? walks[0];
        return { walks, active };
    }, [activeId]);
};

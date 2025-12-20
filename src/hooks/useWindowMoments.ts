import { useEffect, useMemo, useRef, useState } from 'react';

type WindowMoment = {
    isOpen: boolean;
    startedAt: number | null;
    endsAt: number | null;
    position: { x: number; y: number } | null;
};

const randomPoint = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.15 + Math.random() * 0.5;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
    };
};

export const useWindowMoments = (nearbyCount: number, demoMode: boolean) => {
    const [windowMoment, setWindowMoment] = useState<WindowMoment>({
        isOpen: false,
        startedAt: null,
        endsAt: null,
        position: null,
    });
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const openWindow = (durationMs: number) => {
        const now = Date.now();
        const position = randomPoint();
        setWindowMoment({ isOpen: true, startedAt: now, endsAt: now + durationMs, position });
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setWindowMoment(prev => ({ ...prev, isOpen: false }));
        }, durationMs);
    };

    useEffect(() => {
        if (windowMoment.isOpen) {
            return;
        }
        if (nearbyCount >= 2) {
            openWindow(7 * 60 * 1000);
        } else if (demoMode) {
            openWindow(90 * 1000);
        }
    }, [demoMode, nearbyCount, windowMoment.isOpen]);

    useEffect(() => () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    }, []);

    return useMemo(() => ({
        windowMoment,
        triggerWindow: () => openWindow(7 * 60 * 1000),
    }), [windowMoment]);
};

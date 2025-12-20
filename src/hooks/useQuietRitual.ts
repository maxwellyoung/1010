import { useCallback, useEffect, useRef, useState } from 'react';

type Nearby = {
    id: string;
    distance: number;
} | null;

export type RitualState = {
    active: boolean;
    phrase: string;
    startedAt: number | null;
    arming: boolean;
    armingProgress: number;
};

const ritualPhrases = [
    'HOLD STILL. THE CITY LISTENS.',
    'THE AIR THINS BETWEEN YOU.',
    'TWO SIGNALS, ONE BREATH.',
    'QUIET MAKES THE LINK.',
    'A STEP CLOSER, A LINE APPEARS.',
];

export const useQuietRitual = (nearby: Nearby, resonance: number) => {
    const [state, setState] = useState<RitualState>({
        active: false,
        phrase: ritualPhrases[0],
        startedAt: null,
        arming: false,
        armingProgress: 0,
    });

    const inRangeSince = useRef<number | null>(null);
    const activeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const armingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    const triggerRitual = useCallback(() => {
        const phrase = ritualPhrases[Math.floor(Math.random() * ritualPhrases.length)];
        setState({ active: true, phrase, startedAt: Date.now(), arming: false, armingProgress: 0 });
        if (activeTimeout.current) {
            clearTimeout(activeTimeout.current);
        }
        activeTimeout.current = setTimeout(() => {
            setState(prev => ({ ...prev, active: false }));
        }, 7000);
    }, []);

    useEffect(() => {
        const distance = nearby?.distance ?? -1;
        const inRange = distance >= 0 && distance <= 1.2 && resonance >= 0.6;

        if (!inRange) {
            inRangeSince.current = null;
            if (armingInterval.current) {
                clearInterval(armingInterval.current);
                armingInterval.current = null;
            }
            setState(prev => (prev.arming || prev.armingProgress !== 0 ? { ...prev, arming: false, armingProgress: 0 } : prev));
            return;
        }

        if (!inRangeSince.current) {
            inRangeSince.current = Date.now();
            setState(prev => ({ ...prev, arming: true }));
            if (!armingInterval.current) {
                armingInterval.current = setInterval(() => {
                    if (!inRangeSince.current) {
                        return;
                    }
                    const elapsed = Date.now() - inRangeSince.current;
                    const nextProgress = Math.min(1, elapsed / 4200);
                    setState(prev => ({ ...prev, arming: true, armingProgress: nextProgress }));
                }, 180);
            }
        }

        const dwellMs = Date.now() - (inRangeSince.current ?? Date.now());
        if (!state.active && dwellMs > 4200) {
            triggerRitual();
            inRangeSince.current = null;
            if (armingInterval.current) {
                clearInterval(armingInterval.current);
                armingInterval.current = null;
            }
        }
    }, [nearby?.distance, resonance, state.active, triggerRitual]);

    useEffect(() => () => {
        if (activeTimeout.current) {
            clearTimeout(activeTimeout.current);
        }
        if (armingInterval.current) {
            clearInterval(armingInterval.current);
        }
    }, []);

    return { ritual: state, triggerRitual };
};

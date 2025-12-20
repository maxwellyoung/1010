import { useEffect, useMemo, useState } from 'react';

type BreathState = {
    label: string;
    periodMs: number;
    intensity: number;
};

const baseBreathForHour = (hour: number) => {
    if (hour >= 2 && hour < 6) return { label: 'DORMANT', periodMs: 9000, intensity: 0.1 };
    if (hour >= 6 && hour < 11) return { label: 'SOFT', periodMs: 6500, intensity: 0.16 };
    if (hour >= 11 && hour < 15) return { label: 'PULSE', periodMs: 4200, intensity: 0.22 };
    if (hour >= 15 && hour < 19) return { label: 'FLOW', periodMs: 5200, intensity: 0.2 };
    if (hour >= 19 && hour < 24) return { label: 'LOW', periodMs: 7200, intensity: 0.14 };
    return { label: 'DRIFT', periodMs: 8200, intensity: 0.12 };
};

export const useCityBreath = (pingDensity: number) => {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        const interval = setInterval(() => setNow(Date.now()), 60000);
        return () => clearInterval(interval);
    }, []);

    return useMemo<BreathState>(() => {
        const hour = new Date(now).getHours();
        const base = baseBreathForHour(hour);
        const density = Math.min(Math.max(pingDensity / 4, 0), 1);
        const periodMs = Math.max(3200, Math.round(base.periodMs * (1 - density * 0.18)));
        const intensity = Math.min(0.4, base.intensity + density * 0.12);
        return { label: base.label, periodMs, intensity };
    }, [now, pingDensity]);
};

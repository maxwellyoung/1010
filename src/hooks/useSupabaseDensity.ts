import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type DensityEvent = {
    cellId: string;
    at: number;
};

const WINDOW_MS = 5 * 60 * 1000;
const SEND_INTERVAL_MS = 30000;

const getCellId = (latitude: number, longitude: number) => {
    const latKey = Math.round(latitude * 500);
    const lngKey = Math.round(longitude * 500);
    return `${latKey}:${lngKey}`;
};

export const useSupabaseDensity = (coords?: { latitude: number; longitude: number }) => {
    const [densityScore, setDensityScore] = useState(0);
    const [cellId, setCellId] = useState<string | null>(null);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const eventsByCellRef = useRef<Record<string, number[]>>({});
    const sendIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (!coords) {
            setCellId(null);
            return;
        }
        setCellId(getCellId(coords.latitude, coords.longitude));
    }, [coords?.latitude, coords?.longitude]);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            return;
        }

        const channel = supabase.channel('density-1010', {
            config: {
                broadcast: { self: true },
            },
        });

        channel
            .on('broadcast', { event: 'density' }, payload => {
                const data = payload.payload as DensityEvent | undefined;
                if (!data) return;
                const list = eventsByCellRef.current[data.cellId] ?? [];
                list.push(data.at);
                eventsByCellRef.current[data.cellId] = list;
                if (data.cellId === cellId) {
                    setDensityScore(computeDensity(list));
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [cellId]);

    useEffect(() => {
        if (!isSupabaseConfigured || !cellId || !channelRef.current) {
            return;
        }
        const sendPing = () => {
            const now = Date.now();
            channelRef.current?.send({
                type: 'broadcast',
                event: 'density',
                payload: { cellId, at: now },
            });
        };
        sendPing();
        sendIntervalRef.current = setInterval(sendPing, SEND_INTERVAL_MS);
        return () => {
            if (sendIntervalRef.current) {
                clearInterval(sendIntervalRef.current);
                sendIntervalRef.current = null;
            }
        };
    }, [cellId]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!cellId) return;
            const list = eventsByCellRef.current[cellId] ?? [];
            const now = Date.now();
            const trimmed = list.filter(ts => now - ts < WINDOW_MS);
            eventsByCellRef.current[cellId] = trimmed;
            setDensityScore(computeDensity(trimmed));
        }, 15000);
        return () => clearInterval(interval);
    }, [cellId]);

    return useMemo(() => ({ densityScore, cellId }), [densityScore, cellId]);
};

const computeDensity = (timestamps: number[]) => {
    const count = timestamps.length;
    if (count <= 1) return 0;
    if (count <= 3) return 1;
    if (count <= 6) return 2;
    if (count <= 10) return 3;
    return 4;
};

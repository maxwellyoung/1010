import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { GhostPing } from './useGhostPings';

export type WindowMomentSignal = {
    isOpen: boolean;
    startedAt: number | null;
    endsAt: number | null;
    position: { x: number; y: number } | null;
};

const MAX_GHOSTS = 8;
const GHOST_TTL_MS = 15 * 60 * 1000;

type StoredGhost = GhostPing & { receivedAt: number };

export const useSupabaseSignals = () => {
    const [ghostPings, setGhostPings] = useState<StoredGhost[]>([]);
    const [windowMoment, setWindowMoment] = useState<WindowMomentSignal>({
        isOpen: false,
        startedAt: null,
        endsAt: null,
        position: null,
    });
    const [presenceCount, setPresenceCount] = useState(0);
    const [recentPresenceCount, setRecentPresenceCount] = useState(0);
    const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
    const presenceKeyRef = useRef(`node-${Math.random().toString(36).slice(2, 8)}`);

    useEffect(() => {
        if (!isSupabaseConfigured) {
            return;
        }

        const channel = supabase.channel('signals-1010', {
            config: {
                broadcast: { self: false },
                presence: { key: presenceKeyRef.current },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState();
                setPresenceCount(Object.keys(state).length);
                setRecentPresenceCount(countRecentPresence(state));
            })
            .on('presence', { event: 'join' }, () => {
                const state = channel.presenceState();
                setPresenceCount(Object.keys(state).length);
                setRecentPresenceCount(countRecentPresence(state));
            })
            .on('presence', { event: 'leave' }, () => {
                const state = channel.presenceState();
                setPresenceCount(Object.keys(state).length);
                setRecentPresenceCount(countRecentPresence(state));
            })
            .on('broadcast', { event: 'ghost' }, payload => {
                const data = payload.payload as GhostPing | undefined;
                if (!data) return;
                setGhostPings(prev => [{ ...data, receivedAt: Date.now() }, ...prev].slice(0, MAX_GHOSTS));
            })
            .on('broadcast', { event: 'window' }, payload => {
                const data = payload.payload as WindowMomentSignal | undefined;
                if (!data) return;
                setWindowMoment({ ...data, isOpen: true });
            })
            .subscribe(status => {
                if (status === 'SUBSCRIBED') {
                    channel.track({ online_at: new Date().toISOString() });
                }
            });

        channelRef.current = channel;

        const cleanup = setInterval(() => {
            const now = Date.now();
            setGhostPings(prev => prev.filter(ghost => now - ghost.receivedAt < GHOST_TTL_MS));
            setWindowMoment(prev => {
                if (!prev.endsAt || prev.endsAt < now) {
                    return { isOpen: false, startedAt: null, endsAt: null, position: null };
                }
                return prev;
            });
        }, 10000);

        return () => {
            clearInterval(cleanup);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, []);

    const sendGhostPing = useCallback(async (ghost: GhostPing) => {
        if (!isSupabaseConfigured || !channelRef.current) return;
        await channelRef.current.send({ type: 'broadcast', event: 'ghost', payload: ghost });
    }, []);

    const sendWindowMoment = useCallback(async (moment: WindowMomentSignal) => {
        if (!isSupabaseConfigured || !channelRef.current) return;
        await channelRef.current.send({ type: 'broadcast', event: 'window', payload: moment });
    }, []);

    const mappedGhostPings = useMemo(
        () => ghostPings.map(({ receivedAt, ...ghost }) => ghost),
        [ghostPings]
    );

    return useMemo(() => ({
        ghostPings: mappedGhostPings,
        windowMoment,
        sendGhostPing,
        sendWindowMoment,
        isConfigured: isSupabaseConfigured,
        presenceCount,
        recentPresenceCount,
    }), [mappedGhostPings, windowMoment, sendGhostPing, sendWindowMoment, presenceCount, recentPresenceCount]);
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const countRecentPresence = (state: Record<string, any[]>) => {
    const now = Date.now();
    const cutoff = now - 15 * 60 * 1000;
    return Object.values(state).reduce((count, presences) => {
        const latest = presences
            .map((presence: { online_at?: string }) => (presence.online_at ? Date.parse(presence.online_at) : 0))
            .sort((a: number, b: number) => b - a)[0];
        if (latest && latest >= cutoff) {
            return count + 1;
        }
        return count;
    }, 0);
};

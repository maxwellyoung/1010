import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured, getCurrentUserId } from '../lib/supabase';

export type WindowMoment = {
    isOpen: boolean;
    startedAt: number | null;
    endsAt: number | null;
    position: { x: number; y: number } | null;
    triggeredBy?: string;
};

const WINDOW_DURATION_MS = 7 * 60 * 1000; // 7 minutes
const DEMO_DURATION_MS = 90 * 1000; // 90 seconds for demo
const MIN_INTERVAL_MS = 30 * 60 * 1000; // Minimum 30 minutes between windows
const TRIGGER_THRESHOLD = 2; // Need 2+ peers to trigger

const randomPoint = () => {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.15 + Math.random() * 0.5;
    return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
    };
};

export const useWindowMoments = (
    localPeerCount: number,
    realtimePresenceCount: number,
    demoMode: boolean
) => {
    const [windowMoment, setWindowMoment] = useState<WindowMoment>({
        isOpen: false,
        startedAt: null,
        endsAt: null,
        position: null,
    });

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastWindowTimeRef = useRef<number>(0);
    const triggerDebounceRef = useRef<boolean>(false);
    const effectivePeerCountRef = useRef<number>(0);

    // Combined peer count: max of local proximity and realtime presence
    const effectivePeerCount = Math.max(localPeerCount, realtimePresenceCount);

    // Keep ref in sync for use in delayed callbacks
    useEffect(() => {
        effectivePeerCountRef.current = effectivePeerCount;
    }, [effectivePeerCount]);

    const openWindow = useCallback(async (durationMs: number, isDemo: boolean = false) => {
        // Debounce rapid triggers
        if (triggerDebounceRef.current) return;
        triggerDebounceRef.current = true;
        setTimeout(() => {
            triggerDebounceRef.current = false;
        }, 5000);

        const now = Date.now();
        const position = randomPoint();

        setWindowMoment({
            isOpen: true,
            startedAt: now,
            endsAt: now + durationMs,
            position,
        });

        lastWindowTimeRef.current = now;

        // Clear any existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Schedule window close
        timeoutRef.current = setTimeout(() => {
            setWindowMoment(prev => ({ ...prev, isOpen: false }));
        }, durationMs);

        // Save to Supabase if not demo
        if (!isDemo && isSupabaseConfigured) {
            const userId = await getCurrentUserId();
            if (userId) {
                const { error } = await supabase.from('window_moments').insert({
                    started_at: new Date(now).toISOString(),
                    ends_at: new Date(now + durationMs).toISOString(),
                    position_x: position.x,
                    position_y: position.y,
                    triggered_by: userId,
                    participant_count: effectivePeerCount,
                });

                if (error) {
                    console.warn('[WINDOW] Failed to save:', error.message);
                } else {
                    console.log('[WINDOW] Moment saved');
                }
            }
        }
    }, [effectivePeerCount]);

    const closeWindow = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setWindowMoment(prev => ({ ...prev, isOpen: false }));
    }, []);

    // Manual trigger for demo/testing
    const triggerWindow = useCallback(() => {
        openWindow(WINDOW_DURATION_MS, true);
    }, [openWindow]);

    // Check trigger conditions
    useEffect(() => {
        // Don't trigger if already open
        if (windowMoment.isOpen) return;

        // Check minimum interval
        const now = Date.now();
        if (now - lastWindowTimeRef.current < MIN_INTERVAL_MS) return;

        // Demo mode: trigger immediately
        if (demoMode) {
            openWindow(DEMO_DURATION_MS, true);
            return;
        }

        // Real trigger: need 2+ peers
        if (effectivePeerCount >= TRIGGER_THRESHOLD) {
            // Add random delay (10-60 seconds) to avoid all devices triggering at once
            const delay = 10000 + Math.random() * 50000;
            const triggerTimeout = setTimeout(() => {
                // Re-check conditions after delay using ref for current value
                if (effectivePeerCountRef.current >= TRIGGER_THRESHOLD) {
                    openWindow(WINDOW_DURATION_MS);
                }
            }, delay);

            return () => clearTimeout(triggerTimeout);
        }
    }, [demoMode, effectivePeerCount, windowMoment.isOpen, openWindow]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return useMemo(() => ({
        windowMoment,
        triggerWindow,
        closeWindow,
        effectivePeerCount,
    }), [windowMoment, triggerWindow, closeWindow, effectivePeerCount]);
};

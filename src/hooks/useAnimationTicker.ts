import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';

/**
 * Unified Animation Ticker
 *
 * Consolidates multiple intervals into a single timer to reduce CPU wake-ups.
 * Subscribers register callbacks with their desired tick interval.
 *
 * Tick Layers (aligned with Motion hierarchy):
 * - fast (500ms): Cleanup, state checks
 * - ambient (2400ms): Glyphs, echoes, visual updates
 * - slow (10000ms): Trail tracking, data sync
 * - background (60000ms): Stats refresh, presence pings
 */

type TickLayer = 'fast' | 'ambient' | 'slow' | 'background';

type Subscriber = {
    id: string;
    callback: () => void;
    layer: TickLayer;
    lastTick: number;
};

const TICK_INTERVALS: Record<TickLayer, number> = {
    fast: 500,
    ambient: 2400,
    slow: 10000,
    background: 60000,
};

// Global ticker instance
let subscribers: Subscriber[] = [];
let tickerInterval: ReturnType<typeof setInterval> | null = null;
let isRunning = false;
let lastTickTime = 0;

const BASE_TICK = 500; // Base interval for the unified ticker

const tick = () => {
    const now = Date.now();

    for (const sub of subscribers) {
        const interval = TICK_INTERVALS[sub.layer];
        if (now - sub.lastTick >= interval) {
            try {
                sub.callback();
            } catch (err) {
                console.warn(`[TICKER] Error in ${sub.id}:`, err);
            }
            sub.lastTick = now;
        }
    }

    lastTickTime = now;
};

const startTicker = () => {
    if (isRunning || subscribers.length === 0) return;

    isRunning = true;
    tickerInterval = setInterval(tick, BASE_TICK);
    console.log('[TICKER] Started with', subscribers.length, 'subscribers');
};

const stopTicker = () => {
    if (!isRunning) return;

    isRunning = false;
    if (tickerInterval) {
        clearInterval(tickerInterval);
        tickerInterval = null;
    }
    console.log('[TICKER] Stopped');
};

const subscribe = (id: string, callback: () => void, layer: TickLayer): (() => void) => {
    // Remove existing subscription with same ID
    subscribers = subscribers.filter(s => s.id !== id);

    subscribers.push({
        id,
        callback,
        layer,
        lastTick: Date.now(),
    });

    if (!isRunning) {
        startTicker();
    }

    // Return unsubscribe function
    return () => {
        subscribers = subscribers.filter(s => s.id !== id);
        if (subscribers.length === 0) {
            stopTicker();
        }
    };
};

/**
 * Hook to subscribe to the animation ticker
 *
 * @param id - Unique identifier for this subscription
 * @param callback - Function to call on each tick
 * @param layer - Tick layer determining frequency
 * @param enabled - Whether the subscription is active
 */
export function useAnimationTicker(
    id: string,
    callback: () => void,
    layer: TickLayer,
    enabled: boolean = true
) {
    const callbackRef = useRef(callback);
    callbackRef.current = callback;

    const stableCallback = useCallback(() => {
        callbackRef.current();
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const unsubscribe = subscribe(id, stableCallback, layer);
        return unsubscribe;
    }, [id, stableCallback, layer, enabled]);
}

/**
 * Hook to manage ticker lifecycle with app state
 */
export function useTickerLifecycle() {
    useEffect(() => {
        const handleAppState = (state: AppStateStatus) => {
            if (state === 'active') {
                if (subscribers.length > 0 && !isRunning) {
                    startTicker();
                }
            } else {
                stopTicker();
            }
        };

        const subscription = AppState.addEventListener('change', handleAppState);

        return () => {
            subscription.remove();
            stopTicker();
        };
    }, []);
}

// Export for debugging
export const getTickerStats = () => ({
    subscriberCount: subscribers.length,
    isRunning,
    lastTickTime,
    subscribers: subscribers.map(s => ({ id: s.id, layer: s.layer })),
});

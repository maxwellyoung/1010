import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Proximity } from '../native/Proximity';

/**
 * Companion System - Journey-inspired
 *
 * Anonymous travelers in the field.
 * No names. No profiles. Just presence.
 * They appear, chirp, travel alongside, fade away.
 */

export interface Companion {
    id: string;
    // Position in normalized space (-1 to 1)
    x: number;
    y: number;
    // State
    isNearby: boolean;
    distance: number; // meters
    resonance: number; // 0-1 based on proximity
    // Animation triggers
    isChirping: boolean;
    chirpCount: number;
    // Timing
    firstSeenAt: number;
    lastSeenAt: number;
    // Movement
    driftX: number; // Slow wander direction
    driftY: number;
}

interface CompanionState {
    companions: Map<string, Companion>;
}

const MAX_COMPANIONS = 5;
const CHIRP_DURATION_MS = 1200;
const DRIFT_SPEED = 0.002; // Very slow wander

// Generate subtle random drift
const randomDrift = () => (Math.random() - 0.5) * DRIFT_SPEED;

export const useCompanions = (
    peerStates: Record<string, number>,
    nearby: { id: string; distance: number; direction: number[] } | null
) => {
    const [companions, setCompanions] = useState<Map<string, Companion>>(new Map());
    const chirpTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
    const driftInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Create or update companion from peer
    const updateCompanion = useCallback((peerId: string, isConnected: boolean, distance: number = 3) => {
        const now = Date.now();

        setCompanions(prev => {
            const next = new Map(prev);

            if (!isConnected) {
                // Peer disconnected - companion fades away
                const existing = next.get(peerId);
                if (existing) {
                    // Keep for fade-out animation, mark as not nearby
                    next.set(peerId, {
                        ...existing,
                        isNearby: false,
                        resonance: 0,
                        lastSeenAt: now,
                    });
                }
                return next;
            }

            const existing = next.get(peerId);
            const resonance = 1 - Math.min(distance / 3, 1);

            if (existing) {
                // Update existing companion
                next.set(peerId, {
                    ...existing,
                    isNearby: true,
                    distance,
                    resonance,
                    lastSeenAt: now,
                });
            } else {
                // New companion - appears at random position
                const angle = Math.random() * Math.PI * 2;
                const radius = 0.3 + Math.random() * 0.5;
                next.set(peerId, {
                    id: peerId,
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    isNearby: true,
                    distance,
                    resonance,
                    isChirping: false,
                    chirpCount: 0,
                    firstSeenAt: now,
                    lastSeenAt: now,
                    driftX: randomDrift(),
                    driftY: randomDrift(),
                });
            }

            // Limit total companions
            if (next.size > MAX_COMPANIONS) {
                const sorted = Array.from(next.entries())
                    .sort((a, b) => b[1].lastSeenAt - a[1].lastSeenAt)
                    .slice(0, MAX_COMPANIONS);
                return new Map(sorted);
            }

            return next;
        });
    }, []);

    // Sync with peer states
    useEffect(() => {
        for (const [peerId, state] of Object.entries(peerStates)) {
            const isConnected = state === 2;
            const distance = nearby?.id === peerId ? nearby.distance : 3;
            updateCompanion(peerId, isConnected, distance);
        }
    }, [peerStates, nearby, updateCompanion]);

    // Update nearby companion's distance
    useEffect(() => {
        if (!nearby || nearby.distance < 0) return;

        setCompanions(prev => {
            const next = new Map(prev);
            const existing = next.get(nearby.id);
            if (existing) {
                const resonance = 1 - Math.min(nearby.distance / 3, 1);
                next.set(nearby.id, {
                    ...existing,
                    distance: nearby.distance,
                    resonance,
                    lastSeenAt: Date.now(),
                });
            }
            return next;
        });
    }, [nearby?.id, nearby?.distance]);

    // Trigger a companion chirp (visual pulse + haptic)
    const chirp = useCallback((companionId: string) => {
        // Clear existing chirp timeout
        const existingTimeout = chirpTimeouts.current.get(companionId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }

        // Set chirping state
        setCompanions(prev => {
            const next = new Map(prev);
            const companion = next.get(companionId);
            if (companion) {
                next.set(companionId, {
                    ...companion,
                    isChirping: true,
                    chirpCount: companion.chirpCount + 1,
                });
            }
            return next;
        });

        // Haptic feedback
        Proximity.triggerHaptic('light');

        // Clear chirp after duration
        const timeout = setTimeout(() => {
            setCompanions(prev => {
                const next = new Map(prev);
                const companion = next.get(companionId);
                if (companion) {
                    next.set(companionId, {
                        ...companion,
                        isChirping: false,
                    });
                }
                return next;
            });
            chirpTimeouts.current.delete(companionId);
        }, CHIRP_DURATION_MS);

        chirpTimeouts.current.set(companionId, timeout);
    }, []);

    // Slow drift animation for companions
    useEffect(() => {
        driftInterval.current = setInterval(() => {
            setCompanions(prev => {
                const next = new Map(prev);
                for (const [id, companion] of next) {
                    if (companion.isNearby) {
                        // Very slow wander
                        let newX = companion.x + companion.driftX;
                        let newY = companion.y + companion.driftY;

                        // Bounce off edges gently
                        if (Math.abs(newX) > 0.85) companion.driftX *= -1;
                        if (Math.abs(newY) > 0.85) companion.driftY *= -1;

                        // Occasionally change direction
                        if (Math.random() < 0.02) {
                            companion.driftX = randomDrift();
                            companion.driftY = randomDrift();
                        }

                        next.set(id, {
                            ...companion,
                            x: Math.max(-0.9, Math.min(0.9, newX)),
                            y: Math.max(-0.9, Math.min(0.9, newY)),
                        });
                    }
                }
                return next;
            });
        }, 500);

        return () => {
            if (driftInterval.current) {
                clearInterval(driftInterval.current);
            }
        };
    }, []);

    // Clean up stale companions
    useEffect(() => {
        const cleanup = setInterval(() => {
            const now = Date.now();
            const staleThreshold = 30000; // 30 seconds

            setCompanions(prev => {
                const next = new Map(prev);
                for (const [id, companion] of next) {
                    if (!companion.isNearby && now - companion.lastSeenAt > staleThreshold) {
                        next.delete(id);
                    }
                }
                return next;
            });
        }, 10000);

        return () => clearInterval(cleanup);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            for (const timeout of chirpTimeouts.current.values()) {
                clearTimeout(timeout);
            }
            chirpTimeouts.current.clear();
        };
    }, []);

    // Get active companions as array
    const activeCompanions = useMemo(() => {
        return Array.from(companions.values()).filter(c => c.isNearby || Date.now() - c.lastSeenAt < 5000);
    }, [companions]);

    // Emit a chirp from user (all companions can "hear" it)
    const userChirp = useCallback(() => {
        Proximity.triggerHaptic('medium');
        // Could trigger visual response in companions
    }, []);

    return {
        companions: activeCompanions,
        chirp,
        userChirp,
        totalCompanions: companions.size,
    };
};

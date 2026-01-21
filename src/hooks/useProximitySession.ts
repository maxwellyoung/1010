import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AppState } from 'react-native';
import { useMutation } from 'convex/react';
import { Proximity } from '../native/Proximity';
import { isConvexConfigured, getDeviceId } from '../lib/convex';
import { api } from '../../convex/_generated/api';
import { useLocation } from '../context/LocationContext';

type PeerState = Record<string, number>;

type NearbyObject = {
    id: string;
    distance: number;
    direction: number[];
};

export type Encounter = {
    id: string;
    peerId: string;
    at: number;
    durationMs: number;
    maxResonance: number;
    ritualTriggered: boolean;
    lat?: number;
    lng?: number;
};

// Event types for proximity native module
type PeerFoundEvent = { id: string };
type PeerLostEvent = { id: string };
type SessionStateEvent = { id: string; state: number };
type NearbyUpdateEvent = { objects: NearbyObject[] };

export const useProximitySession = (displayName?: string) => {
    const { location } = useLocation();
    const [isActive, setIsActive] = useState(false);
    const [peerStates, setPeerStates] = useState<PeerState>({});
    const [lastEncounter, setLastEncounter] = useState<Encounter | null>(null);
    const [encounters, setEncounters] = useState<Encounter[]>([]);
    const [nearby, setNearby] = useState<NearbyObject | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const [deviceId, setDeviceId] = useState<string | null>(null);

    const startedRef = useRef(false);
    const encounterStartRef = useRef<Map<string, { at: number; maxResonance: number }>>(new Map());

    // Convex mutation
    const insertEncounter = useMutation(api.mutations.encounters.insertEncounter);

    // Initialize device ID
    useEffect(() => {
        if (isConvexConfigured) {
            getDeviceId().then(setDeviceId);
        }
    }, []);

    const start = useCallback(() => {
        if (!Proximity.isSupported || startedRef.current) {
            return;
        }
        Proximity.start({ displayName });
        startedRef.current = true;
        setIsActive(true);
    }, [displayName]);

    const stop = useCallback(() => {
        if (!Proximity.isSupported || !startedRef.current) {
            return;
        }
        Proximity.stop();
        startedRef.current = false;
        setIsActive(false);
    }, []);

    // Save encounter to Convex
    const saveEncounter = useCallback(async (encounter: Encounter) => {
        if (!isConvexConfigured || !deviceId) return;

        try {
            await insertEncounter({
                deviceA: deviceId,
                deviceB: encounter.peerId,
                lat: encounter.lat,
                lng: encounter.lng,
                durationMs: encounter.durationMs,
                maxResonance: encounter.maxResonance,
                ritualTriggered: encounter.ritualTriggered,
            });
            console.log('[PROXIMITY] Encounter saved');
        } catch (err) {
            console.error('[PROXIMITY] Error saving encounter:', err);
        }
    }, [deviceId, insertEncounter]);

    // Finalize an encounter when peer is lost
    const finalizeEncounter = useCallback((peerId: string, ritualTriggered: boolean = false) => {
        const startData = encounterStartRef.current.get(peerId);
        if (!startData) return;

        const now = Date.now();
        const durationMs = now - startData.at;

        // Only record encounters longer than 2 seconds
        if (durationMs < 2000) {
            encounterStartRef.current.delete(peerId);
            return;
        }

        const encounter: Encounter = {
            id: `${peerId}-${startData.at}`,
            peerId,
            at: startData.at,
            durationMs,
            maxResonance: startData.maxResonance,
            ritualTriggered,
            lat: location?.coords.latitude,
            lng: location?.coords.longitude,
        };

        setEncounters(prev => [...prev.slice(-9), encounter]); // Keep last 10
        setLastEncounter(encounter);
        saveEncounter(encounter);
        encounterStartRef.current.delete(peerId);
    }, [location, saveEncounter]);

    // Mark encounter as having triggered ritual
    const markRitualTriggered = useCallback((peerId: string) => {
        finalizeEncounter(peerId, true);
    }, [finalizeEncounter]);

    useEffect(() => {
        if (!Proximity.isSupported) {
            return;
        }

        start();

        const appStateSub = AppState.addEventListener('change', nextState => {
            if (nextState === 'active') {
                start();
            } else {
                stop();
            }
        });

        const subs = [
            Proximity.addListener('onPeerFound', (event) => {
                const { id } = event as PeerFoundEvent;
                setPeerStates(prev => ({ ...prev, [id]: 1 }));
            }),
            Proximity.addListener('onPeerLost', (event) => {
                const { id } = event as PeerLostEvent;
                // Finalize encounter before removing peer
                finalizeEncounter(id);

                setPeerStates(prev => {
                    const next = { ...prev };
                    delete next[id];
                    return next;
                });
            }),
            Proximity.addListener('onSessionState', (event) => {
                const { id, state } = event as SessionStateEvent;
                setPeerStates(prev => ({ ...prev, [id]: state }));

                // State 2 = connected, start tracking encounter
                if (state === 2) {
                    if (!encounterStartRef.current.has(id)) {
                        encounterStartRef.current.set(id, {
                            at: Date.now(),
                            maxResonance: 0,
                        });
                    }
                }
            }),
            Proximity.addListener('onNearbyUpdate', (event) => {
                const { objects } = event as NearbyUpdateEvent;
                const best = objects
                    .filter((obj: NearbyObject) => obj.distance >= 0)
                    .sort((a: NearbyObject, b: NearbyObject) => a.distance - b.distance)[0];

                if (best) {
                    setNearby(best);

                    // Update max resonance for this encounter
                    const startData = encounterStartRef.current.get(best.id);
                    if (startData) {
                        const resonance = 1 - Math.min(best.distance / 3, 1);
                        if (resonance > startData.maxResonance) {
                            startData.maxResonance = resonance;
                        }
                    }
                }
            }),
            Proximity.addListener('onError', (event) => {
                const { source, message } = event as { source: string; message: string };
                setLastError(`${source}: ${message}`);
            })
        ];

        return () => {
            appStateSub.remove();
            subs.forEach(sub => sub.remove());
            stop();
        };
    }, [start, stop, finalizeEncounter]);

    const resonance = useMemo(() => {
        if (!nearby || nearby.distance < 0) {
            return 0;
        }
        const normalized = 1 - Math.min(nearby.distance / 3, 1);
        return Math.max(0, normalized);
    }, [nearby]);

    // Count of connected peers (state === 2)
    const connectedPeerCount = useMemo(() => {
        return Object.values(peerStates).filter(state => state === 2).length;
    }, [peerStates]);

    return {
        isActive,
        peerStates,
        lastEncounter,
        encounters,
        nearby,
        resonance,
        lastError,
        connectedPeerCount,
        markRitualTriggered,
    };
};

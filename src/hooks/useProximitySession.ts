import { useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Proximity } from '../native/Proximity';

type PeerState = Record<string, number>;

type NearbyObject = {
    id: string;
    distance: number;
    direction: number[];
};

export const useProximitySession = (displayName?: string) => {
    const [isActive, setIsActive] = useState(false);
    const [peerStates, setPeerStates] = useState<PeerState>({});
    const [lastEncounter, setLastEncounter] = useState<{ id: string; at: number } | null>(null);
    const [nearby, setNearby] = useState<NearbyObject | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);
    const startedRef = useRef(false);

    const start = () => {
        if (!Proximity.isSupported || startedRef.current) {
            return;
        }
        Proximity.start({ displayName });
        startedRef.current = true;
        setIsActive(true);
    };

    const stop = () => {
        if (!Proximity.isSupported || !startedRef.current) {
            return;
        }
        Proximity.stop();
        startedRef.current = false;
        setIsActive(false);
    };

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
            Proximity.addListener('onPeerFound', event => {
                setPeerStates(prev => ({ ...prev, [event.id]: 1 }));
            }),
            Proximity.addListener('onPeerLost', event => {
                setPeerStates(prev => {
                    const next = { ...prev };
                    delete next[event.id];
                    return next;
                });
            }),
            Proximity.addListener('onSessionState', event => {
                setPeerStates(prev => ({ ...prev, [event.id]: event.state }));
                if (event.state === 2) {
                    setLastEncounter({ id: event.id, at: Date.now() });
                }
            }),
            Proximity.addListener('onNearbyUpdate', event => {
                const best = event.objects
                    .filter(obj => obj.distance >= 0)
                    .sort((a, b) => a.distance - b.distance)[0];
                if (best) {
                    setNearby(best);
                }
            }),
            Proximity.addListener('onError', event => {
                setLastError(`${event.source}: ${event.message}`);
            })
        ];

        return () => {
            appStateSub.remove();
            subs.forEach(sub => sub.remove());
            stop();
        };
    }, [displayName]);

    const resonance = useMemo(() => {
        if (!nearby || nearby.distance < 0) {
            return 0;
        }
        const normalized = 1 - Math.min(nearby.distance / 3, 1);
        return Math.max(0, normalized);
    }, [nearby]);

    return {
        isActive,
        peerStates,
        lastEncounter,
        nearby,
        resonance,
        lastError
    };
};

import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type ProximityEvent =
    | { type: 'onPeerFound'; id: string }
    | { type: 'onPeerLost'; id: string }
    | { type: 'onSessionState'; id: string; state: number }
    | { type: 'onMessage'; id: string; payload: Record<string, unknown> }
    | { type: 'onNearbyUpdate'; objects: Array<{ id: string; distance: number; direction: number[] }> }
    | { type: 'onError'; source: string; message: string };

const Native = NativeModules.ProximityModule;
const emitter = Native ? new NativeEventEmitter(Native) : null;

export const Proximity = {
    isSupported: Platform.OS === 'ios' && !!Native,
    start(options?: { displayName?: string }) {
        if (!Native) {
            return;
        }
        Native.start(options ?? {});
    },
    stop() {
        if (!Native) {
            return;
        }
        Native.stop();
    },
    sendMessage(payload: Record<string, unknown>) {
        if (!Native) {
            return;
        }
        Native.sendMessage(payload);
    },
    triggerHaptic(style: 'light' | 'medium' | 'heavy' | 'soft' | 'rigid' = 'light') {
        if (!Native) {
            return;
        }
        Native.triggerHaptic(style);
    },
    addListener(
        eventName: ProximityEvent['type'],
        handler: (payload: Extract<ProximityEvent, { type: typeof eventName }>) => void
    ) {
        if (!emitter) {
            return { remove: () => {} };
        }
        return emitter.addListener(eventName, (payload: any) => handler({ type: eventName, ...payload }));
    }
};

import { useReducer, useCallback, useEffect, useRef } from 'react';

/**
 * Demo Mode State
 *
 * Consolidates all demo-related state into a single reducer.
 * Inspired by Dan Abramov's clarity: explicit state transitions,
 * predictable updates, easy debugging.
 */

export interface DemoState {
    // Feature toggles
    passingEchoes: boolean;
    ghostPings: boolean;
    glyphs: boolean;
    threads: boolean;
    windows: boolean;
    patternWalks: boolean;

    // Demo sequence
    sequenceActive: boolean;
    sequenceStep: number;

    // Presentation mode
    presentationMode: boolean;

    // Manual triggers
    windowAlertOpen: boolean;
}

type DemoAction =
    | { type: 'TOGGLE_FEATURE'; feature: keyof Pick<DemoState, 'passingEchoes' | 'ghostPings' | 'glyphs' | 'threads' | 'windows' | 'patternWalks'> }
    | { type: 'SET_FEATURE'; feature: keyof Pick<DemoState, 'passingEchoes' | 'ghostPings' | 'glyphs' | 'threads' | 'windows' | 'patternWalks'>; value: boolean }
    | { type: 'ENABLE_ALL_FEATURES' }
    | { type: 'DISABLE_ALL_FEATURES' }
    | { type: 'START_SEQUENCE' }
    | { type: 'STOP_SEQUENCE' }
    | { type: 'ADVANCE_SEQUENCE' }
    | { type: 'TOGGLE_PRESENTATION' }
    | { type: 'SET_PRESENTATION'; value: boolean }
    | { type: 'TOGGLE_WINDOW_ALERT' }
    | { type: 'SET_WINDOW_ALERT'; value: boolean }
    | { type: 'RESET' };

const initialState: DemoState = {
    passingEchoes: true,
    ghostPings: true,
    glyphs: true,
    threads: true,
    windows: true,
    patternWalks: true,
    sequenceActive: false,
    sequenceStep: 0,
    presentationMode: false,
    windowAlertOpen: false,
};

function demoReducer(state: DemoState, action: DemoAction): DemoState {
    switch (action.type) {
        case 'TOGGLE_FEATURE':
            return { ...state, [action.feature]: !state[action.feature] };

        case 'SET_FEATURE':
            return { ...state, [action.feature]: action.value };

        case 'ENABLE_ALL_FEATURES':
            return {
                ...state,
                passingEchoes: true,
                ghostPings: true,
                glyphs: true,
                threads: true,
                windows: true,
                patternWalks: true,
            };

        case 'DISABLE_ALL_FEATURES':
            return {
                ...state,
                passingEchoes: false,
                ghostPings: false,
                glyphs: false,
                threads: false,
                windows: false,
                patternWalks: false,
            };

        case 'START_SEQUENCE':
            return {
                ...state,
                sequenceActive: true,
                sequenceStep: 0,
                passingEchoes: true,
                ghostPings: true,
                glyphs: true,
                threads: true,
                windows: true,
                patternWalks: true,
            };

        case 'STOP_SEQUENCE':
            return { ...state, sequenceActive: false, sequenceStep: 0 };

        case 'ADVANCE_SEQUENCE':
            return { ...state, sequenceStep: state.sequenceStep + 1 };

        case 'TOGGLE_PRESENTATION':
            return { ...state, presentationMode: !state.presentationMode };

        case 'SET_PRESENTATION':
            return { ...state, presentationMode: action.value };

        case 'TOGGLE_WINDOW_ALERT':
            return { ...state, windowAlertOpen: !state.windowAlertOpen };

        case 'SET_WINDOW_ALERT':
            return { ...state, windowAlertOpen: action.value };

        case 'RESET':
            return initialState;

        default:
            return state;
    }
}

interface DemoSequenceConfig {
    onTriggerEcho: () => void;
    onTriggerRitual: () => void;
    onTriggerWindow: () => void;
}

export function useDemoMode(config?: DemoSequenceConfig) {
    const [state, dispatch] = useReducer(demoReducer, initialState);
    const sequenceTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
    const presentationTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

    // Clear sequence timeouts
    const clearSequenceTimeouts = useCallback(() => {
        sequenceTimeoutsRef.current.forEach(clearTimeout);
        sequenceTimeoutsRef.current = [];
    }, []);

    // Clear presentation timeouts
    const clearPresentationTimeouts = useCallback(() => {
        presentationTimeoutsRef.current.forEach(clearTimeout);
        presentationTimeoutsRef.current = [];
    }, []);

    // Demo sequence effect
    useEffect(() => {
        if (!state.sequenceActive || !config) {
            clearSequenceTimeouts();
            return;
        }

        const { onTriggerEcho, onTriggerRitual, onTriggerWindow } = config;

        // Demo sequence timeline
        sequenceTimeoutsRef.current = [
            setTimeout(() => dispatch({ type: 'SET_WINDOW_ALERT', value: true }), 500),
            setTimeout(() => onTriggerEcho(), 2500),
            setTimeout(() => onTriggerRitual(), 5200),
            setTimeout(() => dispatch({ type: 'SET_WINDOW_ALERT', value: false }), 7000),
            setTimeout(() => onTriggerEcho(), 12000),
            setTimeout(() => onTriggerWindow(), 13500),
            setTimeout(() => dispatch({ type: 'STOP_SEQUENCE' }), 18000),
        ];

        return clearSequenceTimeouts;
    }, [state.sequenceActive, config, clearSequenceTimeouts]);

    // Presentation mode effect - loops the demo
    useEffect(() => {
        if (!state.presentationMode || !config) {
            clearPresentationTimeouts();
            return;
        }

        dispatch({ type: 'START_SEQUENCE' });

        const { onTriggerEcho, onTriggerRitual, onTriggerWindow } = config;

        const cycle = setInterval(() => {
            // Clear previous cycle's timeouts before starting new ones
            clearPresentationTimeouts();

            onTriggerEcho();
            dispatch({ type: 'SET_WINDOW_ALERT', value: true });

            presentationTimeoutsRef.current = [
                setTimeout(() => dispatch({ type: 'SET_WINDOW_ALERT', value: false }), 4500),
                setTimeout(() => onTriggerRitual(), 2000),
                setTimeout(() => onTriggerWindow(), 5200),
            ];
        }, 18000);

        return () => {
            clearInterval(cycle);
            clearPresentationTimeouts();
            dispatch({ type: 'STOP_SEQUENCE' });
        };
    }, [state.presentationMode, config, clearPresentationTimeouts]);

    // Memoized actions
    const actions = {
        toggleFeature: useCallback((feature: keyof Pick<DemoState, 'passingEchoes' | 'ghostPings' | 'glyphs' | 'threads' | 'windows' | 'patternWalks'>) => {
            dispatch({ type: 'TOGGLE_FEATURE', feature });
        }, []),

        setFeature: useCallback((feature: keyof Pick<DemoState, 'passingEchoes' | 'ghostPings' | 'glyphs' | 'threads' | 'windows' | 'patternWalks'>, value: boolean) => {
            dispatch({ type: 'SET_FEATURE', feature, value });
        }, []),

        enableAllFeatures: useCallback(() => {
            dispatch({ type: 'ENABLE_ALL_FEATURES' });
        }, []),

        disableAllFeatures: useCallback(() => {
            dispatch({ type: 'DISABLE_ALL_FEATURES' });
        }, []),

        startSequence: useCallback(() => {
            dispatch({ type: 'START_SEQUENCE' });
        }, []),

        stopSequence: useCallback(() => {
            dispatch({ type: 'STOP_SEQUENCE' });
        }, []),

        togglePresentation: useCallback(() => {
            dispatch({ type: 'TOGGLE_PRESENTATION' });
        }, []),

        setPresentation: useCallback((value: boolean) => {
            dispatch({ type: 'SET_PRESENTATION', value });
        }, []),

        toggleWindowAlert: useCallback(() => {
            dispatch({ type: 'TOGGLE_WINDOW_ALERT' });
        }, []),

        setWindowAlert: useCallback((value: boolean) => {
            dispatch({ type: 'SET_WINDOW_ALERT', value });
        }, []),

        reset: useCallback(() => {
            dispatch({ type: 'RESET' });
        }, []),
    };

    return { state, actions, dispatch };
}

export type DemoModeReturn = ReturnType<typeof useDemoMode>;

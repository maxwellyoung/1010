import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * First Launch Hook
 *
 * Tracks whether the user has experienced the network reveal.
 * "Some things are only shown once."
 */

const FIRST_LAUNCH_KEY = '@network1010/has_seen_reveal';

interface FirstLaunchState {
    isFirstLaunch: boolean;
    isLoading: boolean;
    hasSeenReveal: boolean;
}

export function useFirstLaunch() {
    const [state, setState] = useState<FirstLaunchState>({
        isFirstLaunch: false,
        isLoading: true,
        hasSeenReveal: false,
    });

    useEffect(() => {
        const checkFirstLaunch = async () => {
            try {
                const hasSeenReveal = await AsyncStorage.getItem(FIRST_LAUNCH_KEY);
                setState({
                    isFirstLaunch: hasSeenReveal !== 'true',
                    isLoading: false,
                    hasSeenReveal: hasSeenReveal === 'true',
                });
            } catch {
                // If storage fails, assume first launch
                setState({
                    isFirstLaunch: true,
                    isLoading: false,
                    hasSeenReveal: false,
                });
            }
        };
        checkFirstLaunch();
    }, []);

    const markRevealSeen = useCallback(async () => {
        try {
            await AsyncStorage.setItem(FIRST_LAUNCH_KEY, 'true');
            setState(prev => ({
                ...prev,
                isFirstLaunch: false,
                hasSeenReveal: true,
            }));
        } catch {
            // Silent fail - tutorial will just show again next time
        }
    }, []);

    // For testing: reset first launch state
    const resetFirstLaunch = useCallback(async () => {
        try {
            await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
            setState({
                isFirstLaunch: true,
                isLoading: false,
                hasSeenReveal: false,
            });
        } catch {
            // Silent fail
        }
    }, []);

    return {
        ...state,
        markRevealSeen,
        resetFirstLaunch,
    };
}

export type FirstLaunchReturn = ReturnType<typeof useFirstLaunch>;

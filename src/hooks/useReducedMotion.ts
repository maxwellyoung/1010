import { useState, useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to detect if the user has enabled reduced motion in their device settings.
 * Returns true if reduced motion is enabled, false otherwise.
 *
 * Use this to:
 * - Skip animations when the user prefers reduced motion
 * - Simplify transitions
 * - Use instant state changes instead of animated ones
 */
export const useReducedMotion = (): boolean => {
    const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

    useEffect(() => {
        // Check initial state
        const checkReducedMotion = async () => {
            try {
                const isEnabled = await AccessibilityInfo.isReduceMotionEnabled();
                setReduceMotionEnabled(isEnabled);
            } catch (error) {
                // Default to false if there's an error
                console.warn('[useReducedMotion] Failed to check reduced motion:', error);
                setReduceMotionEnabled(false);
            }
        };

        checkReducedMotion();

        // Subscribe to changes
        const subscription = AccessibilityInfo.addEventListener(
            'reduceMotionChanged',
            (isEnabled: boolean) => {
                setReduceMotionEnabled(isEnabled);
            }
        );

        return () => {
            subscription.remove();
        };
    }, []);

    return reduceMotionEnabled;
};

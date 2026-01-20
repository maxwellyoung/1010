import { useEffect, useCallback } from 'react';
import {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
    SharedValue,
} from 'react-native-reanimated';
import { Motion, EntrySequence } from '../constants/Motion';

/**
 * Entry Choreography Hook
 *
 * Orchestrates staggered entrance animations for screen elements.
 * Inspired by Emil Kowalski's motion grammar.
 */

interface ChoreographyConfig {
    /** Whether to auto-play on mount */
    autoPlay?: boolean;
    /** Callback when choreography completes */
    onComplete?: () => void;
}

interface ElementAnimation {
    opacity: SharedValue<number>;
    translateY: SharedValue<number>;
    scale: SharedValue<number>;
    style: ReturnType<typeof useAnimatedStyle>;
}

export function useEntryChoreography(config: ChoreographyConfig = {}) {
    const { autoPlay = true, onComplete } = config;

    // Shared values for each element group
    const headerOpacity = useSharedValue(0);
    const headerTranslateY = useSharedValue(-20);

    const statusOpacity = useSharedValue(0);
    const statusTranslateY = useSharedValue(-15);

    const visualizerOpacity = useSharedValue(0);
    const visualizerScale = useSharedValue(0.9);

    const controlsOpacity = useSharedValue(0);
    const controlsTranslateY = useSharedValue(10);

    const footerOpacity = useSharedValue(0);
    const footerTranslateY = useSharedValue(20);

    // Animation trigger
    const playEntrance = useCallback(() => {
        const baseDuration = Motion.duration.feedback;
        const easing = Motion.easing.enter;

        // Header - pure timing, no springs
        headerOpacity.value = withDelay(
            EntrySequence.header,
            withTiming(1, { duration: baseDuration, easing })
        );
        headerTranslateY.value = withDelay(
            EntrySequence.header,
            withTiming(0, { duration: baseDuration, easing })
        );

        // Status
        statusOpacity.value = withDelay(
            EntrySequence.status,
            withTiming(1, { duration: baseDuration, easing })
        );
        statusTranslateY.value = withDelay(
            EntrySequence.status,
            withTiming(0, { duration: baseDuration, easing })
        );

        // Visualizer
        visualizerOpacity.value = withDelay(
            EntrySequence.visualizer,
            withTiming(1, { duration: baseDuration * 1.5, easing })
        );
        visualizerScale.value = withDelay(
            EntrySequence.visualizer,
            withTiming(1, { duration: baseDuration * 1.5, easing })
        );

        // Controls
        controlsOpacity.value = withDelay(
            EntrySequence.controls,
            withTiming(1, { duration: baseDuration, easing })
        );
        controlsTranslateY.value = withDelay(
            EntrySequence.controls,
            withTiming(0, { duration: baseDuration, easing })
        );

        // Footer
        footerOpacity.value = withDelay(
            EntrySequence.footer,
            withTiming(1, { duration: baseDuration, easing })
        );
        footerTranslateY.value = withDelay(
            EntrySequence.footer,
            withTiming(0, { duration: baseDuration, easing })
        );

        // Complete callback
        if (onComplete) {
            const totalDuration = EntrySequence.footer + baseDuration + 200;
            setTimeout(onComplete, totalDuration);
        }
    }, [
        headerOpacity, headerTranslateY,
        statusOpacity, statusTranslateY,
        visualizerOpacity, visualizerScale,
        controlsOpacity, controlsTranslateY,
        footerOpacity, footerTranslateY,
        onComplete
    ]);

    // Reset to initial state
    const reset = useCallback(() => {
        headerOpacity.value = 0;
        headerTranslateY.value = -20;
        statusOpacity.value = 0;
        statusTranslateY.value = -15;
        visualizerOpacity.value = 0;
        visualizerScale.value = 0.9;
        controlsOpacity.value = 0;
        controlsTranslateY.value = 10;
        footerOpacity.value = 0;
        footerTranslateY.value = 20;
    }, [
        headerOpacity, headerTranslateY,
        statusOpacity, statusTranslateY,
        visualizerOpacity, visualizerScale,
        controlsOpacity, controlsTranslateY,
        footerOpacity, footerTranslateY
    ]);

    // Auto-play on mount
    useEffect(() => {
        if (autoPlay) {
            // Small delay to ensure layout is ready
            const timeout = setTimeout(playEntrance, 50);
            return () => clearTimeout(timeout);
        }
    }, [autoPlay, playEntrance]);

    // Animated styles
    const headerStyle = useAnimatedStyle(() => ({
        opacity: headerOpacity.value,
        transform: [{ translateY: headerTranslateY.value }],
    }));

    const statusStyle = useAnimatedStyle(() => ({
        opacity: statusOpacity.value,
        transform: [{ translateY: statusTranslateY.value }],
    }));

    const visualizerStyle = useAnimatedStyle(() => ({
        opacity: visualizerOpacity.value,
        transform: [{ scale: visualizerScale.value }],
    }));

    const controlsStyle = useAnimatedStyle(() => ({
        opacity: controlsOpacity.value,
        transform: [{ translateY: controlsTranslateY.value }],
    }));

    const footerStyle = useAnimatedStyle(() => ({
        opacity: footerOpacity.value,
        transform: [{ translateY: footerTranslateY.value }],
    }));

    return {
        styles: {
            header: headerStyle,
            status: statusStyle,
            visualizer: visualizerStyle,
            controls: controlsStyle,
            footer: footerStyle,
        },
        playEntrance,
        reset,
    };
}

/**
 * Exit choreography for modal/overlay dismissal
 */
export function useExitAnimation() {
    const opacity = useSharedValue(1);
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const playExit = useCallback((onComplete?: () => void) => {
        opacity.value = withTiming(0, {
            duration: Motion.duration.interaction,
            easing: Motion.easing.exit,
        });
        scale.value = withTiming(0.95, {
            duration: Motion.duration.interaction,
            easing: Motion.easing.exit,
        });

        if (onComplete) {
            setTimeout(onComplete, Motion.duration.interaction);
        }
    }, [opacity, scale]);

    const reset = useCallback(() => {
        opacity.value = 1;
        scale.value = 1;
    }, [opacity, scale]);

    return {
        style: animatedStyle,
        playExit,
        reset,
    };
}

/**
 * Simple fade-in animation for list items
 */
export function useListItemAnimation(index: number, baseDelay: number = 0) {
    const opacity = useSharedValue(0);
    const translateY = useSharedValue(10);

    useEffect(() => {
        const delay = baseDelay + index * Motion.stagger.small;

        opacity.value = withDelay(
            delay,
            withTiming(1, {
                duration: Motion.duration.feedback,
                easing: Motion.easing.enter,
            })
        );

        translateY.value = withDelay(
            delay,
            withTiming(0, {
                duration: Motion.duration.feedback,
                easing: Motion.easing.enter,
            })
        );
    }, [index, baseDelay, opacity, translateY]);

    const style = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateY: translateY.value }],
    }));

    return style;
}

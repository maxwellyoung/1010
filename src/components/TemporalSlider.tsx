import React, { memo, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, PanResponder, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/Theme';
import { Motion } from '../constants/Motion';
import type { TimeMode, TemporalSnapshot } from '../hooks/useTemporalLayers';

/**
 * Temporal Slider - Journey-inspired
 *
 * A whisper of a timeline. Barely visible in live mode.
 * Just a thin line you can drag to see echoes of the past.
 */

interface TemporalSliderProps {
    mode: TimeMode;
    isLive: boolean;
    isLoading: boolean;
    snapshot: TemporalSnapshot | null;
    scrubPosition: number;
    onCycleMode: () => void;
    onScrub: (position: number) => void;
    getModeLabel: () => string;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TRACK_WIDTH = SCREEN_WIDTH - Spacing.xl * 2;

export const TemporalSlider = memo<TemporalSliderProps>(({
    mode,
    isLive,
    isLoading,
    snapshot,
    scrubPosition,
    onCycleMode,
    onScrub,
}) => {
    const pulseOpacity = useSharedValue(1);

    // Subtle pulse in live mode
    React.useEffect(() => {
        if (isLive) {
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.2, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.5, { duration: 2400, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            );
        } else {
            pulseOpacity.value = withTiming(0.6, { duration: Motion.duration.interaction });
        }
    }, [isLive, pulseOpacity]);

    const trackStyle = useAnimatedStyle(() => ({
        opacity: pulseOpacity.value,
    }));

    // Track scrub gesture
    const panResponder = useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => true,
                onMoveShouldSetPanResponder: () => true,
                onPanResponderGrant: () => {
                    // If in live mode, switch to hour mode on touch
                    if (isLive) {
                        onCycleMode();
                    }
                },
                onPanResponderMove: (_, gestureState) => {
                    if (!isLive) {
                        const position = Math.max(0, Math.min(1, gestureState.moveX / TRACK_WIDTH));
                        onScrub(position);
                    }
                },
            }),
        [isLive, onCycleMode, onScrub]
    );

    const scrubStyle = useAnimatedStyle(() => ({
        left: `${scrubPosition * 100}%`,
        opacity: isLive ? 0 : 0.8,
    }));

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onCycleMode}
                activeOpacity={1}
                style={styles.touchArea}
                {...panResponder.panHandlers}
            >
                {/* The timeline - just a thin line */}
                <Animated.View style={[styles.track, trackStyle]}>
                    {/* Fill to current position when not live */}
                    {!isLive && (
                        <View style={[styles.fill, { width: `${scrubPosition * 100}%` }]} />
                    )}
                </Animated.View>

                {/* Scrub handle - tiny dot */}
                {!isLive && (
                    <Animated.View style={[styles.handle, scrubStyle]} />
                )}
            </TouchableOpacity>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        paddingVertical: Spacing.lg,
        alignItems: 'center',
    },
    touchArea: {
        width: TRACK_WIDTH,
        height: 44,
        justifyContent: 'center',
    },
    track: {
        width: '100%',
        height: 1,
        backgroundColor: Colors.surfaceHighlight,
    },
    fill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 1,
        backgroundColor: Colors.tertiary,
    },
    handle: {
        position: 'absolute',
        top: 17,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.primary,
        marginLeft: -5,
    },
});

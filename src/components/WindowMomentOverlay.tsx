import React, { useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';

/**
 * Window Moment Overlay - Journey-inspired
 *
 * A subtle glow where the moment is.
 * No timer. No text. Just presence.
 */

interface WindowMomentOverlayProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    size: number;
    startedAt?: number | null;
    endsAt?: number | null;
    participantCount?: number;
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

export const WindowMomentOverlay = memo<WindowMomentOverlayProps>(({
    isOpen,
    position,
    size,
}) => {
    const pulse = useSharedValue(0);

    useEffect(() => {
        if (!isOpen) {
            pulse.value = withTiming(0, { duration: 800, easing: Easing.out(Easing.quad) });
            return;
        }
        // Very slow breathing glow
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            false
        );
    }, [isOpen, pulse]);

    const glowStyle = useAnimatedStyle(() => ({
        opacity: 0.08 + pulse.value * 0.12,
        transform: [{ scale: 0.9 + pulse.value * 0.15 }],
    }));

    if (!isOpen || !position) {
        return null;
    }

    // Much smaller, subtler glow
    const glowSize = size * 0.12;
    const x = mapCoord(position.x, size) - glowSize / 2;
    const y = mapCoord(position.y, size) - glowSize / 2;

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Animated.View
                style={[
                    styles.glow,
                    {
                        left: x,
                        top: y,
                        width: glowSize,
                        height: glowSize,
                        borderRadius: glowSize / 2,
                    },
                    glowStyle,
                ]}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    glow: {
        position: 'absolute',
        backgroundColor: Colors.warning,
    },
});

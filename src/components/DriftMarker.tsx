import React, { useEffect, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';

/**
 * Drift Marker - Journey-inspired
 *
 * Your presence in the field.
 * A simple dot that breathes with you.
 * No orbits. No rings. Just you.
 */

interface DriftMarkerProps {
    size: number;
    strength?: number;
}

export const DriftMarker = memo<DriftMarkerProps>(({ size, strength = 0.6 }) => {
    const breath = useSharedValue(0);

    useEffect(() => {
        // Very slow breathing - 6 second cycle
        breath.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 3000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            false
        );
    }, [breath]);

    const dotSize = Math.max(8, Math.round(size * 0.04));

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: strength * (0.7 + breath.value * 0.3),
        transform: [{ scale: 0.95 + breath.value * 0.1 }],
    }));

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Animated.View
                style={[
                    styles.dot,
                    {
                        width: dotSize,
                        height: dotSize,
                        borderRadius: dotSize / 2,
                    },
                    animatedStyle,
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOpacity: 0.6,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
});

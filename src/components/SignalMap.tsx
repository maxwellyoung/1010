import React, { useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';
import { HeatPoint } from '../hooks/usePings';

/**
 * Signal Map - Journey-inspired
 *
 * No radar rings. No technical overlays.
 * Just presence dots breathing in the field.
 */

interface SignalMapProps {
    heatMap: HeatPoint[];
    size?: number;
}

const PresenceBlip = memo(({ point, size }: { point: HeatPoint; size: number }) => {
    const breath = useSharedValue(Math.random());

    useEffect(() => {
        // Slightly randomized breathing
        const duration = 3000 + Math.random() * 2000;
        breath.value = withRepeat(
            withSequence(
                withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            false
        );
    }, [breath]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: 0.15 + breath.value * point.intensity * 0.35,
        transform: [{ scale: 0.9 + breath.value * 0.2 }],
    }));

    const x = (point.x + 1) * 0.5 * size;
    const y = (point.y + 1) * 0.5 * size;
    const blipSize = Math.max(6, Math.round(size * 0.04 + point.intensity * 4));

    return (
        <Animated.View
            style={[
                styles.blip,
                {
                    left: x - blipSize / 2,
                    top: y - blipSize / 2,
                    width: blipSize,
                    height: blipSize,
                    borderRadius: blipSize / 2,
                },
                animatedStyle,
            ]}
        />
    );
});

export const SignalMap: React.FC<SignalMapProps> = memo(({ heatMap, size = 200 }) => {
    // Limit visible points for performance and cleaner visuals
    const visiblePoints = heatMap.slice(0, 12);

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {visiblePoints.map((point) => (
                <PresenceBlip key={point.id} point={point} size={size} />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    blip: {
        position: 'absolute',
        backgroundColor: Colors.tertiary,
    },
});

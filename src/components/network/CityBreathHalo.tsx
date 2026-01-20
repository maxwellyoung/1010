import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { Colors } from '../../constants/Theme';
import { Motion } from '../../constants/Motion';

interface CityBreathHaloProps {
    intensity: number;
    periodMs: number;
}

export const CityBreathHalo: React.FC<CityBreathHaloProps> = React.memo(({
    intensity,
    periodMs,
}) => {
    const breath = useSharedValue(0);

    useEffect(() => {
        breath.value = withRepeat(
            withSequence(
                withTiming(1, { duration: periodMs, easing: Motion.easing.breath }),
                withTiming(0, { duration: periodMs, easing: Motion.easing.breath })
            ),
            -1,
            true
        );
    }, [breath, periodMs]);

    const animatedStyle = useAnimatedStyle(() => {
        const minOpacity = 0.02 + intensity * 0.18;
        const maxOpacity = minOpacity + 0.1;
        const opacity = minOpacity + breath.value * (maxOpacity - minOpacity);
        const scale = 0.9 + breath.value * 0.18;

        return {
            opacity,
            transform: [{ scale }],
        };
    });

    return (
        <Animated.View style={[styles.halo, animatedStyle]} pointerEvents="none" />
    );
});

const styles = StyleSheet.create({
    halo: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: Colors.surfaceHighlight,
    },
});

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withDelay,
    Easing,
    withSequence,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';
import { HeatPoint } from '../hooks/usePings';

interface SignalMapProps {
    heatMap: HeatPoint[];
}

const RadarRing = ({ delay, scaleMax }: { delay: number; scaleMax: number }) => {
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        scale.value = withDelay(
            delay,
            withRepeat(
                withTiming(scaleMax, { duration: 4000, easing: Easing.out(Easing.ease) }),
                -1,
                false
            )
        );
        opacity.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0, { duration: 4000, easing: Easing.out(Easing.ease) })
                ),
                -1,
                false
            )
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
        opacity: opacity.value,
    }));

    return <Animated.View style={[styles.ring, animatedStyle]} />;
};

const HeatBlip = ({ point }: { point: HeatPoint }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(point.intensity, { duration: 1000 + Math.random() * 1000 }),
                withTiming(0.2, { duration: 1000 + Math.random() * 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        left: `${(point.x + 1) * 50}%`,
        top: `${(point.y + 1) * 50}%`,
    }));

    return <Animated.View style={[styles.blip, animatedStyle]} />;
};

export const SignalMap: React.FC<SignalMapProps> = React.memo(({ heatMap }) => {
    return (
        <View style={styles.container}>
            {/* Radar Rings */}
            <RadarRing delay={0} scaleMax={1.5} />
            <RadarRing delay={1000} scaleMax={1.5} />
            <RadarRing delay={2000} scaleMax={1.5} />

            {/* Heat Points */}
            {heatMap.map((point) => (
                <HeatBlip key={point.id} point={point} />
            ))}

            {/* Center User Marker */}
            <View style={styles.userMarker} />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    ring: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    userMarker: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    blip: {
        position: 'absolute',
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: Colors.secondary,
    },
});

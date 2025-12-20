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
    size?: number;
}

const RadarRing = ({ delay, scaleMax, size }: { delay: number; scaleMax: number; size: number }) => {
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

    return <Animated.View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }, animatedStyle]} />;
};

const HeatBlip = ({ point, size }: { point: HeatPoint; size: number }) => {
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

    const blipSize = Math.max(4, Math.round(size * 0.03));
    return <Animated.View style={[styles.blip, { width: blipSize, height: blipSize, borderRadius: blipSize / 2 }, animatedStyle]} />;
};

export const SignalMap: React.FC<SignalMapProps> = React.memo(({ heatMap, size = 200 }) => {
    const ringSize = size * 0.5;
    const markerSize = Math.max(6, Math.round(size * 0.04));

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            {/* Radar Rings */}
            <RadarRing delay={0} scaleMax={1.6} size={ringSize} />
            <RadarRing delay={1000} scaleMax={1.6} size={ringSize} />
            <RadarRing delay={2000} scaleMax={1.6} size={ringSize} />

            {/* Heat Points */}
            {heatMap.map((point) => (
                <HeatBlip key={point.id} point={point} size={size} />
            ))}

            {/* Center User Marker */}
            <View style={[styles.userMarker, { width: markerSize, height: markerSize, borderRadius: markerSize / 2 }]} />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    ring: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: Colors.primary,
    },
    userMarker: {
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOpacity: 0.8,
        shadowRadius: 10,
    },
    blip: {
        position: 'absolute',
        backgroundColor: Colors.secondary,
    },
});

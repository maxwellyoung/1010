import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';

interface ProximityBarsProps {
    strength: number;
}

const EASE_OUT = Easing.out(Easing.cubic);

const Particle = ({ active, index }: { active: boolean; index: number }) => {
    const opacity = useSharedValue(0.15);

    useEffect(() => {
        const delay = index * 80;

        if (active) {
            opacity.value = withDelay(delay, withTiming(1, { duration: 400, easing: EASE_OUT }));
        } else {
            opacity.value = withTiming(0.15, { duration: 300 });
        }
    }, [active, index, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                animatedStyle,
                {
                    backgroundColor: active ? Colors.primary : Colors.tertiary,
                    height: 4 + (index * 3),
                }
            ]}
        />
    );
};

export const ProximityBars: React.FC<ProximityBarsProps> = ({ strength }) => {
    return (
        <View style={styles.container}>
            {[0, 1, 2, 3, 4].map((i) => (
                <Particle key={i} index={i} active={i < strength} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 40,
    },
    particle: {
        width: 4,
        borderRadius: 2,
    },
});

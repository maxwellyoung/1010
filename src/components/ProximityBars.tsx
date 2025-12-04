import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    withSpring,
    withDelay,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../constants/Theme';

interface ProximityBarsProps {
    strength: number;
}

const Particle = ({ active, index, total }: { active: boolean; index: number; total: number }) => {
    const opacity = useSharedValue(0.1);
    const scale = useSharedValue(0.8);
    const translateY = useSharedValue(0);

    useEffect(() => {
        // Staggered activation
        const delay = index * 100;

        if (active) {
            opacity.value = withDelay(delay, withTiming(1, { duration: 800 }));
            scale.value = withDelay(delay, withSpring(1));

            // "Breathing" motion
            translateY.value = withDelay(
                delay,
                withRepeat(
                    withSequence(
                        withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
                        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.quad) })
                    ),
                    -1,
                    true
                )
            );
        } else {
            opacity.value = withTiming(0.1, { duration: 500 });
            scale.value = withTiming(0.8, { duration: 500 });
            translateY.value = withTiming(0);
        }
    }, [active, index]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }, { translateY: translateY.value }],
    }));

    return (
        <Animated.View
            style={[
                styles.particle,
                animatedStyle,
                {
                    backgroundColor: active ? Colors.primary : Colors.tertiary,
                    height: 4 + (index * 2), // Ascending height
                }
            ]}
        />
    );
};

export const ProximityBars: React.FC<ProximityBarsProps> = ({ strength }) => {
    // Render a grid of particles instead of just bars
    return (
        <View style={styles.container}>
            {[0, 1, 2, 3, 4].map((i) => (
                <Particle key={i} index={i} total={5} active={i < strength} />
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

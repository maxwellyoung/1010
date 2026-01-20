import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withRepeat,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { Motion } from '../constants/Motion';
import { Copy } from '../constants/Copy';
import { Echo } from '../hooks/useEchoes';

interface EchoOverlayProps {
    echo: Echo | null;
}

export const EchoOverlay = memo<EchoOverlayProps>(({ echo }) => {
    const opacity = useSharedValue(0);
    const glitchX = useSharedValue(0);

    useEffect(() => {
        if (echo) {
            opacity.value = withTiming(1, { duration: Motion.duration.interaction });

            // Subtle glitch effect - reduced from ±5px to ±2px, fewer repeats
            glitchX.value = withSequence(
                withTiming(2, { duration: 60 }),
                withTiming(-2, { duration: 60 }),
                withTiming(1, { duration: 40 }),
                withTiming(-1, { duration: 40 }),
                withTiming(0, { duration: 60 })
            );
        } else {
            opacity.value = withTiming(0, { duration: Motion.duration.transition });
            glitchX.value = withTiming(0, { duration: 100 });
        }
    }, [echo, opacity, glitchX]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: glitchX.value }],
    }));

    if (!echo) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={[styles.content, animatedStyle]}>
                <Text style={styles.label}>{Copy.echo.label}</Text>
                <Text style={styles.message}>{echo.message}</Text>
                <Text style={styles.timestamp}>{new Date(echo.timestamp).toLocaleTimeString()}</Text>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 200,
        backgroundColor: 'rgba(0,0,0,0.7)',
    },
    content: {
        alignItems: 'center',
        padding: Spacing.xl,
        borderWidth: 1,
        borderColor: Colors.primary,
        backgroundColor: Colors.background,
    },
    label: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginBottom: Spacing.md,
    },
    message: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontFamily: Typography.mono,
        textAlign: 'center',
        marginBottom: Spacing.md,
        letterSpacing: 1,
    },
    timestamp: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
    },
});

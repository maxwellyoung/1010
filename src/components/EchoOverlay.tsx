import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withRepeat,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { Echo } from '../hooks/useEchoes';

interface EchoOverlayProps {
    echo: Echo | null;
}

export const EchoOverlay: React.FC<EchoOverlayProps> = ({ echo }) => {
    const opacity = useSharedValue(0);
    const glitchX = useSharedValue(0);

    useEffect(() => {
        if (echo) {
            opacity.value = withTiming(1, { duration: 200 });

            // Glitch effect
            glitchX.value = withRepeat(
                withSequence(
                    withTiming(5, { duration: 50 }),
                    withTiming(-5, { duration: 50 }),
                    withTiming(0, { duration: 50 })
                ),
                10,
                true
            );
        } else {
            opacity.value = withTiming(0, { duration: 500 });
        }
    }, [echo]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ translateX: glitchX.value }],
    }));

    if (!echo) return null;

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={[styles.content, animatedStyle]}>
                <Text style={styles.label}>ECHO DETECTED</Text>
                <Text style={styles.message}>{echo.message}</Text>
                <Text style={styles.timestamp}>{new Date(echo.timestamp).toLocaleTimeString()}</Text>
            </Animated.View>
        </View>
    );
};

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

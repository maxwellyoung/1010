import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/Theme';
import { Motion } from '../../constants/Motion';
import { Copy } from '../../constants/Copy';
import type { RitualState } from '../../hooks/useQuietRitual';

interface RitualOverlayProps {
    ritual: RitualState;
}

export const RitualOverlay: React.FC<RitualOverlayProps> = React.memo(({ ritual }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(ritual.active ? 1 : 0, {
            duration: ritual.active ? Motion.duration.feedback : Motion.duration.transition,
            easing: Motion.easing.exit,
        });
    }, [ritual.active, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    if (!ritual.active && opacity.value === 0) return null;

    return (
        <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
            <Text style={styles.label}>{Copy.ritual.label}</Text>
            <Text style={styles.phrase}>{ritual.phrase}</Text>
            <Text style={styles.signature}>{Copy.ritual.signature}</Text>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: Spacing.lg,
        right: Spacing.lg,
        top: '35%',
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
        backgroundColor: 'rgba(5, 5, 5, 0.88)',
        alignItems: 'center',
        zIndex: 220,
    },
    label: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
        fontFamily: Typography.mono,
    },
    phrase: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        textAlign: 'center',
        letterSpacing: 1,
        fontFamily: Typography.mono,
    },
    signature: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginTop: Spacing.md,
        fontFamily: Typography.mono,
    },
});

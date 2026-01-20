import React, { useEffect, memo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/Theme';

/**
 * Network Footer - Journey-inspired
 *
 * Just presence. No labels. The number breathes.
 */

interface NetworkFooterProps {
    participantCount: number | null;
    isLoading: boolean;
    densityScore: number;
    isInsideNetwork: boolean;
    onShare?: () => void;
}

export const NetworkFooter = memo<NetworkFooterProps>(({
    participantCount,
    isLoading,
    densityScore,
    isInsideNetwork,
    onShare,
}) => {
    const breath = useSharedValue(0);
    const fadeIn = useSharedValue(0);

    useEffect(() => {
        // Slow breathing based on density
        const duration = 4000 - densityScore * 500;
        breath.value = withRepeat(
            withSequence(
                withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            false
        );
    }, [breath, densityScore]);

    useEffect(() => {
        if (!isLoading && participantCount !== null) {
            fadeIn.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.quad) });
        }
    }, [isLoading, participantCount, fadeIn]);

    const countStyle = useAnimatedStyle(() => ({
        opacity: fadeIn.value * (0.4 + breath.value * 0.6),
        transform: [{ scale: 0.98 + breath.value * 0.04 }],
    }));

    // Don't show anything while loading
    if (isLoading || participantCount === null) {
        return <View style={styles.container} />;
    }

    return (
        <TouchableOpacity
            style={styles.container}
            onLongPress={onShare}
            activeOpacity={1}
            accessibilityLabel={`${participantCount} in the network`}
        >
            <Animated.Text
                style={[
                    styles.count,
                    !isInsideNetwork && styles.countDistant,
                    countStyle,
                ]}
            >
                {participantCount}
            </Animated.Text>
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
        minHeight: 120,
    },
    count: {
        color: Colors.primary,
        fontSize: 72,
        fontWeight: '100',
        fontVariant: ['tabular-nums'],
        fontFamily: Typography.mono,
        letterSpacing: -4,
    },
    countDistant: {
        color: Colors.tertiary,
    },
});

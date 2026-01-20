import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withSequence,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { Motion } from '../constants/Motion';
import type { MemoryLevel } from '../hooks/useResonanceMemory';

interface FamiliarSignalOverlayProps {
    visible: boolean;
    level: MemoryLevel;
    phrase: string | null;
    encounterCount: number;
    onComplete?: () => void;
}

const DISPLAY_DURATION = 4000;

const getLevelGlyph = (level: MemoryLevel): string => {
    switch (level) {
        case 3: return '◈◈◈';
        case 2: return '◈◈';
        case 1: return '◈';
        default: return '';
    }
};

const getLevelColor = (level: MemoryLevel): string => {
    switch (level) {
        case 3: return Colors.accent; // Rare green for resonant
        case 2: return Colors.primary;
        case 1: return Colors.secondary;
        default: return Colors.tertiary;
    }
};

export const FamiliarSignalOverlay = memo<FamiliarSignalOverlayProps>(({
    visible,
    level,
    phrase,
    encounterCount,
    onComplete,
}) => {
    const opacity = useSharedValue(0);
    const scale = useSharedValue(0.9);
    const glyphOpacity = useSharedValue(0);

    useEffect(() => {
        if (visible && level > 0) {
            // Fade in
            opacity.value = withTiming(1, { duration: Motion.duration.transition });
            scale.value = withTiming(1, {
                duration: Motion.duration.transition,
                easing: Motion.easing.enter,
            });

            // Staggered glyph reveal
            glyphOpacity.value = withDelay(
                Motion.duration.transition,
                withSequence(
                    withTiming(1, { duration: 600 }),
                    withDelay(DISPLAY_DURATION - 1200, withTiming(0, { duration: 600 }))
                )
            );

            // Auto-hide after duration
            const timeout = setTimeout(() => {
                opacity.value = withTiming(0, { duration: Motion.duration.transition });
                scale.value = withTiming(0.95, { duration: Motion.duration.transition });
                onComplete?.();
            }, DISPLAY_DURATION);

            return () => clearTimeout(timeout);
        } else {
            opacity.value = withTiming(0, { duration: Motion.duration.interaction });
        }
    }, [visible, level, opacity, scale, glyphOpacity, onComplete]);

    const containerStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }],
    }));

    const glyphStyle = useAnimatedStyle(() => ({
        opacity: glyphOpacity.value,
    }));

    if (!visible || level === 0) return null;

    const color = getLevelColor(level);
    const glyph = getLevelGlyph(level);

    return (
        <View style={styles.container} pointerEvents="none">
            <Animated.View style={[styles.content, containerStyle]}>
                <Animated.Text style={[styles.glyph, glyphStyle, { color }]}>
                    {glyph}
                </Animated.Text>

                {phrase && (
                    <Text style={styles.phrase}>{phrase}</Text>
                )}

                <View style={styles.countContainer}>
                    <Text style={styles.countLabel}>encounters</Text>
                    <Text style={[styles.count, { color }]}>{encounterCount}</Text>
                </View>
            </Animated.View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 150,
        backgroundColor: 'rgba(5, 5, 5, 0.85)',
    },
    content: {
        alignItems: 'center',
        padding: Spacing.xxl,
    },
    glyph: {
        fontSize: Typography.size.xl,
        fontFamily: Typography.mono,
        letterSpacing: 8,
        marginBottom: Spacing.lg,
    },
    phrase: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        fontFamily: Typography.mono,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: Spacing.xl,
    },
    countContainer: {
        alignItems: 'center',
    },
    countLabel: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: Spacing.xs,
    },
    count: {
        fontSize: Typography.size.xxl,
        fontFamily: Typography.mono,
        fontWeight: '300',
    },
});

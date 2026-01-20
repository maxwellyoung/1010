import React, { useEffect, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography } from '../constants/Theme';

/**
 * Glyph Reveal
 *
 * Elegant staggered fade - no scale, no bounce.
 * Pure opacity transitions.
 */

interface GlyphRevealProps {
    active: boolean;
    count?: number;
    onComplete?: () => void;
    glyphs?: string[];
    size?: 'sm' | 'md' | 'lg';
}

const GLYPH_POOL = ['◈', '◇', '○', '□', '△', '▽', '+', '×', '◎', '▣'];
const STAGGER = 100;
const FADE_IN = 400;
const HOLD = 600;
const FADE_OUT = 300;
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

const getRandomGlyphs = (count: number): string[] => {
    const result: string[] = [];
    for (let i = 0; i < count; i++) {
        result.push(GLYPH_POOL[Math.floor(Math.random() * GLYPH_POOL.length)]);
    }
    return result;
};

const GlyphChar = memo(({ char, index, total }: { char: string; index: number; total: number }) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        const delay = index * STAGGER;

        // Simple fade in, hold, fade out - no scale
        opacity.value = withDelay(
            delay,
            withSequence(
                withTiming(0.7, { duration: FADE_IN, easing: EASE_OUT }),
                withDelay(HOLD, withTiming(0, { duration: FADE_OUT, easing: EASE_IN }))
            )
        );
    }, [index, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    // Position in a circle
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const radius = 70;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return (
        <Animated.View
            style={[
                styles.glyphContainer,
                { transform: [{ translateX: x }, { translateY: y }] },
                animatedStyle,
            ]}
        >
            <Text style={styles.glyph}>{char}</Text>
        </Animated.View>
    );
});

export const GlyphReveal = memo<GlyphRevealProps>(({
    active,
    count = 6,
    onComplete,
    glyphs,
    size = 'md',
}) => {
    const selectedGlyphs = glyphs || getRandomGlyphs(count);

    useEffect(() => {
        if (active && onComplete) {
            const totalDuration = count * STAGGER + FADE_IN + HOLD + FADE_OUT;
            const timeout = setTimeout(onComplete, totalDuration);
            return () => clearTimeout(timeout);
        }
    }, [active, count, onComplete]);

    if (!active) return null;

    return (
        <View style={styles.container}>
            {selectedGlyphs.map((char, index) => (
                <GlyphChar key={`${char}-${index}`} char={char} index={index} total={selectedGlyphs.length} />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 180,
        height: 180,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glyphContainer: {
        position: 'absolute',
    },
    glyph: {
        color: Colors.tertiary,
        fontSize: Typography.size.md,
        fontFamily: Typography.mono,
        fontWeight: '200',
    },
});

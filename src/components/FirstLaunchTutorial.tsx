import React, { useEffect, useState, useCallback, memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { Copy } from '../constants/Copy';
import { useHaptics } from '../hooks/useHaptics';

/**
 * First Launch Tutorial
 *
 * Pure elegance. No bouncing. No gimmicks.
 * Opacity fades with blur. That's it.
 */

const STEPS = Copy.tutorial.steps;

// Timing - deliberate, unhurried
const FADE_IN = 800;
const FADE_OUT = 300;
const STAGGER = 200;
const BLUR_INTENSITY = 20;

// Easing - smooth, never bouncy
const EASE_OUT = Easing.out(Easing.cubic);
const EASE_IN = Easing.in(Easing.cubic);

interface Props {
    visible: boolean;
    onComplete: () => void;
}

export const FirstLaunchTutorial = memo<Props>(({ visible, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const haptics = useHaptics();

    // Simple opacity values - nothing else
    const containerOpacity = useSharedValue(0);
    const contentOpacity = useSharedValue(0);
    const glyphOpacity = useSharedValue(0);
    const titleOpacity = useSharedValue(0);
    const bodyOpacity = useSharedValue(0);
    const hintOpacity = useSharedValue(0);
    const blurOpacity = useSharedValue(0);

    // Initial fade in
    useEffect(() => {
        if (visible) {
            containerOpacity.value = withTiming(1, { duration: FADE_IN * 2, easing: EASE_OUT });
            // Staggered content reveal
            setTimeout(() => animateIn(), FADE_IN);
        }
    }, [visible]);

    const animateIn = useCallback(() => {
        glyphOpacity.value = withTiming(1, { duration: FADE_IN, easing: EASE_OUT });
        titleOpacity.value = withDelay(STAGGER, withTiming(0.6, { duration: FADE_IN, easing: EASE_OUT }));
        bodyOpacity.value = withDelay(STAGGER * 2, withTiming(0.8, { duration: FADE_IN, easing: EASE_OUT }));
        hintOpacity.value = withDelay(STAGGER * 4, withTiming(0.3, { duration: FADE_IN, easing: EASE_OUT }));
        contentOpacity.value = withTiming(1, { duration: FADE_IN, easing: EASE_OUT });
    }, [glyphOpacity, titleOpacity, bodyOpacity, hintOpacity, contentOpacity]);

    const animateOut = useCallback((callback: () => void) => {
        // Fade to blur, then callback
        blurOpacity.value = withTiming(1, { duration: FADE_OUT, easing: EASE_IN });
        contentOpacity.value = withTiming(0, { duration: FADE_OUT, easing: EASE_IN });

        setTimeout(() => {
            // Reset opacities
            glyphOpacity.value = 0;
            titleOpacity.value = 0;
            bodyOpacity.value = 0;
            hintOpacity.value = 0;
            callback();
        }, FADE_OUT);
    }, [blurOpacity, contentOpacity, glyphOpacity, titleOpacity, bodyOpacity, hintOpacity]);

    const animateInFromBlur = useCallback(() => {
        // Fade from blur to content
        blurOpacity.value = withTiming(0, { duration: FADE_IN, easing: EASE_OUT });
        setTimeout(() => animateIn(), 100);
    }, [blurOpacity, animateIn]);

    const handleTap = useCallback(() => {
        if (isTransitioning) return;

        haptics.selection();
        setIsTransitioning(true);

        if (currentStep < STEPS.length - 1) {
            animateOut(() => {
                setCurrentStep(prev => prev + 1);
                animateInFromBlur();
                setIsTransitioning(false);
            });
        } else {
            // Final exit - slow, graceful
            haptics.onSuccess();
            containerOpacity.value = withTiming(0, { duration: FADE_IN * 1.5, easing: EASE_IN });
            setTimeout(onComplete, FADE_IN * 1.5);
        }
    }, [currentStep, isTransitioning, animateOut, animateInFromBlur, onComplete, haptics, containerOpacity]);

    // Styles
    const containerStyle = useAnimatedStyle(() => ({
        opacity: containerOpacity.value,
    }));

    const contentStyle = useAnimatedStyle(() => ({
        opacity: contentOpacity.value,
    }));

    const glyphStyle = useAnimatedStyle(() => ({
        opacity: glyphOpacity.value,
    }));

    const titleStyle = useAnimatedStyle(() => ({
        opacity: titleOpacity.value,
    }));

    const bodyStyle = useAnimatedStyle(() => ({
        opacity: bodyOpacity.value,
    }));

    const hintStyle = useAnimatedStyle(() => ({
        opacity: hintOpacity.value,
    }));

    const blurStyle = useAnimatedStyle(() => ({
        opacity: blurOpacity.value,
    }));

    if (!visible) return null;

    const step = STEPS[currentStep];
    const isLast = currentStep === STEPS.length - 1;

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            {/* Blur overlay for transitions */}
            <Animated.View style={[styles.blurContainer, blurStyle]} pointerEvents="none">
                <BlurView intensity={BLUR_INTENSITY} style={StyleSheet.absoluteFill} tint="dark" />
            </Animated.View>

            <Pressable style={styles.touchArea} onPress={handleTap}>
                <Animated.View style={[styles.content, contentStyle]}>
                    {/* Glyph - large, centered, quiet */}
                    <Animated.Text style={[styles.glyph, glyphStyle]}>
                        {step.glyph}
                    </Animated.Text>

                    {/* Title - small, subdued */}
                    <Animated.Text style={[styles.title, titleStyle]}>
                        {step.title}
                    </Animated.Text>

                    {/* Body - the message */}
                    <Animated.Text style={[styles.body, bodyStyle]}>
                        {step.body}
                    </Animated.Text>
                </Animated.View>

                {/* Hint - barely visible */}
                <Animated.Text style={[styles.hint, hintStyle]}>
                    {isLast ? 'tap to enter' : 'tap to continue'}
                </Animated.Text>
            </Pressable>

            {/* Minimal step indicator - just a fraction */}
            <View style={styles.stepIndicator}>
                <Text style={styles.stepText}>
                    {currentStep + 1}/{STEPS.length}
                </Text>
            </View>
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
        zIndex: 1000,
    },
    blurContainer: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1,
    },
    touchArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    glyph: {
        color: Colors.primary,
        fontSize: 56,
        fontFamily: Typography.mono,
        fontWeight: '100',
        marginBottom: Spacing.xxl,
    },
    title: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 3,
        marginBottom: Spacing.lg,
        textTransform: 'uppercase',
    },
    body: {
        color: Colors.primary,
        fontSize: Typography.size.base,
        fontFamily: Typography.mono,
        textAlign: 'center',
        lineHeight: 26,
        letterSpacing: 0.3,
    },
    hint: {
        position: 'absolute',
        bottom: 100,
        color: Colors.quaternary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
    },
    stepIndicator: {
        position: 'absolute',
        top: 60,
        right: Spacing.xl,
    },
    stepText: {
        color: Colors.quaternary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
});

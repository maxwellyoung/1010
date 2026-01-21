import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing, Layout } from '../../src/constants/Theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { GlyphReveal } from '../../src/components/GlyphReveal';

// Timing constants - unhurried, elegant
const FADE_DURATION = 600;
const EASE_OUT = Easing.out(Easing.cubic);

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [showGlyphs, setShowGlyphs] = useState(true);
    const [contentReady, setContentReady] = useState(false);

    // Simple opacity animations - no springs, no scale
    const logoOpacity = useSharedValue(0);
    const subtitleOpacity = useSharedValue(0);
    const descriptionOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);

    useEffect(() => {
        const glyphDuration = 2000;
        setTimeout(() => {
            setShowGlyphs(false);
            setContentReady(true);
        }, glyphDuration);
    }, []);

    useEffect(() => {
        if (!contentReady) return;

        // Staggered fade-in - pure opacity, no transforms
        logoOpacity.value = withTiming(1, { duration: FADE_DURATION, easing: EASE_OUT });
        subtitleOpacity.value = withDelay(200, withTiming(0.6, { duration: FADE_DURATION, easing: EASE_OUT }));
        descriptionOpacity.value = withDelay(400, withTiming(0.7, { duration: FADE_DURATION, easing: EASE_OUT }));
        buttonOpacity.value = withDelay(800, withTiming(1, { duration: FADE_DURATION, easing: EASE_OUT }));
    }, [contentReady, logoOpacity, subtitleOpacity, descriptionOpacity, buttonOpacity]);

    const logoStyle = useAnimatedStyle(() => ({
        opacity: logoOpacity.value,
    }));

    const subtitleStyle = useAnimatedStyle(() => ({
        opacity: subtitleOpacity.value,
    }));

    const descriptionStyle = useAnimatedStyle(() => ({
        opacity: descriptionOpacity.value,
    }));

    const buttonStyle = useAnimatedStyle(() => ({
        opacity: buttonOpacity.value,
    }));

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
                ]}
            >
                <View style={styles.content}>
                    {showGlyphs && (
                        <View style={styles.glyphContainer}>
                            <GlyphReveal active={showGlyphs} count={8} size="lg" />
                        </View>
                    )}

                    {contentReady && (
                        <>
                            <Animated.Text style={[styles.logo, logoStyle]}>1010</Animated.Text>
                            <Animated.Text style={[styles.subtitle, subtitleStyle]}>Network</Animated.Text>
                            <Animated.Text style={[styles.description, descriptionStyle]}>
                                Feel who's nearby without the noise.{'\n'}
                                Presence, not profiles.
                            </Animated.Text>
                        </>
                    )}
                </View>

                {contentReady && (
                    <Animated.View style={buttonStyle}>
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => router.push('/onboarding/permissions')}
                            activeOpacity={0.7}
                            accessibilityLabel="Get started"
                            accessibilityRole="button"
                            accessibilityHint="Begins the network setup process"
                        >
                            <Text style={styles.buttonText}>Get started</Text>
                        </TouchableOpacity>
                        <Text style={styles.hint}>
                            Location access required
                        </Text>
                    </Animated.View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    glyphContainer: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        color: Colors.primary,
        fontSize: Typography.size.jumbo,
        fontFamily: Typography.sans,
        fontWeight: '200',
        letterSpacing: 6,
    },
    subtitle: {
        color: Colors.tertiary,
        fontSize: Typography.size.sm,
        fontFamily: Typography.sansMedium,
        textTransform: 'uppercase',
        letterSpacing: Typography.letterSpacing.wider,
        marginTop: Spacing.md,
        marginBottom: Spacing.xxl,
    },
    description: {
        color: Colors.secondary,
        fontSize: Typography.size.base,
        fontFamily: Typography.sans,
        textAlign: 'center',
        lineHeight: 26,
        maxWidth: 280,
    },
    button: {
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        alignItems: 'center',
        borderRadius: Layout.radius.md,
    },
    buttonText: {
        color: Colors.background,
        fontSize: Typography.size.sm,
        fontFamily: Typography.sansSemiBold,
        letterSpacing: Typography.letterSpacing.wide,
    },
    hint: {
        color: Colors.tertiary,
        fontSize: Typography.size.sm,
        fontFamily: Typography.sans,
        textAlign: 'center',
        marginTop: Spacing.md,
    },
});

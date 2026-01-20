import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/Theme';
import { Glyphs } from '../../src/constants/Glyphs';
import { useLocation } from '../../src/context/LocationContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const FADE = 500;
const STAGGER = 150;
const EASE_OUT = Easing.out(Easing.cubic);

export default function PermissionsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { requestPermissions, errorMsg } = useLocation();

    // Pure opacity - no transforms
    const headerOpacity = useSharedValue(0);
    const item1Opacity = useSharedValue(0);
    const item2Opacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);

    useEffect(() => {
        headerOpacity.value = withDelay(100, withTiming(1, { duration: FADE, easing: EASE_OUT }));
        item1Opacity.value = withDelay(100 + STAGGER, withTiming(0.9, { duration: FADE, easing: EASE_OUT }));
        item2Opacity.value = withDelay(100 + STAGGER * 2, withTiming(0.9, { duration: FADE, easing: EASE_OUT }));
        buttonOpacity.value = withDelay(100 + STAGGER * 3, withTiming(1, { duration: FADE, easing: EASE_OUT }));
    }, [headerOpacity, item1Opacity, item2Opacity, buttonOpacity]);

    const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
    const item1Style = useAnimatedStyle(() => ({ opacity: item1Opacity.value }));
    const item2Style = useAnimatedStyle(() => ({ opacity: item2Opacity.value }));
    const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));

    const handlePermissions = async () => {
        await requestPermissions();
        router.push('/onboarding/join');
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
                ]}
            >
                <View style={styles.content}>
                    <Animated.Text style={[styles.header, headerStyle]}>PERMISSIONS</Animated.Text>

                    <Animated.View style={[styles.item, item1Style]}>
                        <View style={styles.labelRow}>
                            <Text style={styles.glyph}>{Glyphs.status.pulse}</Text>
                            <Text style={styles.label}>LOCATION</Text>
                        </View>
                        <Text style={styles.desc}>
                            To know when you're here.{'\n'}
                            Your position stays approximate.
                        </Text>
                    </Animated.View>

                    <Animated.View style={[styles.item, item2Style]}>
                        <View style={styles.labelRow}>
                            <Text style={styles.glyph}>{Glyphs.presence.echo}</Text>
                            <Text style={styles.label}>NOTIFICATIONS</Text>
                        </View>
                        <Text style={styles.desc}>
                            For rare network moments.{'\n'}
                            We believe in silence.
                        </Text>
                    </Animated.View>

                    {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
                </View>

                <Animated.View style={buttonStyle}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handlePermissions}
                        activeOpacity={0.7}
                        accessibilityLabel="Allow permissions"
                        accessibilityRole="button"
                    >
                        <Text style={styles.buttonText}>ALLOW</Text>
                    </TouchableOpacity>
                </Animated.View>
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
    },
    header: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontFamily: Typography.mono,
        fontWeight: '300',
        marginBottom: Spacing.xxl,
        letterSpacing: 3,
    },
    item: {
        marginBottom: Spacing.xl,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
        gap: Spacing.sm,
    },
    glyph: {
        color: Colors.tertiary,
        fontSize: Typography.size.md,
    },
    label: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
    },
    desc: {
        color: Colors.primary,
        lineHeight: 22,
        fontFamily: Typography.mono,
        fontSize: Typography.size.sm,
        paddingLeft: Spacing.lg + Spacing.sm,
        letterSpacing: 0.3,
    },
    error: {
        color: Colors.error,
        marginTop: Spacing.md,
        fontFamily: Typography.mono,
    },
    button: {
        borderColor: Colors.tertiary,
        borderWidth: 1,
        padding: Spacing.md,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.primary,
        fontFamily: Typography.mono,
        fontSize: Typography.size.xs,
        letterSpacing: 3,
    },
});

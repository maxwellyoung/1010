import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/Theme';
import { Glyphs } from '../../src/constants/Glyphs';
import { useProfile } from '../../src/hooks/useProfile';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const FADE = 500;
const STAGGER = 150;
const EASE_OUT = Easing.out(Easing.cubic);

export default function JoinScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [input, setInput] = useState('');
    const { createProfile } = useProfile();
    const [joining, setJoining] = useState(false);

    // Pure opacity animations
    const headerOpacity = useSharedValue(0);
    const descOpacity = useSharedValue(0);
    const inputOpacity = useSharedValue(0);
    const buttonOpacity = useSharedValue(0);
    const joiningOpacity = useSharedValue(0);

    useEffect(() => {
        headerOpacity.value = withDelay(100, withTiming(1, { duration: FADE, easing: EASE_OUT }));
        descOpacity.value = withDelay(100 + STAGGER, withTiming(0.8, { duration: FADE, easing: EASE_OUT }));
        inputOpacity.value = withDelay(100 + STAGGER * 2, withTiming(1, { duration: FADE, easing: EASE_OUT }));
        buttonOpacity.value = withDelay(100 + STAGGER * 3, withTiming(1, { duration: FADE, easing: EASE_OUT }));
    }, [headerOpacity, descOpacity, inputOpacity, buttonOpacity]);

    useEffect(() => {
        if (joining) {
            // Subtle breathing - very slow, barely noticeable
            joiningOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.5, { duration: 1500, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            );
        } else {
            joiningOpacity.value = withTiming(0, { duration: 200 });
        }
    }, [joining, joiningOpacity]);

    const headerStyle = useAnimatedStyle(() => ({ opacity: headerOpacity.value }));
    const descStyle = useAnimatedStyle(() => ({ opacity: descOpacity.value }));
    const inputStyle = useAnimatedStyle(() => ({ opacity: inputOpacity.value }));
    const buttonStyle = useAnimatedStyle(() => ({ opacity: buttonOpacity.value }));
    const joiningStyle = useAnimatedStyle(() => ({ opacity: joiningOpacity.value }));

    const handleJoin = async () => {
        if (!input) return;
        setJoining(true);
        try {
            await createProfile(input);
            setTimeout(() => {
                router.replace('/network');
            }, 1800);
        } catch (e) {
            console.error(e);
            setJoining(false);
        }
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
                    <Animated.Text style={[styles.header, headerStyle]}>
                        {joining ? 'CONNECTING' : 'LAST STEP'}
                    </Animated.Text>
                    <Animated.Text style={[styles.desc, descStyle]}>
                        {joining
                            ? 'Establishing presence in the network...'
                            : 'A way to reach you when the network awakens.'}
                    </Animated.Text>

                    {!joining && (
                        <Animated.View style={inputStyle}>
                            <TextInput
                                style={styles.input}
                                placeholder="phone or email"
                                placeholderTextColor={Colors.tertiary}
                                value={input}
                                onChangeText={setInput}
                                autoCapitalize="none"
                                keyboardType="email-address"
                                accessibilityLabel="Contact information"
                            />
                        </Animated.View>
                    )}

                    {joining && (
                        <Animated.View style={[styles.joiningIndicator, joiningStyle]}>
                            <Text style={styles.joiningGlyph}>{Glyphs.connection.linked}</Text>
                            <Text style={styles.joiningText}>handshake in progress</Text>
                        </Animated.View>
                    )}
                </View>

                <Animated.View style={buttonStyle}>
                    <TouchableOpacity
                        style={[styles.button, (!input || joining) && styles.buttonDisabled]}
                        onPress={handleJoin}
                        disabled={!input || joining}
                        activeOpacity={0.7}
                        accessibilityLabel={joining ? 'Joining network' : 'Join the network'}
                        accessibilityRole="button"
                    >
                        {joining ? (
                            <ActivityIndicator color={Colors.background} size="small" />
                        ) : (
                            <Text style={[styles.buttonText, !input && styles.buttonTextDisabled]}>
                                JOIN
                            </Text>
                        )}
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
        marginBottom: Spacing.md,
        letterSpacing: 3,
    },
    desc: {
        color: Colors.secondary,
        marginBottom: Spacing.xl,
        fontFamily: Typography.mono,
        fontSize: Typography.size.sm,
        lineHeight: 22,
        letterSpacing: 0.3,
    },
    input: {
        borderBottomColor: Colors.tertiary,
        borderBottomWidth: 1,
        color: Colors.primary,
        fontSize: Typography.size.md,
        paddingVertical: Spacing.sm,
        fontFamily: Typography.mono,
        letterSpacing: 0.5,
    },
    joiningIndicator: {
        alignItems: 'center',
        paddingVertical: Spacing.xl,
    },
    joiningGlyph: {
        color: Colors.secondary,
        fontSize: Typography.size.xl,
        fontFamily: Typography.mono,
        marginBottom: Spacing.md,
    },
    joiningText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: Colors.surfaceHighlight,
    },
    buttonText: {
        color: Colors.background,
        fontFamily: Typography.mono,
        fontSize: Typography.size.xs,
        letterSpacing: 3,
    },
    buttonTextDisabled: {
        color: Colors.tertiary,
    },
});

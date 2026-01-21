import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useAnimatedStyle,
    SharedValue,
    withRepeat,
    withSequence,
    withTiming,
    useSharedValue,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing, Layout } from '../../constants/Theme';

/**
 * Network Header - Journey-inspired
 *
 * Just the name. The network speaks through presence, not words.
 */

interface NetworkHeaderProps {
    isInsideNetwork: boolean;
    isActivated: boolean;
    daysRemaining: number;
    breathLabel: string;
    presenceCount: number;
    densityScore: number;
    realtimeEnabled: boolean;
    windowIsOpen: boolean;
    windowMinutes: number;
    windowPulse: SharedValue<number>;
    onLongPress?: () => void;
}

export const NetworkHeader: React.FC<NetworkHeaderProps> = React.memo(({
    isInsideNetwork,
    windowIsOpen,
    windowPulse,
    onLongPress,
}) => {
    const breath = useSharedValue(0);

    React.useEffect(() => {
        breath.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            false
        );
    }, [breath]);

    const titleStyle = useAnimatedStyle(() => ({
        opacity: 0.6 + breath.value * 0.4,
    }));

    // Window indicator pulses when a moment is active
    const windowStyle = useAnimatedStyle(() => ({
        opacity: windowPulse.value * 0.8,
        transform: [{ scale: 0.8 + windowPulse.value * 0.4 }],
    }));

    return (
        <TouchableOpacity
            style={styles.container}
            onLongPress={onLongPress}
            activeOpacity={1}
        >
            <Animated.Text
                style={[
                    styles.title,
                    !isInsideNetwork && styles.titleDistant,
                    titleStyle,
                ]}
            >
                1010
            </Animated.Text>

            {/* Window moment indicator - just a subtle glow */}
            {windowIsOpen && (
                <Animated.View style={[styles.windowIndicator, windowStyle]} />
            )}
        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingTop: Spacing.lg,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.size.xxl,
        fontWeight: '300',
        letterSpacing: 12,
        fontFamily: Typography.sansMedium,
    },
    titleDistant: {
        color: Colors.tertiary,
    },
    windowIndicator: {
        position: 'absolute',
        top: Spacing.lg + 8,
        right: -Spacing.xl,
        width: 8,
        height: 8,
        borderRadius: Layout.radius.full,
        backgroundColor: Colors.accent,
    },
});

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface WindowAlertProps {
    visible: boolean;
    minutesRemaining: number;
}

export const WindowAlert: React.FC<WindowAlertProps> = ({ visible, minutesRemaining }) => {
    const opacity = useSharedValue(0);
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(1, { duration: 1000 }),
                    withTiming(0.5, { duration: 1000 })
                ),
                -1,
                true
            );
        } else {
            opacity.value = withTiming(0);
        }
    }, [visible]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
        borderColor: `rgba(255, 170, 0, ${opacity.value})`,
    }));

    if (!visible) return null;

    return (
        <View style={[styles.container, { top: insets.top }]}>
            <Animated.View style={[styles.alertBox, animatedStyle]}>
                <Text style={styles.header}>WINDOW OPEN</Text>
                <View style={styles.divider} />
                <Text style={styles.timer}>{minutesRemaining} MINUTES</Text>
                <Text style={styles.instruction}>STAY IN MOTION</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    alertBox: {
        backgroundColor: 'rgba(17, 17, 17, 0.92)',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.warning,
        alignItems: 'center',
        width: '88%',
        borderRadius: 999,
    },
    header: {
        color: Colors.warning,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
    },
    divider: {
        width: 48,
        height: 1,
        backgroundColor: Colors.surfaceHighlight,
        marginVertical: Spacing.xs,
        opacity: 0.6,
    },
    timer: {
        color: Colors.primary,
        fontSize: Typography.size.sm,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
    instruction: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 1,
        marginTop: Spacing.xs,
    },
});

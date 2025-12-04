import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/Theme';

interface WindowAlertProps {
    visible: boolean;
    minutesRemaining: number;
}

export const WindowAlert: React.FC<WindowAlertProps> = ({ visible, minutesRemaining }) => {
    const opacity = useSharedValue(0);

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
        borderColor: `rgba(255, 170, 0, ${opacity.value})`, // Warning color
    }));

    if (!visible) return null;

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.alertBox, animatedStyle]}>
                <Text style={styles.header}>WINDOW OPEN</Text>
                <Text style={styles.timer}>{minutesRemaining} MINUTES REMAINING</Text>
                <Text style={styles.instruction}>STAY IN MOTION.</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 100,
    },
    alertBox: {
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.warning,
        alignItems: 'center',
        width: '80%',
    },
    header: {
        color: Colors.warning,
        fontSize: Typography.size.lg,
        fontWeight: 'bold',
        letterSpacing: 2,
        marginBottom: Spacing.xs,
    },
    timer: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        fontFamily: Typography.mono,
        marginBottom: Spacing.xs,
    },
    instruction: {
        color: Colors.secondary,
        fontSize: Typography.size.sm,
        letterSpacing: 1,
    },
});

import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
    interpolate,
} from 'react-native-reanimated';
import { Colors, Spacing, Layout, Typography } from '../constants/Theme';
import { useReducedMotion } from '../hooks/useReducedMotion';

interface SkeletonProps {
    /** Width of the skeleton. Can be number or percentage string */
    width?: DimensionValue;
    /** Height of the skeleton */
    height?: number;
    /** Border radius */
    borderRadius?: number;
    /** Additional styles */
    style?: ViewStyle;
    /** Animation duration in ms */
    duration?: number;
}

/**
 * A loading skeleton component that displays a pulsing placeholder
 * while content is loading. Respects reduced motion preferences.
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = 20,
    borderRadius = Layout.radius.sm,
    style,
    duration = 1500,
}) => {
    const reduceMotion = useReducedMotion();
    const shimmer = useSharedValue(0);

    useEffect(() => {
        if (reduceMotion) {
            // For reduced motion, just show a static dim state
            shimmer.value = 0.5;
            return;
        }

        // Animate shimmer effect
        shimmer.value = withRepeat(
            withSequence(
                withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            false
        );
    }, [reduceMotion, shimmer, duration]);

    const animatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(shimmer.value, [0, 1], [0.3, 0.6]);
        return {
            opacity,
        };
    });

    return (
        <Animated.View
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                },
                animatedStyle,
                style,
            ]}
            accessibilityLabel="Loading"
            accessibilityRole="progressbar"
        />
    );
};

interface SkeletonTextProps {
    /** Number of lines to show */
    lines?: number;
    /** Width of the last line (percentage) */
    lastLineWidth?: DimensionValue;
    /** Line height */
    lineHeight?: number;
    /** Gap between lines */
    gap?: number;
    /** Additional styles */
    style?: ViewStyle;
}

/**
 * A text skeleton that shows multiple lines of loading placeholders
 */
export const SkeletonText: React.FC<SkeletonTextProps> = ({
    lines = 3,
    lastLineWidth = '60%',
    lineHeight = 14,
    gap = Spacing.xs,
    style,
}) => {
    return (
        <View style={[styles.textContainer, style]}>
            {Array.from({ length: lines }).map((_, index) => {
                const isLastLine = index === lines - 1;
                return (
                    <Skeleton
                        key={index}
                        width={isLastLine ? lastLineWidth : '100%'}
                        height={lineHeight}
                        style={{ marginBottom: isLastLine ? 0 : gap }}
                    />
                );
            })}
        </View>
    );
};

interface SkeletonCircleProps {
    /** Diameter of the circle */
    size?: number;
    /** Additional styles */
    style?: ViewStyle;
}

/**
 * A circular skeleton for avatars or icons
 */
export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
    size = 40,
    style,
}) => {
    return (
        <Skeleton
            width={size}
            height={size}
            borderRadius={size / 2}
            style={style}
        />
    );
};

interface NetworkStatSkeletonProps {
    style?: ViewStyle;
}

/**
 * A skeleton specifically for the network stats display
 */
export const NetworkStatSkeleton: React.FC<NetworkStatSkeletonProps> = ({
    style,
}) => {
    return (
        <View style={[styles.statContainer, style]} accessibilityLabel="Loading network statistics">
            {/* Label skeleton */}
            <Skeleton width={100} height={11} style={styles.statLabel} />
            {/* Large number skeleton */}
            <Skeleton width={80} height={64} style={styles.statValue} />
        </View>
    );
};

const styles = StyleSheet.create({
    skeleton: {
        backgroundColor: Colors.surfaceHighlight,
    },
    textContainer: {
        width: '100%',
    },
    statContainer: {
        alignItems: 'center',
    },
    statLabel: {
        marginBottom: Spacing.xs,
    },
    statValue: {
        marginBottom: Spacing.sm,
    },
});

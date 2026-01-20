import React, { memo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder, Dimensions } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../constants/Theme';
import { Motion } from '../constants/Motion';
import type { WalkPoint } from '../hooks/usePatternWalkCreator';

interface WalkEditorProps {
    isRecording: boolean;
    points: WalkPoint[];
    stats: {
        pointCount: number;
        distance: number;
        duration: number;
        isValid: boolean;
    };
    onStartRecording: () => void;
    onAddPoint: (x: number, y: number) => void;
    onStopRecording: () => void;
    onClear: () => void;
    onSave: (name?: string) => void;
}

const SIZE = 300;

const pointsToPath = (points: WalkPoint[]): string => {
    if (points.length < 2) return '';

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
};

const formatDuration = (ms: number): string => {
    const minutes = Math.round(ms / 60000);
    return `${minutes} min`;
};

const formatDistance = (meters: number): string => {
    if (meters < 1000) {
        return `${meters}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
};

export const WalkEditor = memo<WalkEditorProps>(({
    isRecording,
    points,
    stats,
    onStartRecording,
    onAddPoint,
    onStopRecording,
    onClear,
    onSave,
}) => {
    const containerRef = useRef<View>(null);
    const buttonScale = useSharedValue(1);

    // Handle drawing gestures
    const panResponder = React.useMemo(
        () =>
            PanResponder.create({
                onStartShouldSetPanResponder: () => isRecording,
                onMoveShouldSetPanResponder: () => isRecording,
                onPanResponderGrant: (evt) => {
                    const { locationX, locationY } = evt.nativeEvent;
                    onAddPoint(locationX, locationY);
                },
                onPanResponderMove: (evt) => {
                    const { locationX, locationY } = evt.nativeEvent;
                    onAddPoint(locationX, locationY);
                },
            }),
        [isRecording, onAddPoint]
    );

    const handleRecordPress = useCallback(() => {
        // Subtle press feedback - no bounce
        buttonScale.value = withTiming(0.96, { duration: 80, easing: Easing.out(Easing.cubic) });
        setTimeout(() => {
            buttonScale.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) });
        }, 80);

        if (isRecording) {
            onStopRecording();
        } else {
            onStartRecording();
        }
    }, [isRecording, onStartRecording, onStopRecording, buttonScale]);

    const buttonStyle = useAnimatedStyle(() => ({
        transform: [{ scale: buttonScale.value }],
    }));

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>
                    {isRecording ? 'Draw your path' : 'Pattern Walk Creator'}
                </Text>
                <Text style={styles.subtitle}>
                    {isRecording
                        ? 'Trace a route through the network'
                        : 'Create a walk for others to follow'}
                </Text>
            </View>

            {/* Canvas */}
            <View
                ref={containerRef}
                style={styles.canvas}
                {...panResponder.panHandlers}
            >
                {/* Grid */}
                <View style={styles.grid}>
                    {[...Array(7)].map((_, i) => (
                        <View
                            key={`v-${i}`}
                            style={[styles.gridLine, styles.gridLineV, { left: `${(i / 6) * 100}%` }]}
                        />
                    ))}
                    {[...Array(7)].map((_, i) => (
                        <View
                            key={`h-${i}`}
                            style={[styles.gridLine, styles.gridLineH, { top: `${(i / 6) * 100}%` }]}
                        />
                    ))}
                </View>

                {/* Path */}
                <Svg style={StyleSheet.absoluteFill} width={SIZE} height={SIZE}>
                    {points.length >= 2 && (
                        <Path
                            d={pointsToPath(points)}
                            stroke={isRecording ? Colors.accent : Colors.primary}
                            strokeWidth={2}
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    )}

                    {/* Start point */}
                    {points.length > 0 && (
                        <Circle
                            cx={points[0].x}
                            cy={points[0].y}
                            r={6}
                            fill={Colors.accent}
                        />
                    )}

                    {/* End point */}
                    {points.length > 1 && (
                        <Circle
                            cx={points[points.length - 1].x}
                            cy={points[points.length - 1].y}
                            r={4}
                            fill={Colors.primary}
                            stroke={Colors.accent}
                            strokeWidth={1}
                        />
                    )}
                </Svg>

                {/* Recording indicator */}
                {isRecording && (
                    <View style={styles.recordingIndicator}>
                        <View style={styles.recordingDot} />
                        <Text style={styles.recordingText}>RECORDING</Text>
                    </View>
                )}

                {/* Empty state */}
                {!isRecording && points.length === 0 && (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyGlyph}>◇</Text>
                        <Text style={styles.emptyText}>Tap record to begin</Text>
                    </View>
                )}
            </View>

            {/* Stats */}
            {points.length > 0 && (
                <View style={styles.stats}>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{stats.pointCount}</Text>
                        <Text style={styles.statLabel}>points</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{formatDistance(stats.distance)}</Text>
                        <Text style={styles.statLabel}>distance</Text>
                    </View>
                    <View style={styles.stat}>
                        <Text style={styles.statValue}>{formatDuration(stats.duration)}</Text>
                        <Text style={styles.statLabel}>walk time</Text>
                    </View>
                </View>
            )}

            {/* Controls */}
            <View style={styles.controls}>
                {/* Record/Stop button */}
                <Animated.View style={buttonStyle}>
                    <TouchableOpacity
                        style={[
                            styles.recordButton,
                            isRecording && styles.recordButtonActive,
                        ]}
                        onPress={handleRecordPress}
                    >
                        <View style={[styles.recordIcon, isRecording && styles.stopIcon]} />
                    </TouchableOpacity>
                </Animated.View>

                {/* Secondary actions */}
                <View style={styles.secondaryActions}>
                    {points.length > 0 && !isRecording && (
                        <>
                            <TouchableOpacity style={styles.textButton} onPress={onClear}>
                                <Text style={styles.textButtonLabel}>Clear</Text>
                            </TouchableOpacity>

                            {stats.isValid && (
                                <TouchableOpacity
                                    style={[styles.textButton, styles.saveButton]}
                                    onPress={() => onSave()}
                                >
                                    <Text style={[styles.textButtonLabel, styles.saveButtonLabel]}>
                                        Save Walk
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.lg,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontFamily: Typography.mono,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
    canvas: {
        width: SIZE,
        height: SIZE,
        alignSelf: 'center',
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
        position: 'relative',
    },
    grid: {
        ...StyleSheet.absoluteFillObject,
    },
    gridLine: {
        position: 'absolute',
        backgroundColor: Colors.surfaceHighlight,
        opacity: 0.3,
    },
    gridLineV: {
        width: 1,
        height: '100%',
    },
    gridLineH: {
        width: '100%',
        height: 1,
    },
    recordingIndicator: {
        position: 'absolute',
        top: Spacing.sm,
        left: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
    },
    recordingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
        marginRight: Spacing.xs,
    },
    recordingText: {
        color: '#FF3B30',
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
    },
    emptyState: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyGlyph: {
        color: Colors.tertiary,
        fontSize: 32,
        marginBottom: Spacing.sm,
    },
    emptyText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: Spacing.lg,
        paddingVertical: Spacing.md,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    stat: {
        alignItems: 'center',
    },
    statValue: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontFamily: Typography.mono,
    },
    statLabel: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 1,
        marginTop: Spacing.xs,
    },
    controls: {
        marginTop: Spacing.xl,
        alignItems: 'center',
    },
    recordButton: {
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 3,
        borderColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordButtonActive: {
        borderColor: '#FF3B30',
    },
    recordIcon: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Colors.primary,
    },
    stopIcon: {
        borderRadius: 4,
        backgroundColor: '#FF3B30',
    },
    secondaryActions: {
        flexDirection: 'row',
        marginTop: Spacing.lg,
        gap: Spacing.md,
    },
    textButton: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    textButtonLabel: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        fontFamily: Typography.mono,
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    saveButton: {
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    saveButtonLabel: {
        color: Colors.accent,
    },
});

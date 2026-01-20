import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    SharedValue,
    interpolate,
} from 'react-native-reanimated';
import { Colors, Typography, Spacing } from '../../constants/Theme';
import { Copy, formatPeerId } from '../../constants/Copy';
import type { RitualState } from '../../hooks/useQuietRitual';

interface ProximityPanelProps {
    isActive: boolean;
    lastEncounterId: string | null;
    nearbyDistance: number | null;
    resonance: number;
    ritual: RitualState;
    lastError: string | null;
    pulse: SharedValue<number>;
    baseOpacity: SharedValue<number>;
}

export const ProximityPanel: React.FC<ProximityPanelProps> = React.memo(({
    isActive,
    lastEncounterId,
    nearbyDistance,
    resonance,
    ritual,
    lastError,
    pulse,
    baseOpacity,
}) => {
    const auraStyle = useAnimatedStyle(() => {
        const scale = interpolate(pulse.value, [0, 1], [0.96, 1.08]);
        const opacity = baseOpacity.value + interpolate(pulse.value, [0, 1], [0.02, 0.14]);
        return {
            transform: [{ scale }],
            opacity,
        };
    });

    if (!isActive) return null;

    const resonancePercent = Math.round(resonance * 100);
    const resonanceLabel = Copy.nearField.resonance(resonancePercent);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.aura, auraStyle]} />

            <Text style={styles.label}>{Copy.nearField.label}</Text>

            <Text style={styles.value}>
                {lastEncounterId
                    ? Copy.nearField.linked(lastEncounterId)
                    : Copy.nearField.scanning}
            </Text>

            <Text style={styles.meta}>
                {nearbyDistance !== null && nearbyDistance >= 0
                    ? `${Copy.nearField.distance(nearbyDistance)}  ${resonanceLabel}`
                    : Copy.nearField.searching}
            </Text>

            {ritual.arming && !ritual.active && (
                <View style={styles.ritualPrep}>
                    <Text style={styles.ritualPrepLabel}>{Copy.ritual.hold}</Text>
                    <View style={styles.ritualPrepTrack}>
                        <View
                            style={[
                                styles.ritualPrepFill,
                                { width: `${Math.round(ritual.armingProgress * 100)}%` }
                            ]}
                        />
                    </View>
                </View>
            )}

            <Text style={styles.signature}>{Copy.nearField.signature}</Text>

            {lastError && (
                <Text style={styles.error}>{lastError}</Text>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glass,
        borderRadius: 8,
        overflow: 'hidden',
    },
    aura: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Colors.surfaceHighlight,
    },
    label: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginBottom: Spacing.xs,
        fontFamily: Typography.mono,
    },
    value: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        letterSpacing: 1,
        fontFamily: Typography.mono,
    },
    meta: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 1,
        marginTop: Spacing.xs,
        fontFamily: Typography.mono,
    },
    ritualPrep: {
        marginTop: Spacing.sm,
        width: 160,
        alignItems: 'center',
    },
    ritualPrepLabel: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
    },
    ritualPrepTrack: {
        width: '100%',
        height: 4,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    ritualPrepFill: {
        height: '100%',
        backgroundColor: Colors.tertiary,
    },
    signature: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginTop: Spacing.sm,
        fontFamily: Typography.mono,
    },
    error: {
        color: Colors.warning,
        fontSize: Typography.size.xs,
        marginTop: Spacing.xs,
        fontFamily: Typography.mono,
    },
});

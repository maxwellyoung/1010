import React, { useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withRepeat,
    withSequence,
    withDelay,
    Easing,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';
import type { Companion } from '../hooks/useCompanions';

/**
 * Companion Overlay - Journey-inspired
 *
 * Other travelers as soft, breathing lights.
 * Anonymous. Peaceful. Present.
 * They drift slowly, pulse when chirping.
 */

interface CompanionOverlayProps {
    companions: Companion[];
    size: number;
}

interface CompanionMarkerProps {
    companion: Companion;
    size: number;
    index: number;
}

// Map normalized (-1 to 1) to screen coordinates
const toScreen = (norm: number, size: number) => ((norm + 1) / 2) * size;

const CompanionMarker = memo<CompanionMarkerProps>(({ companion, size, index }) => {
    const breath = useSharedValue(0);
    const presence = useSharedValue(0);
    const chirpGlow = useSharedValue(0);

    // Breathing - slightly different timing for each companion
    useEffect(() => {
        const duration = 5000 + (index % 3) * 1000;
        breath.value = withDelay(
            index * 300,
            withRepeat(
                withSequence(
                    withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            )
        );
    }, [breath, index]);

    // Presence fade in/out
    useEffect(() => {
        presence.value = withTiming(companion.isNearby ? 1 : 0, {
            duration: companion.isNearby ? 1200 : 2500,
            easing: companion.isNearby ? Easing.out(Easing.quad) : Easing.in(Easing.quad),
        });
    }, [companion.isNearby, presence]);

    // Chirp glow expansion
    useEffect(() => {
        if (companion.isChirping) {
            chirpGlow.value = 0;
            chirpGlow.value = withSequence(
                withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
                withTiming(0, { duration: 1000, easing: Easing.out(Easing.quad) })
            );
        }
    }, [companion.isChirping, companion.chirpCount, chirpGlow]);

    const x = toScreen(companion.x, size);
    const y = toScreen(companion.y, size);

    // Size based on resonance - closer = larger
    const baseSize = 8 + companion.resonance * 6;

    // Core glow style
    const coreStyle = useAnimatedStyle(() => {
        const breathScale = 0.85 + breath.value * 0.3;
        const baseOpacity = 0.2 + companion.resonance * 0.4;

        return {
            opacity: presence.value * baseOpacity * (0.7 + breath.value * 0.3),
            transform: [{ scale: breathScale }],
        };
    });

    // Outer halo style - very soft
    const haloStyle = useAnimatedStyle(() => {
        const haloOpacity = interpolate(
            breath.value,
            [0, 1],
            [0.05, 0.15],
            Extrapolation.CLAMP
        );

        return {
            opacity: presence.value * haloOpacity,
            transform: [{ scale: 1 + breath.value * 0.2 }],
        };
    });

    // Chirp ring style
    const chirpStyle = useAnimatedStyle(() => ({
        opacity: chirpGlow.value * 0.4,
        transform: [{ scale: 1 + chirpGlow.value * 2.5 }],
    }));

    const haloSize = baseSize * 3;

    return (
        <View style={[styles.marker, { left: x - haloSize / 2, top: y - haloSize / 2 }]}>
            {/* Outer halo - very soft */}
            <Animated.View
                style={[
                    styles.halo,
                    {
                        width: haloSize,
                        height: haloSize,
                        borderRadius: haloSize / 2,
                    },
                    haloStyle,
                ]}
            />
            {/* Chirp ring - expands outward */}
            <Animated.View
                style={[
                    styles.chirpRing,
                    {
                        width: baseSize * 2,
                        height: baseSize * 2,
                        borderRadius: baseSize,
                        left: (haloSize - baseSize * 2) / 2,
                        top: (haloSize - baseSize * 2) / 2,
                    },
                    chirpStyle,
                ]}
            />
            {/* Core light */}
            <Animated.View
                style={[
                    styles.core,
                    {
                        width: baseSize * 2,
                        height: baseSize * 2,
                        borderRadius: baseSize,
                        left: (haloSize - baseSize * 2) / 2,
                        top: (haloSize - baseSize * 2) / 2,
                    },
                    coreStyle,
                ]}
            />
        </View>
    );
});

export const CompanionOverlay: React.FC<CompanionOverlayProps> = memo(({ companions, size }) => {
    if (companions.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            {companions.map((companion, index) => (
                <CompanionMarker
                    key={companion.id}
                    companion={companion}
                    size={size}
                    index={index}
                />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    marker: {
        position: 'absolute',
    },
    halo: {
        position: 'absolute',
        backgroundColor: Colors.tertiary,
    },
    core: {
        position: 'absolute',
        backgroundColor: Colors.secondary,
    },
    chirpRing: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: Colors.tertiary,
        backgroundColor: 'transparent',
    },
});

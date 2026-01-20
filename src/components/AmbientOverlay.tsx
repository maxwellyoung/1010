import React, { useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';
import type { PassingEcho } from '../hooks/usePassingEchoes';
import type { GhostPing } from '../hooks/useGhostPings';
import type { SignalGlyph } from '../hooks/useSignalGlyphs';

/**
 * Ambient Overlay - Journey-inspired
 *
 * Anonymous presence. No labels. No text.
 * Just subtle dots that breathe with the network.
 */

interface AmbientOverlayProps {
    passingEchoes: PassingEcho[];
    ghostPings: GhostPing[];
    glyphs: SignalGlyph[]; // Ignored in new design
}

const getPositionStyle = (x: number, y: number) => ({
    left: `${(x + 1) * 50}%` as const,
    top: `${(y + 1) * 50}%` as const,
});

// Passing echo - a ripple that fades out
const PassingEchoMark = memo(({ echo }: { echo: PassingEcho }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(1, {
            duration: echo.ttlMs,
            easing: Easing.out(Easing.cubic)
        });
    }, [echo.ttlMs, progress]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: 0.3 * (1 - progress.value),
        transform: [{ scale: 0.5 + progress.value * 1.5 }],
    }));

    return (
        <Animated.View style={[styles.echo, getPositionStyle(echo.x, echo.y), animStyle]}>
            <View style={styles.echoRing} />
        </Animated.View>
    );
});

// Ghost ping - anonymous presence, just a dot
const PresenceDot = memo(({ ping }: { ping: GhostPing }) => {
    const breath = useSharedValue(0);

    // Age-based opacity (older = more faded)
    const ageOpacity = Math.max(0.1, 1 - (ping.ageMinutes / 15) * 0.7);

    useEffect(() => {
        // Very slow breathing - barely perceptible
        breath.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.sin) }),
                withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.sin) })
            ),
            -1,
            false
        );
    }, [breath]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: ageOpacity * (0.3 + breath.value * 0.15),
    }));

    return (
        <Animated.View style={[styles.presence, getPositionStyle(ping.x, ping.y), animStyle]} />
    );
});

export const AmbientOverlay = memo<AmbientOverlayProps>(({ passingEchoes, ghostPings }) => {
    // Limit to 5 presence dots max - less is more
    const limitedPings = ghostPings.slice(0, 5);

    return (
        <View style={styles.container} pointerEvents="none">
            {limitedPings.map(ping => (
                <PresenceDot key={ping.id} ping={ping} />
            ))}
            {passingEchoes.map(echo => (
                <PassingEchoMark key={echo.id} echo={echo} />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    presence: {
        position: 'absolute',
        width: 6,
        height: 6,
        marginLeft: -3,
        marginTop: -3,
        borderRadius: 3,
        backgroundColor: Colors.secondary,
    },
    echo: {
        position: 'absolute',
        width: 40,
        height: 40,
        marginLeft: -20,
        marginTop: -20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    echoRing: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
});

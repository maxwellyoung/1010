import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography } from '../constants/Theme';
import type { PassingEcho } from '../hooks/usePassingEchoes';
import type { GhostPing } from '../hooks/useGhostPings';
import type { SignalGlyph } from '../hooks/useSignalGlyphs';

interface AmbientOverlayProps {
    passingEchoes: PassingEcho[];
    ghostPings: GhostPing[];
    glyphs: SignalGlyph[];
}

const mapPosition = (x: number, y: number) => ({
    left: `${(x + 1) * 50}%`,
    top: `${(y + 1) * 50}%`,
});

const PassingEchoMark = ({ echo }: { echo: PassingEcho }) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withTiming(1, { duration: echo.ttlMs, easing: Easing.out(Easing.quad) });
    }, [echo.ttlMs, progress]);

    const style = useAnimatedStyle(() => ({
        opacity: 0.5 - progress.value * 0.5,
        transform: [{ scale: 0.6 + progress.value * 1.6 }],
    }));

    return (
        <Animated.View style={[styles.passingEcho, mapPosition(echo.x, echo.y), style]}>
            <View style={styles.passingEchoRing} />
        </Animated.View>
    );
};

const GhostPingMark = ({ ping }: { ping: GhostPing }) => {
    const pulse = useSharedValue(0);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
                withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) })
            ),
            -1,
            true
        );
    }, [pulse]);

    const style = useAnimatedStyle(() => ({
        opacity: 0.15 + pulse.value * 0.25,
        transform: [{ scale: 0.9 + pulse.value * 0.3 }],
    }));

    return (
        <Animated.View style={[styles.ghostPing, mapPosition(ping.x, ping.y), style]}>
            <Text style={styles.ghostLabel}>{`${ping.ageMinutes}m`}</Text>
        </Animated.View>
    );
};

const GlyphMark = ({ glyph }: { glyph: SignalGlyph }) => {
    const fade = useSharedValue(0);

    useEffect(() => {
        fade.value = withSequence(
            withTiming(1, { duration: 800 }),
            withTiming(0, { duration: glyph.ttlMs - 800 })
        );
    }, [fade, glyph.ttlMs]);

    const style = useAnimatedStyle(() => ({
        opacity: fade.value,
    }));

    return (
        <Animated.View style={[styles.glyph, mapPosition(glyph.x, glyph.y), style]}>
            <Text style={styles.glyphText}>{glyph.symbol}</Text>
        </Animated.View>
    );
};

export const AmbientOverlay: React.FC<AmbientOverlayProps> = ({ passingEchoes, ghostPings, glyphs }) => {
    return (
        <View style={styles.container} pointerEvents="none">
            {ghostPings.map(ping => (
                <GhostPingMark key={ping.id} ping={ping} />
            ))}
            {glyphs.map(glyph => (
                <GlyphMark key={glyph.id} glyph={glyph} />
            ))}
            {passingEchoes.map(echo => (
                <PassingEchoMark key={echo.id} echo={echo} />
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
    },
    passingEcho: {
        position: 'absolute',
        marginLeft: -28,
        marginTop: -28,
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    passingEchoRing: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    ghostPing: {
        position: 'absolute',
        marginLeft: -10,
        marginTop: -10,
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.tertiary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostLabel: {
        color: Colors.tertiary,
        fontSize: 8,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
    glyph: {
        position: 'absolute',
        marginLeft: -12,
        marginTop: -12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    glyphText: {
        color: Colors.secondary,
        fontSize: 10,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
});

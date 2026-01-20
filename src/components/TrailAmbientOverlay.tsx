import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../constants/Theme';
import type { PassingEcho } from '../hooks/usePassingEchoes';
import type { GhostPing } from '../hooks/useGhostPings';
import type { SignalGlyph } from '../hooks/useSignalGlyphs';

/**
 * Trail Ambient Overlay - Journey-inspired
 *
 * Minimal presence markers. No lines. No text.
 * Just dots where others have been.
 */

interface TrailAmbientOverlayProps {
    passingEchoes: PassingEcho[];
    ghostPings: GhostPing[];
    glyphs: SignalGlyph[]; // Ignored
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

export const TrailAmbientOverlay: React.FC<TrailAmbientOverlayProps> = ({ passingEchoes, ghostPings }) => {
    const size = 300;

    // Limit elements for cleaner visuals
    const limitedEchoes = passingEchoes.slice(0, 3);
    const limitedPings = ghostPings.slice(0, 4);

    return (
        <View style={styles.container} pointerEvents="none">
            <Svg width={size} height={size}>
                {/* Passing echoes as fading dots */}
                {limitedEchoes.map(echo => {
                    const x = mapCoord(echo.x, size);
                    const y = mapCoord(echo.y, size);
                    return (
                        <Circle
                            key={echo.id}
                            cx={x}
                            cy={y}
                            r={4}
                            fill={Colors.surfaceHighlight}
                            opacity={0.3}
                        />
                    );
                })}

                {/* Ghost pings as subtle presence dots */}
                {limitedPings.map(ping => {
                    const x = mapCoord(ping.x, size);
                    const y = mapCoord(ping.y, size);
                    const ageOpacity = Math.max(0.1, 0.4 - (ping.ageMinutes / 15) * 0.3);
                    return (
                        <Circle
                            key={ping.id}
                            cx={x}
                            cy={y}
                            r={3}
                            fill={Colors.tertiary}
                            opacity={ageOpacity}
                        />
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: 300,
        height: 300,
        left: 0,
        top: 0,
    },
});

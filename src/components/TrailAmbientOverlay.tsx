import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Typography } from '../constants/Theme';
import type { PassingEcho } from '../hooks/usePassingEchoes';
import type { GhostPing } from '../hooks/useGhostPings';
import type { SignalGlyph } from '../hooks/useSignalGlyphs';

interface TrailAmbientOverlayProps {
    passingEchoes: PassingEcho[];
    ghostPings: GhostPing[];
    glyphs: SignalGlyph[];
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

export const TrailAmbientOverlay: React.FC<TrailAmbientOverlayProps> = ({ passingEchoes, ghostPings, glyphs }) => {
    const size = 300;
    const center = size / 2;

    return (
        <View style={styles.container} pointerEvents="none">
            <Svg width={size} height={size}>
                {passingEchoes.map(echo => {
                    const x = mapCoord(echo.x, size);
                    const y = mapCoord(echo.y, size);
                    return (
                        <React.Fragment key={echo.id}>
                            <Line x1={center} y1={center} x2={x} y2={y} stroke={Colors.tertiary} strokeWidth={0.6} opacity={0.35} />
                            <Rect x={x - 2} y={y - 2} width={4} height={4} fill={Colors.surfaceHighlight} opacity={0.6} />
                        </React.Fragment>
                    );
                })}
                {ghostPings.map(ping => {
                    const x = mapCoord(ping.x, size);
                    const y = mapCoord(ping.y, size);
                    return (
                        <React.Fragment key={ping.id}>
                            <Circle cx={x} cy={y} r={5} stroke={Colors.secondary} strokeWidth={0.5} opacity={0.35} />
                            <Line x1={x - 4} y1={y} x2={x + 4} y2={y} stroke={Colors.secondary} strokeWidth={0.5} opacity={0.35} />
                        </React.Fragment>
                    );
                })}
                {glyphs.map(glyph => {
                    const x = mapCoord(glyph.x, size);
                    const y = mapCoord(glyph.y, size);
                    return (
                        <SvgText
                            key={glyph.id}
                            x={x}
                            y={y}
                            fill={Colors.tertiary}
                            fontSize={10}
                            fontFamily={Typography.mono}
                            textAnchor="middle"
                            opacity={0.7}
                        >
                            {glyph.symbol}
                        </SvgText>
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

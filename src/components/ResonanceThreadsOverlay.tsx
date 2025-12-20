import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Text as SvgText } from 'react-native-svg';
import { Colors, Typography } from '../constants/Theme';
import type { ResonanceThread } from '../hooks/useResonanceThreads';

interface ResonanceThreadsOverlayProps {
    threads: ResonanceThread[];
    size: number;
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

export const ResonanceThreadsOverlay: React.FC<ResonanceThreadsOverlayProps> = ({ threads, size }) => {
    if (!threads.length) {
        return null;
    }

    const glyphs = ['<>', '[]', '::', '—', '∙'];

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size}>
                {threads.map(thread => {
                    const x1 = mapCoord(thread.from.x, size);
                    const y1 = mapCoord(thread.from.y, size);
                    const x2 = mapCoord(thread.to.x, size);
                    const y2 = mapCoord(thread.to.y, size);
                    const glyph = glyphs[Math.abs(thread.id.length + Math.floor(x1 + y1)) % glyphs.length];
                    return (
                        <React.Fragment key={thread.id}>
                            <Line x1={x1} y1={y1} x2={x2} y2={y2} stroke={Colors.tertiary} strokeWidth={0.6} opacity={0.35} />
                            <Circle cx={x1} cy={y1} r={2} fill={Colors.surfaceHighlight} opacity={0.6} />
                            <Circle cx={x2} cy={y2} r={2} fill={Colors.surfaceHighlight} opacity={0.6} />
                            <SvgText
                                x={x1 + 6}
                                y={y1 - 2}
                                fill={Colors.tertiary}
                                fontSize={8}
                                fontFamily={Typography.mono}
                                opacity={0.6}
                            >
                                {glyph}
                            </SvgText>
                        </React.Fragment>
                    );
                })}
            </Svg>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
});

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle } from 'react-native-svg';
import { Colors } from '../constants/Theme';
import type { ResonanceThread } from '../hooks/useResonanceThreads';

/**
 * Resonance Threads Overlay - Journey-inspired
 *
 * Subtle connection lines. No labels. No glyphs.
 * Connections speak through geometry, not symbols.
 */

interface ResonanceThreadsOverlayProps {
    threads: ResonanceThread[];
    size: number;
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

export const ResonanceThreadsOverlay: React.FC<ResonanceThreadsOverlayProps> = ({ threads, size }) => {
    if (!threads.length) {
        return null;
    }

    // Limit to 3 threads max - less visual noise
    const limitedThreads = threads.slice(0, 3);

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size}>
                {limitedThreads.map(thread => {
                    const x1 = mapCoord(thread.from.x, size);
                    const y1 = mapCoord(thread.from.y, size);
                    const x2 = mapCoord(thread.to.x, size);
                    const y2 = mapCoord(thread.to.y, size);

                    return (
                        <React.Fragment key={thread.id}>
                            {/* Subtle connection line */}
                            <Line
                                x1={x1}
                                y1={y1}
                                x2={x2}
                                y2={y2}
                                stroke={Colors.surfaceHighlight}
                                strokeWidth={0.5}
                                opacity={0.25}
                            />
                            {/* Endpoint dots */}
                            <Circle cx={x1} cy={y1} r={2} fill={Colors.tertiary} opacity={0.3} />
                            <Circle cx={x2} cy={y2} r={2} fill={Colors.tertiary} opacity={0.3} />
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

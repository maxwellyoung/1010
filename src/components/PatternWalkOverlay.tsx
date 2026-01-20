import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../constants/Theme';
import type { PatternWalk } from '../hooks/usePatternWalks';

/**
 * Pattern Walk Overlay - Journey-inspired
 *
 * Subtle path traces. No labels. No text.
 * The paths speak through form, not words.
 */

interface PatternWalkOverlayProps {
    walks: PatternWalk[];
    activeId: string;
    size: number;
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

const pointsToPath = (points: Array<{ x: number; y: number }>, size: number) => {
    if (!points.length) return '';
    return points.reduce((acc, point, index) => {
        const x = mapCoord(point.x, size);
        const y = mapCoord(point.y, size);
        return index === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
};

export const PatternWalkOverlay: React.FC<PatternWalkOverlayProps> = ({ walks, activeId, size }) => {
    // Only show the active walk, and only as a subtle trace
    const activeWalk = walks.find(w => w.id === activeId);

    if (!activeWalk) {
        return null;
    }

    const path = pointsToPath(activeWalk.points, size);
    const startPoint = activeWalk.points[0];

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size}>
                {/* Subtle path trace */}
                <Path
                    d={path}
                    stroke={Colors.surfaceHighlight}
                    strokeWidth={1}
                    fill="none"
                    opacity={0.3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                {/* Start point marker */}
                {startPoint && (
                    <Circle
                        cx={mapCoord(startPoint.x, size)}
                        cy={mapCoord(startPoint.y, size)}
                        r={3}
                        fill={Colors.tertiary}
                        opacity={0.4}
                    />
                )}
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

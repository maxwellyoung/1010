import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText, Circle } from 'react-native-svg';
import { Colors, Typography } from '../constants/Theme';
import type { PatternWalk } from '../hooks/usePatternWalks';

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
    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size}>
                {walks.map(walk => {
                    const isActive = walk.id === activeId;
                    const path = pointsToPath(walk.points, size);
                    const lastPoint = walk.points[walk.points.length - 1];
                    const labelX = mapCoord(lastPoint.x, size) + 6;
                    const labelY = mapCoord(lastPoint.y, size) - 4;
                    return (
                        <React.Fragment key={walk.id}>
                            <Path
                                d={path}
                                stroke={isActive ? Colors.secondary : Colors.surfaceHighlight}
                                strokeWidth={isActive ? 1.2 : 0.6}
                                fill="none"
                                opacity={isActive ? 0.7 : 0.25}
                            />
                            <Circle
                                cx={mapCoord(walk.points[0].x, size)}
                                cy={mapCoord(walk.points[0].y, size)}
                                r={2}
                                fill={Colors.tertiary}
                                opacity={0.6}
                            />
                            {isActive && (
                                <SvgText
                                    x={labelX}
                                    y={labelY}
                                    fill={Colors.tertiary}
                                    fontSize={9}
                                    fontFamily={Typography.mono}
                                    letterSpacing={1}
                                >
                                    {walk.name}
                                </SvgText>
                            )}
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

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Path } from 'react-native-svg';
import { Colors } from '../constants/Theme';

interface MonoMapProps {
    size: number;
}

const gridLines = (size: number, step: number) => {
    const lines = [] as JSX.Element[];
    for (let i = step; i < size; i += step) {
        lines.push(
            <Line key={`v-${i}`} x1={i} y1={0} x2={i} y2={size} stroke={Colors.surfaceHighlight} strokeWidth={0.5} opacity={0.25} />
        );
        lines.push(
            <Line key={`h-${i}`} x1={0} y1={i} x2={size} y2={i} stroke={Colors.surfaceHighlight} strokeWidth={0.5} opacity={0.25} />
        );
    }
    return lines;
};

export const MonoMap: React.FC<MonoMapProps> = ({ size }) => {
    const step = Math.round(size / 6);
    const cbdOutline = `M ${size * 0.2} ${size * 0.2} L ${size * 0.5} ${size * 0.15} L ${size * 0.8} ${size * 0.35} L ${size * 0.7} ${size * 0.75} L ${size * 0.35} ${size * 0.8} L ${size * 0.15} ${size * 0.5} Z`;

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size}>
                <Rect x={0} y={0} width={size} height={size} fill={Colors.background} opacity={0.4} />
                {gridLines(size, step)}
                <Path d={cbdOutline} stroke={Colors.tertiary} strokeWidth={0.8} fill="none" opacity={0.4} />
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

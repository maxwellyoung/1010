import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';
import { TrailPoint } from '../hooks/useTrails';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface TrailVisualizerProps {
    currentTrail: TrailPoint[];
    historicTrails: TrailPoint[][];
    isResonating: boolean;
    size?: number;
}

export const TrailVisualizer: React.FC<TrailVisualizerProps> = React.memo(({
    currentTrail,
    historicTrails,
    isResonating,
    size = 300,
}) => {
    const resonanceOpacity = useSharedValue(0);

    useEffect(() => {
        if (isResonating) {
            resonanceOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 200 }),
                    withTiming(0, { duration: 200 })
                ),
                3,
                true
            );
        }
    }, [isResonating]);

    const resonanceProps = useAnimatedProps(() => ({
        strokeOpacity: resonanceOpacity.value,
    }));

    const pointsToPath = (points: TrailPoint[]) => {
        if (points.length < 2) return '';
        return points.reduce((acc, point, i) => {
            return i === 0 ? `M ${point.x} ${point.y}` : `${acc} L ${point.x} ${point.y}`;
        }, '');
    };

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="0 0 300 300">
                {/* Historic Trails (Faint) */}
                {historicTrails.map((trail, i) => (
                    <Path
                        key={i}
                        d={pointsToPath(trail)}
                        stroke={Colors.tertiary}
                        strokeWidth="1"
                        fill="none"
                        opacity={0.3}
                    />
                ))}

                {/* Current Trail */}
                <Path
                    d={pointsToPath(currentTrail)}
                    stroke={Colors.primary}
                    strokeWidth="2"
                    fill="none"
                />

                {/* Resonance Glow */}
                <AnimatedPath
                    d={pointsToPath(currentTrail)}
                    stroke={Colors.accent}
                    strokeWidth="4"
                    fill="none"
                    animatedProps={resonanceProps}
                />
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
    },
});

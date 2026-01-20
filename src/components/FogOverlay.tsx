import React, { useMemo, useEffect, memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
    Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Theme';

/**
 * Fog Overlay - Journey-inspired
 *
 * Soft, organic mist over unexplored areas.
 * No hard edges. Gradual revelation.
 * The fog breathes slowly, differently in each cell.
 */

interface FogCell {
    x: number;
    y: number;
    normX: number;
    normY: number;
}

interface FogOverlayProps {
    cells: FogCell[];
    gridSize: number;
    size: number;
}

// Individual fog particle with soft breathing
const FogParticle = memo(({ x, y, cellSize, delay }: { x: number; y: number; cellSize: number; delay: number }) => {
    const breath = useSharedValue(0.5 + Math.random() * 0.3);

    useEffect(() => {
        // Very slow, staggered breathing - 10-16 second cycles
        const duration = 10000 + Math.random() * 6000;
        breath.value = withDelay(
            delay,
            withRepeat(
                withSequence(
                    withTiming(0.85, { duration: duration / 2, easing: Easing.inOut(Easing.sin) }),
                    withTiming(0.5, { duration: duration / 2, easing: Easing.inOut(Easing.sin) })
                ),
                -1,
                false
            )
        );
    }, [breath, delay]);

    const animStyle = useAnimatedStyle(() => ({
        opacity: breath.value,
    }));

    // Larger, softer particles with overlap
    const particleSize = cellSize * 1.8;
    const offset = (particleSize - cellSize) / 2;

    return (
        <Animated.View
            style={[
                styles.particle,
                {
                    left: x * cellSize - offset,
                    top: y * cellSize - offset,
                    width: particleSize,
                    height: particleSize,
                    borderRadius: particleSize / 2,
                },
                animStyle,
            ]}
        />
    );
});

export const FogOverlay: React.FC<FogOverlayProps> = memo(({ cells, gridSize, size }) => {
    const cellSize = size / gridSize;

    // Don't render if fully explored
    if (cells.length === 0) {
        return null;
    }

    // Limit particles and add staggered delays
    const particles = useMemo(() => {
        return cells.slice(0, 150).map((cell, index) => ({
            ...cell,
            delay: (index % 10) * 200, // Stagger by groups
        }));
    }, [cells]);

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            {particles.map(cell => (
                <FogParticle
                    key={`${cell.x},${cell.y}`}
                    x={cell.x}
                    y={cell.y}
                    cellSize={cellSize}
                    delay={cell.delay}
                />
            ))}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'hidden',
    },
    particle: {
        position: 'absolute',
        backgroundColor: Colors.background,
    },
});

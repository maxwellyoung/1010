import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Theme';

/**
 * FPS Monitor
 *
 * Development tool for monitoring frame rate.
 * Inspired by Marc Rousavy's native/mobile precision.
 *
 * Only renders in __DEV__ mode.
 */

interface FPSMonitorProps {
    /** Position on screen */
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    /** Update interval in ms */
    updateInterval?: number;
}

export const FPSMonitor: React.FC<FPSMonitorProps> = ({
    position = 'bottom-left',
    updateInterval = 500,
}) => {
    const [fps, setFps] = useState(60);
    const [avgFps, setAvgFps] = useState(60);
    const frameTimesRef = useRef<number[]>([]);
    const lastFrameTimeRef = useRef(performance.now());
    const rafIdRef = useRef<number | null>(null);

    useEffect(() => {
        if (!__DEV__) return;

        const measureFrame = () => {
            const now = performance.now();
            const delta = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;

            if (delta > 0) {
                const currentFps = Math.round(1000 / delta);
                frameTimesRef.current.push(currentFps);

                // Keep last 60 frames for averaging
                if (frameTimesRef.current.length > 60) {
                    frameTimesRef.current.shift();
                }
            }

            rafIdRef.current = requestAnimationFrame(measureFrame);
        };

        rafIdRef.current = requestAnimationFrame(measureFrame);

        const interval = setInterval(() => {
            const frames = frameTimesRef.current;
            if (frames.length > 0) {
                const current = frames[frames.length - 1];
                const avg = Math.round(frames.reduce((a, b) => a + b, 0) / frames.length);
                setFps(current);
                setAvgFps(avg);
            }
        }, updateInterval);

        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
            clearInterval(interval);
        };
    }, [updateInterval]);

    if (!__DEV__) return null;

    const positionStyle = getPositionStyle(position);
    const fpsColor = getFpsColor(avgFps);

    return (
        <View style={[styles.container, positionStyle]} pointerEvents="none">
            <Text style={[styles.fps, { color: fpsColor }]}>{fps}</Text>
            <Text style={styles.label}>FPS</Text>
            <Text style={styles.avg}>avg {avgFps}</Text>
        </View>
    );
};

function getPositionStyle(position: string) {
    switch (position) {
        case 'top-left':
            return { top: 50, left: 10 };
        case 'top-right':
            return { top: 50, right: 10 };
        case 'bottom-left':
            return { bottom: 50, left: 10 };
        case 'bottom-right':
            return { bottom: 50, right: 10 };
        default:
            return { bottom: 50, left: 10 };
    }
}

function getFpsColor(fps: number): string {
    if (fps >= 55) return Colors.accent;
    if (fps >= 45) return Colors.warning;
    return Colors.error;
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: 4,
        alignItems: 'center',
        zIndex: 9999,
    },
    fps: {
        fontSize: Typography.size.lg,
        fontWeight: 'bold',
        fontFamily: Typography.mono,
    },
    label: {
        fontSize: Typography.size.xs,
        color: Colors.tertiary,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
    avg: {
        fontSize: 9,
        color: Colors.secondary,
        fontFamily: Typography.mono,
    },
});

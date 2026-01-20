import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Colors } from '../constants/Theme';

/**
 * Vignette Overlay - Journey-inspired
 *
 * Soft darkening at the edges.
 * Draws the eye to the center.
 * Adds depth without being noticed.
 */

interface VignetteOverlayProps {
    size: number;
    intensity?: number; // 0-1, default 0.4
}

export const VignetteOverlay = memo<VignetteOverlayProps>(({ size, intensity = 0.4 }) => {
    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Svg width={size} height={size}>
                <Defs>
                    <RadialGradient
                        id="vignette"
                        cx="50%"
                        cy="50%"
                        rx="50%"
                        ry="50%"
                    >
                        <Stop offset="0.5" stopColor={Colors.background} stopOpacity={0} />
                        <Stop offset="0.85" stopColor={Colors.background} stopOpacity={intensity * 0.5} />
                        <Stop offset="1" stopColor={Colors.background} stopOpacity={intensity} />
                    </RadialGradient>
                </Defs>
                <Rect
                    x={0}
                    y={0}
                    width={size}
                    height={size}
                    fill="url(#vignette)"
                />
            </Svg>
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
});

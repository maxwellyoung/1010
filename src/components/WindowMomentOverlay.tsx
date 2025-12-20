import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { Colors, Typography } from '../constants/Theme';
import Svg, { Text as SvgText } from 'react-native-svg';

interface WindowMomentOverlayProps {
    isOpen: boolean;
    position: { x: number; y: number } | null;
    size: number;
}

const mapCoord = (value: number, size: number) => (value + 1) * 0.5 * size;

export const WindowMomentOverlay: React.FC<WindowMomentOverlayProps> = ({ isOpen, position, size }) => {
    const pulse = useSharedValue(0);

    useEffect(() => {
        if (!isOpen) {
            pulse.value = 0;
            return;
        }
        pulse.value = withRepeat(
            withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
            -1,
            true
        );
    }, [isOpen, pulse]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: 0.3 + pulse.value * 0.4,
        transform: [{ scale: 0.9 + pulse.value * 0.15 }],
    }));

    if (!isOpen || !position) {
        return null;
    }

    const x = mapCoord(position.x, size) - 28;
    const y = mapCoord(position.y, size) - 28;
    const glyphs = ['<>', '[]', '--'];

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <Animated.View style={[styles.portal, animatedStyle, { left: x, top: y }]} />
            <Animated.View style={[styles.portalInner, animatedStyle, { left: x + 6, top: y + 6 }]} />
            <View style={[styles.glyphLayer, { left: x, top: y }]}>
                <Svg width={56} height={56}>
                    {glyphs.map((glyph, index) => (
                        <SvgText
                            key={glyph}
                            x={28}
                            y={16 + index * 14}
                            fill={Colors.tertiary}
                            fontSize={8}
                            fontFamily={Typography.mono}
                            textAnchor="middle"
                            opacity={0.6}
                        >
                            {glyph}
                        </SvgText>
                    ))}
                </Svg>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
    },
    portal: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    portalInner: {
        position: 'absolute',
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: Colors.tertiary,
    },
    glyphLayer: {
        position: 'absolute',
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

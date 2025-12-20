import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Colors } from '../constants/Theme';

interface DriftMarkerProps {
    size: number;
    strength?: number;
}

export const DriftMarker: React.FC<DriftMarkerProps> = ({ size, strength = 0.6 }) => {
    const orbit = useRef(new Animated.Value(0)).current;
    const pulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const orbitLoop = Animated.loop(
            Animated.timing(orbit, {
                toValue: 1,
                duration: 12000,
                useNativeDriver: true,
            })
        );
        const pulseLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 1400, useNativeDriver: true }),
            ])
        );
        orbitLoop.start();
        pulseLoop.start();
        return () => {
            orbitLoop.stop();
            pulseLoop.stop();
        };
    }, [orbit, pulse]);

    const radius = Math.max(6, Math.round(size * 0.06));
    const orbitRadius = Math.max(8, Math.round(size * 0.08));

    const translateX = orbit.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [0, orbitRadius, 0, -orbitRadius, 0],
    });
    const translateY = orbit.interpolate({
        inputRange: [0, 0.25, 0.5, 0.75, 1],
        outputRange: [-orbitRadius, 0, orbitRadius, 0, -orbitRadius],
    });

    const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.6] });
    const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.8] });

    return (
        <View style={[styles.container, { width: size, height: size }]} pointerEvents="none">
            <View style={[styles.centerDot, { width: radius, height: radius, borderRadius: radius / 2, opacity: strength }]} />
            <Animated.View
                style={[
                    styles.ring,
                    {
                        width: radius * 2.2,
                        height: radius * 2.2,
                        borderRadius: radius * 1.1,
                        opacity: ringOpacity,
                        transform: [{ scale: ringScale }],
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.orbitalDot,
                    {
                        transform: [{ translateX }, { translateY }],
                        opacity: 0.5 * strength,
                    },
                ]}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerDot: {
        backgroundColor: Colors.accent,
        shadowColor: Colors.accent,
        shadowOpacity: 0.7,
        shadowRadius: 8,
    },
    ring: {
        position: 'absolute',
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    orbitalDot: {
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.secondary,
    },
});

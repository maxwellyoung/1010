import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Constants from 'expo-constants';
import { Colors } from '../constants/Theme';

// Detect if we're running in Expo Go (no native modules available)
const isExpoGo = Constants.appOwnership === 'expo';

// Only require MapLibre in development builds, not Expo Go
let MapLibreGL: typeof import('@maplibre/maplibre-react-native').default | null = null;
if (!isExpoGo) {
    try {
        const lib = require('@maplibre/maplibre-react-native').default;
        lib.setAccessToken('');
        MapLibreGL = lib;
    } catch {
        MapLibreGL = null;
    }
}

interface MapBackdropProps {
    size: number;
    opacity?: number | SharedValue<number>;
    veilOpacity?: number;
    radius?: number;
}

const AUCKLAND_CBD: [number, number] = [174.7633, -36.8485];

// Load style synchronously - the module bundler handles this
const mapStyleUri = require('../../assets/map/mono-style.json');

export const MapBackdrop: React.FC<MapBackdropProps> = ({ size, opacity = 1, veilOpacity = 0.85, radius = 0 }) => {
    // Handle both number and SharedValue
    const isSharedValue = typeof opacity === 'object' && opacity !== null && 'value' in opacity;

    const animatedStyle = useAnimatedStyle(() => {
        if (isSharedValue) {
            return { opacity: (opacity as SharedValue<number>).value };
        }
        return { opacity: opacity as number };
    });

    // Fallback when MapLibre isn't available (Expo Go) - invisible, just a positioning container
    if (!MapLibreGL) {
        return (
            <View style={[styles.container, { width: size, height: size }]} pointerEvents="none" />
        );
    }

    return (
        <Animated.View style={[styles.container, { width: size, height: size, borderRadius: radius }, animatedStyle]} pointerEvents="none">
            <MapLibreGL.MapView
                style={StyleSheet.absoluteFill}
                mapStyle={mapStyleUri}
                logoEnabled={false}
                attributionEnabled={false}
                compassEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
                rotateEnabled={false}
                pitchEnabled={false}
            >
                <MapLibreGL.Camera
                    centerCoordinate={AUCKLAND_CBD}
                    zoomLevel={13.2}
                    minZoomLevel={11}
                    maxZoomLevel={16}
                    animationMode="flyTo"
                />
            </MapLibreGL.MapView>
            <View style={[styles.veil, { opacity: veilOpacity }]} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: 0,
        top: 0,
        overflow: 'hidden',
    },
    veil: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: Colors.background,
    },
});

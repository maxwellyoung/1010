import React from 'react';
import { Animated, StyleSheet } from 'react-native';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { Asset } from 'expo-asset';
import { Colors } from '../constants/Theme';

MapLibreGL.setAccessToken('');

interface MapBackdropProps {
    size: number;
    opacity?: number;
    veilOpacity?: number;
    radius?: number;
}

const AUCKLAND_CBD: [number, number] = [174.7633, -36.8485];

export const MapBackdrop: React.FC<MapBackdropProps> = ({ size, opacity = 1, veilOpacity = 0.7, radius = 20 }) => {
    const styleUri = Asset.fromModule(require('../../assets/map/mono-style.json')).uri;

    return (
        <Animated.View style={[styles.container, { width: size, height: size, opacity, borderRadius: radius }]} pointerEvents="none">
            <MapLibreGL.MapView
                style={StyleSheet.absoluteFill}
                styleURL={styleUri}
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
                    animationMode="none"
                />
            </MapLibreGL.MapView>
            <Animated.View style={[styles.veil, { opacity: veilOpacity }]} />
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

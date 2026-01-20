import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    SharedValue,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';
import { Colors, Spacing } from '../../constants/Theme';
import { Motion } from '../../constants/Motion';
import { SignalMap } from '../SignalMap';
import { TrailVisualizer } from '../TrailVisualizer';
import { MapBackdrop } from '../MapBackdrop';
import { DriftMarker } from '../DriftMarker';
import { AmbientOverlay } from '../AmbientOverlay';
import { TrailAmbientOverlay } from '../TrailAmbientOverlay';
import { ResonanceThreadsOverlay } from '../ResonanceThreadsOverlay';
import { WindowMomentOverlay } from '../WindowMomentOverlay';
import { PatternWalkOverlay } from '../PatternWalkOverlay';
import { FogOverlay } from '../FogOverlay';
import { CompanionOverlay } from '../CompanionOverlay';
import { VignetteOverlay } from '../VignetteOverlay';
import type { HeatPoint } from '../../hooks/usePings';
import type { TrailPoint } from '../../hooks/useTrails';
import type { PassingEcho } from '../../hooks/usePassingEchoes';
import type { GhostPing } from '../../hooks/useGhostPings';
import type { SignalGlyph } from '../../hooks/useSignalGlyphs';
import type { ResonanceThread } from '../../hooks/useResonanceThreads';
import type { PatternWalk } from '../../hooks/usePatternWalks';
import type { Companion } from '../../hooks/useCompanions';

type ViewMode = 'signal' | 'trails';

interface WindowMomentState {
    isOpen: boolean;
    position?: { x: number; y: number } | null;
}

interface SignalVisualizationProps {
    viewMode: ViewMode;
    onToggleView: () => void;
    onLongPress: () => void;
    isInsideNetwork: boolean;
    mapOpacity: SharedValue<number>;

    // Signal mode data
    heatMap: HeatPoint[];

    // Trail mode data
    currentTrail: TrailPoint[];
    historicTrails: TrailPoint[][];
    isResonating: boolean;

    // Ambient effects
    passingEchoes: PassingEcho[];
    ghostPings: GhostPing[];
    glyphs: SignalGlyph[];
    threads: ResonanceThread[];

    // Feature toggles
    showThreads: boolean;
    showGhostPings: boolean;
    showGlyphs: boolean;
    showWindows: boolean;
    showPatternWalks: boolean;

    // Window moment
    windowMoment: WindowMomentState;

    // Pattern walks
    walks: PatternWalk[];
    activeWalkId: string;

    // Exploration fog
    fogCells: Array<{ x: number; y: number; normX: number; normY: number }>;
    gridSize: number;
    showFog: boolean;

    // Companions (Journey-style)
    companions: Companion[];
    showCompanions: boolean;
}

const SMALL_SIZE = 280;
const LARGE_SIZE = 340;

export const SignalVisualization: React.FC<SignalVisualizationProps> = React.memo(({
    viewMode,
    onToggleView,
    onLongPress,
    isInsideNetwork,
    mapOpacity,
    heatMap,
    currentTrail,
    historicTrails,
    isResonating,
    passingEchoes,
    ghostPings,
    glyphs,
    threads,
    showThreads,
    showGhostPings,
    showGlyphs,
    showWindows,
    showPatternWalks,
    windowMoment,
    walks,
    activeWalkId,
    fogCells,
    gridSize,
    showFog,
    companions,
    showCompanions,
}) => {
    // Crossfade animation between views
    const crossfade = useSharedValue(viewMode === 'signal' ? 0 : 1);

    // Update crossfade when viewMode changes
    React.useEffect(() => {
        crossfade.value = withTiming(viewMode === 'signal' ? 0 : 1, {
            duration: Motion.duration.transition,
            easing: Motion.easing.ambient,
        });
    }, [viewMode, crossfade]);

    const signalOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(crossfade.value, [0, 1], [1, 0], Extrapolation.CLAMP),
    }));

    const trailOpacity = useAnimatedStyle(() => ({
        opacity: interpolate(crossfade.value, [0, 1], [0, 1], Extrapolation.CLAMP),
    }));

    const strength = isInsideNetwork ? 0.8 : 0.4;
    const size = viewMode === 'signal' ? SMALL_SIZE : LARGE_SIZE;

    const containerStyle = useMemo(() => ({
        height: LARGE_SIZE,
        width: LARGE_SIZE,
    }), []);

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onToggleView}
            onLongPress={onLongPress}
            activeOpacity={0.8}
        >
            <View style={containerStyle}>
                {/* Signal Field Layer */}
                <Animated.View style={[styles.layer, signalOpacity]}>
                    <View style={[styles.stack, { width: SMALL_SIZE, height: SMALL_SIZE }]}>
                        <MapBackdrop size={SMALL_SIZE} opacity={mapOpacity} />
                        <SignalMap heatMap={heatMap} size={SMALL_SIZE} />
                        {showFog && (
                            <FogOverlay cells={fogCells} gridSize={gridSize} size={SMALL_SIZE} />
                        )}
                        <DriftMarker size={SMALL_SIZE} strength={strength} />
                        {showCompanions && (
                            <CompanionOverlay companions={companions} size={SMALL_SIZE} />
                        )}
                        {showThreads && (
                            <ResonanceThreadsOverlay threads={threads} size={SMALL_SIZE} />
                        )}
                        <AmbientOverlay
                            passingEchoes={passingEchoes}
                            ghostPings={showGhostPings ? ghostPings : []}
                            glyphs={showGlyphs ? glyphs : []}
                        />
                        {showWindows && (
                            <WindowMomentOverlay
                                isOpen={windowMoment.isOpen}
                                position={windowMoment.position ?? null}
                                size={SMALL_SIZE}
                            />
                        )}
                        <VignetteOverlay size={SMALL_SIZE} intensity={0.5} />
                    </View>
                </Animated.View>

                {/* Trail Resonance Layer */}
                <Animated.View style={[styles.layer, trailOpacity]}>
                    <View style={[styles.stack, { width: LARGE_SIZE, height: LARGE_SIZE }]}>
                        <MapBackdrop size={LARGE_SIZE} opacity={mapOpacity} />
                        <TrailVisualizer
                            currentTrail={currentTrail}
                            historicTrails={historicTrails}
                            isResonating={isResonating}
                            size={LARGE_SIZE}
                        />
                        {showFog && (
                            <FogOverlay cells={fogCells} gridSize={gridSize} size={LARGE_SIZE} />
                        )}
                        <DriftMarker size={LARGE_SIZE} strength={strength} />
                        {showCompanions && (
                            <CompanionOverlay companions={companions} size={LARGE_SIZE} />
                        )}
                        {showPatternWalks && (
                            <PatternWalkOverlay walks={walks} activeId={activeWalkId} size={LARGE_SIZE} />
                        )}
                        {showThreads && (
                            <ResonanceThreadsOverlay threads={threads} size={LARGE_SIZE} />
                        )}
                        <TrailAmbientOverlay
                            passingEchoes={passingEchoes}
                            ghostPings={showGhostPings ? ghostPings : []}
                            glyphs={showGlyphs ? glyphs : []}
                        />
                        <VignetteOverlay size={LARGE_SIZE} intensity={0.5} />
                    </View>
                </Animated.View>
            </View>

        </TouchableOpacity>
    );
});

const styles = StyleSheet.create({
    container: {
        height: LARGE_SIZE + Spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    layer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    stack: {
        position: 'relative',
    },
});

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Constants
import { Colors, Typography, Spacing, Layout } from '../src/constants/Theme';
import { Motion } from '../src/constants/Motion';
import { Copy } from '../src/constants/Copy';

// Network sub-components
import {
    NetworkHeader,
    NetworkFooter,
    RitualOverlay,
    SignalVisualization,
    CityBreathHalo,
} from '../src/components/network';

// Existing components
import { FocusOverlay } from '../src/components/FocusOverlay';
import { EchoOverlay } from '../src/components/EchoOverlay';
import { DevMenu } from '../src/components/DevMenu';
import { SignalMap } from '../src/components/SignalMap';
import { TrailVisualizer } from '../src/components/TrailVisualizer';
import { MapBackdrop } from '../src/components/MapBackdrop';
import { DriftMarker } from '../src/components/DriftMarker';
import { AmbientOverlay } from '../src/components/AmbientOverlay';
import { TrailAmbientOverlay } from '../src/components/TrailAmbientOverlay';
import { ResonanceThreadsOverlay } from '../src/components/ResonanceThreadsOverlay';
import { WindowMomentOverlay } from '../src/components/WindowMomentOverlay';
import { PatternWalkOverlay } from '../src/components/PatternWalkOverlay';
import { FogOverlay } from '../src/components/FogOverlay';
import { CompanionOverlay } from '../src/components/CompanionOverlay';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { FamiliarSignalOverlay } from '../src/components/FamiliarSignalOverlay';
import { TemporalSlider } from '../src/components/TemporalSlider';
import { FirstLaunchTutorial } from '../src/components/FirstLaunchTutorial';

// Hooks
import { useNetworkStats } from '../src/hooks/useNetworkStats';
import { useProfile } from '../src/hooks/useProfile';
import { usePings } from '../src/hooks/usePings';
import { useTrails } from '../src/hooks/useTrails';
import { useEchoes } from '../src/hooks/useEchoes';
import { useLocation } from '../src/context/LocationContext';
import { usePassingEchoes } from '../src/hooks/usePassingEchoes';
import { useGhostPings } from '../src/hooks/useGhostPings';
import { useSignalGlyphs } from '../src/hooks/useSignalGlyphs';
import { useProximitySession } from '../src/hooks/useProximitySession';
import { useCityBreath } from '../src/hooks/useCityBreath';
import { useQuietRitual } from '../src/hooks/useQuietRitual';
import { useResonanceThreads } from '../src/hooks/useResonanceThreads';
import { useWindowMoments } from '../src/hooks/useWindowMoments';
import { usePatternWalks } from '../src/hooks/usePatternWalks';
import { usePatternWalkSelection } from '../src/hooks/usePatternWalkSelection';
import { useSupabaseSignals } from '../src/hooks/useSupabaseSignals';
import { useSupabaseDensity } from '../src/hooks/useSupabaseDensity';
import { useDemoMode } from '../src/hooks/useDemoMode';
import { useShare } from '../src/hooks/useShare';
import { useTemporalLayers } from '../src/hooks/useTemporalLayers';
import { useResonanceMemory } from '../src/hooks/useResonanceMemory';
import { useFirstLaunch } from '../src/hooks/useFirstLaunch';
import { useExploration } from '../src/hooks/useExploration';
import { useCompanions } from '../src/hooks/useCompanions';

// Native
import { Proximity } from '../src/native/Proximity';

type ViewMode = 'signal' | 'trails';

export default function NetworkScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Core data hooks
    const { stats, loading: statsLoading } = useNetworkStats();
    const { profile } = useProfile();
    const { heatMap } = usePings();
    const { currentTrail, historicTrails, isResonating, clearCurrentTrail } = useTrails();
    const { activeEcho, triggerEcho } = useEchoes();
    const { isInsideNetwork, location, setOverride } = useLocation();
    const { lastEncounter, nearby, resonance, peerStates } = useProximitySession(profile?.id);
    const { densityScore } = useSupabaseDensity(location?.coords);
    const { selectedId: selectedWalkId } = usePatternWalkSelection();
    const { sharePresence } = useShare();
    const {
        ghostPings: realtimeGhostPings,
        windowMoment: realtimeWindowMoment,
        sendGhostPing,
        sendWindowMoment,
        isConfigured: realtimeEnabled,
        presenceCount,
    } = useSupabaseSignals();

    // Temporal layers (time travel through network history)
    const temporalLayers = useTemporalLayers();

    // Resonance memory (familiar signal detection)
    const resonanceMemory = useResonanceMemory();

    // First launch tutorial
    const { isFirstLaunch, isLoading: tutorialLoading, markRevealSeen, resetFirstLaunch } = useFirstLaunch();

    // Exploration (fog of war)
    const exploration = useExploration();

    // Journey-style companions
    const { companions } = useCompanions(peerStates, nearby);

    // Computed values
    const effectiveDensity = densityScore > 0 ? densityScore : stats.pingDensity;
    const peerCount = Object.values(peerStates).filter(state => state === 2).length;

    // Animation hooks
    const cityBreath = useCityBreath(effectiveDensity);
    const { ritual, triggerRitual } = useQuietRitual(nearby, resonance);

    // Demo mode (consolidated)
    const demoConfig = useMemo(() => ({
        onTriggerEcho: triggerEcho,
        onTriggerRitual: triggerRitual,
        onTriggerWindow: () => {}, // Will be set after useWindowMoments
    }), [triggerEcho, triggerRitual]);

    const { state: demoState, actions: demoActions } = useDemoMode(demoConfig);

    // Local state
    const [daysRemaining, setDaysRemaining] = useState(60);
    const [viewMode, setViewMode] = useState<ViewMode>('signal');
    const [focusOpen, setFocusOpen] = useState(false);
    const [familiarSignal, setFamiliarSignal] = useState<{
        visible: boolean;
        peerId: string | null;
    }>({ visible: false, peerId: null });

    // Animated values (Reanimated)
    const mapFade = useSharedValue(1);
    const windowPulse = useSharedValue(0);
    const ritualHapticTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
    const lastWindowBroadcast = useRef<number | null>(null);
    const lastGhostBroadcast = useRef<string | null>(null);

    // Derived show flags
    const showGhostPings = demoState.ghostPings || isInsideNetwork;
    const showGlyphs = demoState.glyphs || isInsideNetwork;
    const showThreads = demoState.threads || isInsideNetwork;
    const showWindows = demoState.windows || isInsideNetwork;
    const showPatternWalks = demoState.patternWalks || isInsideNetwork;
    const showFog = isInsideNetwork && exploration.isLoaded;
    const showCompanions = isInsideNetwork;

    // Effect hooks for ambient data
    const passingEchoes = usePassingEchoes(lastEncounter, demoState.passingEchoes);
    const ghostPings = useGhostPings(showGhostPings);
    const glyphs = useSignalGlyphs(showGlyphs, isInsideNetwork);
    const threads = useResonanceThreads(lastEncounter, demoState.threads);
    const { windowMoment, triggerWindow } = useWindowMoments(peerCount, presenceCount, demoState.windows);
    const { walks, active: activeWalk } = usePatternWalks(demoState.patternWalks, selectedWalkId);

    // Combined ghost pings
    const combinedGhostPings = useMemo(() => {
        const merged = [...realtimeGhostPings, ...ghostPings];
        return merged.slice(0, 8);
    }, [realtimeGhostPings, ghostPings]);

    // Active window moment
    const activeWindowMoment = windowMoment.isOpen ? windowMoment : realtimeWindowMoment;
    const windowIsOpen = demoState.windowAlertOpen || activeWindowMoment.isOpen;
    const windowMinutes = activeWindowMoment.endsAt
        ? Math.max(1, Math.ceil((activeWindowMoment.endsAt - Date.now()) / (1000 * 60)))
        : 7;

    // Window pulse animation
    useEffect(() => {
        if (!windowIsOpen) {
            windowPulse.value = withTiming(0, { duration: Motion.duration.interaction });
            return;
        }
        windowPulse.value = withRepeat(
            withSequence(
                withTiming(1, { duration: 1200, easing: Motion.easing.ambient }),
                withTiming(0, { duration: 1200, easing: Motion.easing.ambient })
            ),
            -1,
            true
        );
    }, [windowIsOpen, windowPulse]);

    // Ritual haptic feedback
    useEffect(() => {
        if (!ritual.arming) {
            ritualHapticTimeouts.current.forEach(clearTimeout);
            ritualHapticTimeouts.current = [];
            return;
        }
        ritualHapticTimeouts.current = [
            setTimeout(() => Proximity.triggerHaptic('light'), 0),
            setTimeout(() => Proximity.triggerHaptic('medium'), 240),
            setTimeout(() => Proximity.triggerHaptic('heavy'), 520),
        ];
        return () => {
            ritualHapticTimeouts.current.forEach(clearTimeout);
            ritualHapticTimeouts.current = [];
        };
    }, [ritual.arming]);

    // Calculate days remaining
    useEffect(() => {
        if (profile?.activationDate) {
            const now = new Date();
            const activation = new Date(profile.activationDate);
            const diffTime = Math.abs(activation.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
        }
    }, [profile]);

    // Broadcast window moments
    useEffect(() => {
        if (!realtimeEnabled || !windowMoment.isOpen || !windowMoment.startedAt || !windowMoment.endsAt || !windowMoment.position) {
            return;
        }
        if (lastWindowBroadcast.current === windowMoment.startedAt) {
            return;
        }
        lastWindowBroadcast.current = windowMoment.startedAt;
        sendWindowMoment({
            isOpen: true,
            startedAt: windowMoment.startedAt,
            endsAt: windowMoment.endsAt,
            position: windowMoment.position,
        });
    }, [realtimeEnabled, sendWindowMoment, windowMoment]);

    // Broadcast ghost pings
    useEffect(() => {
        if (!realtimeEnabled || !showGhostPings) {
            return;
        }
        const latest = ghostPings[0];
        if (!latest || lastGhostBroadcast.current === latest.id) {
            return;
        }
        lastGhostBroadcast.current = latest.id;
        sendGhostPing(latest);
    }, [ghostPings, realtimeEnabled, sendGhostPing, showGhostPings]);

    // Check for familiar signals on encounter
    useEffect(() => {
        if (!lastEncounter?.id) return;

        const memory = resonanceMemory.getMemory(lastEncounter.id);
        if (memory && memory.memoryLevel >= 1) {
            // This is a familiar signal
            setFamiliarSignal({ visible: true, peerId: lastEncounter.id });
        }

        // Record the encounter in memory (ritual is active if it triggered)
        resonanceMemory.recordEncounter(lastEncounter.id, ritual.active);
    }, [lastEncounter?.id, resonanceMemory, ritual.active]);

    // Hide familiar signal overlay after display
    const handleFamiliarSignalComplete = useCallback(() => {
        setFamiliarSignal({ visible: false, peerId: null });
    }, []);

    // Presentation mode map fade
    useEffect(() => {
        if (!demoState.presentationMode) {
            mapFade.value = withTiming(1, { duration: Motion.duration.transition });
            return;
        }
        mapFade.value = withRepeat(
            withSequence(
                withTiming(0.4, { duration: 2800 }),
                withTiming(0.85, { duration: 2800 })
            ),
            -1,
            true
        );
    }, [demoState.presentationMode, mapFade]);

    // Callbacks (memoized)
    const toggleView = useCallback(() => {
        setViewMode(prev => prev === 'signal' ? 'trails' : 'signal');
    }, []);

    const openFocus = useCallback(() => {
        setFocusOpen(true);
    }, []);

    const closeFocus = useCallback(() => {
        setFocusOpen(false);
    }, []);

    const toggleWindowAlert = useCallback(() => {
        demoActions.toggleWindowAlert();
    }, [demoActions]);

    const handleResetOnboarding = useCallback(async () => {
        Alert.alert('Reset Onboarding', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Reset',
                style: 'destructive',
                onPress: async () => {
                    await AsyncStorage.clear();
                    router.replace('/');
                }
            }
        ]);
    }, [router]);

    const handleClearTrails = useCallback(() => {
        clearCurrentTrail();
    }, [clearCurrentTrail]);

    const handleOpenWalks = useCallback(() => {
        router.push('/walks');
    }, [router]);

    const handleToggleLocation = useCallback(() => {
        setOverride(isInsideNetwork ? false : true);
    }, [isInsideNetwork, setOverride]);

    const buildGhostPing = useCallback(() => {
        const now = Date.now();
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.2 + Math.random() * 0.7;
        return {
            id: `ghost-${now}`,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            ageMinutes: 5 + Math.floor(Math.random() * 11),
        };
    }, []);

    const handleTriggerGhostPing = useCallback(() => {
        sendGhostPing(buildGhostPing());
    }, [sendGhostPing, buildGhostPing]);

    const handleShare = useCallback(() => {
        sharePresence({
            stats,
            profile,
            encounterCount: lastEncounter ? 1 : 0, // Could be tracked properly in a real implementation
            isInsideNetwork,
        });
    }, [sharePresence, stats, profile, lastEncounter, isInsideNetwork]);

    // Focus overlay dimensions
    const focusSize = useMemo(() => {
        const { width, height } = Dimensions.get('window');
        return Math.min(width, height) - Spacing.xxl;
    }, []);

    const focusTitle = viewMode === 'signal' ? Copy.viewMode.signal : Copy.viewMode.trails;

    return (
        <ErrorBoundary>
            <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
                {/* First launch tutorial - the network reveals itself */}
                <FirstLaunchTutorial
                    visible={isFirstLaunch && !tutorialLoading}
                    onComplete={markRevealSeen}
                />

                <CityBreathHalo intensity={cityBreath.intensity} periodMs={cityBreath.periodMs} />

                {!demoState.presentationMode && (
                    <DevMenu
                        onToggleWindow={toggleWindowAlert}
                        onTriggerEcho={triggerEcho}
                        onTriggerRitual={triggerRitual}
                        onTriggerWindowMoment={triggerWindow}
                        onTriggerGhostPing={handleTriggerGhostPing}
                        onResetOnboarding={handleResetOnboarding}
                        onClearTrails={handleClearTrails}
                        onToggleLocation={handleToggleLocation}
                        onReplayTutorial={resetFirstLaunch}
                        demoPassingEchoes={demoState.passingEchoes}
                        demoGhostPings={demoState.ghostPings}
                        demoGlyphs={demoState.glyphs}
                        demoThreads={demoState.threads}
                        demoWindows={demoState.windows}
                        demoPatternWalks={demoState.patternWalks}
                        demoSequenceActive={demoState.sequenceActive}
                        presentationMode={demoState.presentationMode}
                        onOpenWalks={handleOpenWalks}
                        onTogglePassingEchoes={() => demoActions.toggleFeature('passingEchoes')}
                        onToggleGhostPings={() => demoActions.toggleFeature('ghostPings')}
                        onToggleGlyphs={() => demoActions.toggleFeature('glyphs')}
                        onToggleThreads={() => demoActions.toggleFeature('threads')}
                        onToggleWindows={() => demoActions.toggleFeature('windows')}
                        onTogglePatternWalks={() => demoActions.toggleFeature('patternWalks')}
                        onRunDemoSequence={demoActions.startSequence}
                        onTogglePresentationMode={demoActions.togglePresentation}
                        location={location}
                        isInsideNetwork={isInsideNetwork}
                    />
                )}

                <EchoOverlay echo={activeEcho} />
                <RitualOverlay ritual={ritual} />

                {/* Familiar signal overlay - shown when encountering a known signal */}
                {familiarSignal.peerId && (
                    <FamiliarSignalOverlay
                        visible={familiarSignal.visible}
                        level={resonanceMemory.getMemory(familiarSignal.peerId)?.memoryLevel ?? 0}
                        phrase={resonanceMemory.getPhrase(familiarSignal.peerId)}
                        encounterCount={resonanceMemory.getMemory(familiarSignal.peerId)?.encounterCount ?? 0}
                        onComplete={handleFamiliarSignalComplete}
                    />
                )}

                <FocusOverlay
                    visible={focusOpen}
                    title={focusTitle}
                    subtitle={viewMode === 'signal' ? 'Signal field, expanded' : 'Trail field, expanded'}
                    onClose={closeFocus}
                >
                    <View style={styles.focusStage}>
                        {viewMode === 'signal' ? (
                            <View style={[styles.focusStack, { width: focusSize, height: focusSize }]}>
                                <MapBackdrop size={focusSize} opacity={mapFade} radius={24} />
                                <SignalMap heatMap={heatMap} size={focusSize} />
                                {showFog && <FogOverlay cells={exploration.fogCells} gridSize={exploration.gridSize} size={focusSize} />}
                                <DriftMarker size={focusSize} strength={isInsideNetwork ? 0.8 : 0.4} />
                                {showCompanions && <CompanionOverlay companions={companions} size={focusSize} />}
                                {showThreads && <ResonanceThreadsOverlay threads={threads} size={focusSize} />}
                                <AmbientOverlay
                                    passingEchoes={passingEchoes}
                                    ghostPings={showGhostPings ? combinedGhostPings : []}
                                    glyphs={showGlyphs ? glyphs : []}
                                />
                                {showWindows && (
                                    <WindowMomentOverlay
                                        isOpen={activeWindowMoment.isOpen}
                                        position={activeWindowMoment.position}
                                        size={focusSize}
                                        startedAt={activeWindowMoment.startedAt}
                                        endsAt={activeWindowMoment.endsAt}
                                        participantCount={peerCount + 1}
                                    />
                                )}
                            </View>
                        ) : (
                            <View style={[styles.focusStack, { width: focusSize, height: focusSize }]}>
                                <MapBackdrop size={focusSize} opacity={mapFade} radius={24} />
                                <TrailVisualizer
                                    currentTrail={currentTrail}
                                    historicTrails={historicTrails}
                                    isResonating={isResonating}
                                    size={focusSize}
                                />
                                {showFog && <FogOverlay cells={exploration.fogCells} gridSize={exploration.gridSize} size={focusSize} />}
                                <DriftMarker size={focusSize} strength={isInsideNetwork ? 0.8 : 0.4} />
                                {showCompanions && <CompanionOverlay companions={companions} size={focusSize} />}
                                {showPatternWalks && <PatternWalkOverlay walks={walks} activeId={activeWalk.id} size={focusSize} />}
                                {showThreads && <ResonanceThreadsOverlay threads={threads} size={focusSize} />}
                                <TrailAmbientOverlay
                                    passingEchoes={passingEchoes}
                                    ghostPings={showGhostPings ? combinedGhostPings : []}
                                    glyphs={showGlyphs ? glyphs : []}
                                />
                            </View>
                        )}
                    </View>
                </FocusOverlay>

                <ScrollView
                    contentContainerStyle={[
                        styles.content,
                        { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.xxl },
                    ]}
                    showsVerticalScrollIndicator={false}
                >
                    <NetworkHeader
                        isInsideNetwork={isInsideNetwork}
                        isActivated={profile?.isActivated ?? false}
                        daysRemaining={daysRemaining}
                        breathLabel={cityBreath.label}
                        presenceCount={presenceCount}
                        densityScore={effectiveDensity}
                        realtimeEnabled={realtimeEnabled}
                        windowIsOpen={windowIsOpen}
                        windowMinutes={windowMinutes}
                        windowPulse={windowPulse}
                        onLongPress={toggleWindowAlert}
                    />

                    <SignalVisualization
                        viewMode={viewMode}
                        onToggleView={toggleView}
                        onLongPress={openFocus}
                        isInsideNetwork={isInsideNetwork}
                        mapOpacity={mapFade}
                        heatMap={heatMap}
                        currentTrail={currentTrail}
                        historicTrails={historicTrails}
                        isResonating={isResonating}
                        passingEchoes={passingEchoes}
                        ghostPings={combinedGhostPings}
                        glyphs={glyphs}
                        threads={threads}
                        showThreads={showThreads}
                        showGhostPings={showGhostPings}
                        showGlyphs={showGlyphs}
                        showWindows={showWindows}
                        showPatternWalks={showPatternWalks}
                        windowMoment={activeWindowMoment}
                        walks={walks}
                        activeWalkId={activeWalk.id}
                        fogCells={exploration.fogCells}
                        gridSize={exploration.gridSize}
                        showFog={showFog}
                        companions={companions}
                        showCompanions={showCompanions}
                    />

                    {/* Temporal slider - time travel through network history */}
                    <TemporalSlider
                        mode={temporalLayers.mode}
                        isLive={temporalLayers.isLive}
                        isLoading={temporalLayers.isLoading}
                        snapshot={temporalLayers.snapshot}
                        scrubPosition={temporalLayers.scrubPosition}
                        onCycleMode={temporalLayers.cycleMode}
                        onScrub={temporalLayers.scrub}
                        getModeLabel={temporalLayers.getModeLabel}
                    />

                    <NetworkFooter
                        participantCount={stats.totalParticipants}
                        isLoading={statsLoading}
                        densityScore={effectiveDensity}
                        isInsideNetwork={isInsideNetwork}
                        onShare={handleShare}
                    />
                </ScrollView>

                {demoState.presentationMode && (
                    <TouchableOpacity
                        style={[styles.presentationExit, { bottom: insets.bottom + Spacing.lg }]}
                        onPress={demoActions.togglePresentation}
                        accessibilityLabel="Exit demo mode"
                        accessibilityRole="button"
                        accessibilityHint="Exits the presentation demo mode"
                    >
                        <Text style={styles.presentationExitText}>EXIT DEMO</Text>
                    </TouchableOpacity>
                )}
            </SafeAreaView>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
    },
    focusStage: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    focusStack: {
        position: 'relative',
    },
    presentationExit: {
        position: 'absolute',
        right: Spacing.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: Layout.radius.md,
        borderWidth: 1,
        borderColor: Colors.quaternary,
        backgroundColor: Colors.overlay,
    },
    presentationExitText: {
        color: Colors.secondary,
        fontSize: Typography.size.sm,
        letterSpacing: Typography.letterSpacing.wide,
        fontFamily: Typography.sansMedium,
    },
});

import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing, ScrollView, Dimensions } from 'react-native';
import { Colors, Typography, Spacing } from '../src/constants/Theme';
import { ProximityBars } from '../src/components/ProximityBars';
import { useNetworkStats } from '../src/hooks/useNetworkStats';
import { useProfile } from '../src/hooks/useProfile';
import { usePings } from '../src/hooks/usePings';
import { useTrails } from '../src/hooks/useTrails';
import { useEchoes } from '../src/hooks/useEchoes';
import { SignalMap } from '../src/components/SignalMap';
import { TrailVisualizer } from '../src/components/TrailVisualizer';
import { FocusOverlay } from '../src/components/FocusOverlay';
import { EchoOverlay } from '../src/components/EchoOverlay';
import { DevMenu } from '../src/components/DevMenu';
import { AmbientOverlay } from '../src/components/AmbientOverlay';
import { TrailAmbientOverlay } from '../src/components/TrailAmbientOverlay';
import { ResonanceThreadsOverlay } from '../src/components/ResonanceThreadsOverlay';
import { WindowMomentOverlay } from '../src/components/WindowMomentOverlay';
import { PatternWalkOverlay } from '../src/components/PatternWalkOverlay';
import { MapBackdrop } from '../src/components/MapBackdrop';
import { DriftMarker } from '../src/components/DriftMarker';
import { useLocation } from '../src/context/LocationContext';
import { usePassingEchoes } from '../src/hooks/usePassingEchoes';
import { useGhostPings } from '../src/hooks/useGhostPings';
import { useSignalGlyphs } from '../src/hooks/useSignalGlyphs';
import { useProximitySession } from '../src/hooks/useProximitySession';
import { Proximity } from '../src/native/Proximity';
import { useCityBreath } from '../src/hooks/useCityBreath';
import { useQuietRitual } from '../src/hooks/useQuietRitual';
import { useResonanceThreads } from '../src/hooks/useResonanceThreads';
import { useWindowMoments } from '../src/hooks/useWindowMoments';
import { usePatternWalks } from '../src/hooks/usePatternWalks';
import { usePatternWalkSelection } from '../src/hooks/usePatternWalkSelection';
import { useSupabaseSignals } from '../src/hooks/useSupabaseSignals';
import { useSupabaseDensity } from '../src/hooks/useSupabaseDensity';
import { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NetworkScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { stats, loading: statsLoading } = useNetworkStats();
    const { profile } = useProfile();
    const { heatMap } = usePings();
    const { currentTrail, historicTrails, isResonating } = useTrails();
    const { activeEcho, triggerEcho } = useEchoes();
    const { isInsideNetwork, location, setOverride } = useLocation();
    const { isActive: proximityActive, lastEncounter, nearby, resonance, lastError, peerStates } = useProximitySession(profile?.id);
    const { densityScore } = useSupabaseDensity(location?.coords);
    const effectiveDensity = densityScore > 0 ? densityScore : stats.pingDensity;
    const cityBreath = useCityBreath(effectiveDensity);
    const { ritual, triggerRitual } = useQuietRitual(nearby, resonance);
    const peerCount = Object.values(peerStates).filter(state => state === 2).length;
    const { selectedId: selectedWalkId } = usePatternWalkSelection();
    const { ghostPings: realtimeGhostPings, windowMoment: realtimeWindowMoment, sendGhostPing, sendWindowMoment, isConfigured: realtimeEnabled, presenceCount, recentPresenceCount } = useSupabaseSignals();

    const [daysRemaining, setDaysRemaining] = useState(60);
    const [windowOpen, setWindowOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'signal' | 'trails'>('signal');
    const [demoPassingEchoes, setDemoPassingEchoes] = useState(true);
    const [demoGhostPings, setDemoGhostPings] = useState(true);
    const [demoGlyphs, setDemoGlyphs] = useState(true);
    const [demoThreads, setDemoThreads] = useState(true);
    const [demoWindows, setDemoWindows] = useState(true);
    const [demoPatternWalks, setDemoPatternWalks] = useState(true);
    const [demoSequenceActive, setDemoSequenceActive] = useState(false);
    const [presentationMode, setPresentationMode] = useState(false);
    const [focusOpen, setFocusOpen] = useState(false);
    const mapFade = useRef(new Animated.Value(1)).current;
    const pulse = useRef(new Animated.Value(0)).current;
    const baseOpacity = useRef(new Animated.Value(0.12)).current;
    const breath = useRef(new Animated.Value(0)).current;
    const ritualOpacity = useRef(new Animated.Value(0)).current;
    const ritualHapticTimeouts = useRef<ReturnType<typeof setTimeout>[]>([]);
    const lastWindowBroadcast = useRef<number | null>(null);
    const lastGhostBroadcast = useRef<string | null>(null);
    const windowPulse = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulse, { toValue: 1, duration: 2400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
                Animated.timing(pulse, { toValue: 0, duration: 2400, easing: Easing.in(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulse]);

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(breath, { toValue: 1, duration: cityBreath.periodMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(breath, { toValue: 0, duration: cityBreath.periodMs, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [breath, cityBreath.periodMs]);

    useEffect(() => {
        Animated.timing(ritualOpacity, {
            toValue: ritual.active ? 1 : 0,
            duration: ritual.active ? 400 : 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
        }).start();
    }, [ritual.active, ritualOpacity]);

    useEffect(() => {
        if (!windowIsOpen) {
            windowPulse.stopAnimation();
            windowPulse.setValue(0);
            return;
        }
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(windowPulse, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
                Animated.timing(windowPulse, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [windowIsOpen, windowPulse]);

    useEffect(() => {
        if (!ritual.arming) {
            ritualHapticTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
            ritualHapticTimeouts.current = [];
            return;
        }
        ritualHapticTimeouts.current = [
            setTimeout(() => Proximity.triggerHaptic('light'), 0),
            setTimeout(() => Proximity.triggerHaptic('medium'), 240),
            setTimeout(() => Proximity.triggerHaptic('heavy'), 520),
        ];

        return () => {
            ritualHapticTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
            ritualHapticTimeouts.current = [];
        };
    }, [ritual.arming]);

    useEffect(() => {
        const next = 0.08 + resonance * 0.42;
        baseOpacity.setValue(next);
    }, [baseOpacity, resonance]);

    const auraStyle = useMemo(() => {
        const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] });
        const opacity = Animated.add(
            baseOpacity,
            pulse.interpolate({ inputRange: [0, 1], outputRange: [0.02, 0.14] })
        );
        return {
            transform: [{ scale }],
            opacity,
        };
    }, [baseOpacity, pulse]);

    const breathStyle = useMemo(() => {
        const minOpacity = 0.02 + cityBreath.intensity * 0.18;
        const maxOpacity = minOpacity + 0.1;
        const opacity = breath.interpolate({ inputRange: [0, 1], outputRange: [minOpacity, maxOpacity] });
        const scale = breath.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.08] });
        return { opacity, transform: [{ scale }] };
    }, [breath, cityBreath.intensity]);

    const showGhostPings = demoGhostPings || isInsideNetwork;
    const showGlyphs = demoGlyphs || isInsideNetwork;
    const showThreads = demoThreads || isInsideNetwork;
    const showWindows = demoWindows || isInsideNetwork;
    const showPatternWalks = demoPatternWalks || isInsideNetwork;
    const passingEchoes = usePassingEchoes(lastEncounter, demoPassingEchoes);
    const ghostPings = useGhostPings(showGhostPings);
    const glyphs = useSignalGlyphs(showGlyphs, isInsideNetwork);
    const threads = useResonanceThreads(lastEncounter, demoThreads);
    const { windowMoment, triggerWindow } = useWindowMoments(peerCount, demoWindows);
    const { walks, active: activeWalk } = usePatternWalks(demoPatternWalks, selectedWalkId);
    const combinedGhostPings = useMemo(() => {
        const merged = [...realtimeGhostPings, ...ghostPings];
        return merged.slice(0, 8);
    }, [realtimeGhostPings, ghostPings]);
    const activeWindowMoment = windowMoment.isOpen ? windowMoment : realtimeWindowMoment;
    const buildGhostPing = () => {
        const now = Date.now();
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.2 + Math.random() * 0.7;
        return {
            id: `ghost-${now}`,
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            ageMinutes: 5 + Math.floor(Math.random() * 11),
        };
    };

    useEffect(() => {
        if (!demoSequenceActive) {
            return;
        }

        setDemoPassingEchoes(true);
        setDemoGhostPings(true);
        setDemoGlyphs(true);
        setDemoThreads(true);
        setDemoWindows(true);
        setDemoPatternWalks(true);
        setViewMode('signal');

        const timeouts = [
            setTimeout(() => setWindowOpen(true), 500),
            setTimeout(() => triggerEcho(), 2500),
            setTimeout(() => triggerRitual(), 5200),
            setTimeout(() => setWindowOpen(false), 7000),
            setTimeout(() => triggerEcho(), 12000),
            setTimeout(() => triggerWindow(), 13500),
            setTimeout(() => setDemoSequenceActive(false), 18000),
        ];

        return () => {
            timeouts.forEach(timeoutId => clearTimeout(timeoutId));
        };
    }, [demoSequenceActive, triggerEcho, triggerRitual, triggerWindow]);

    useEffect(() => {
        if (!presentationMode) {
            setDemoSequenceActive(false);
            Animated.timing(mapFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
            return;
        }
        setDemoPassingEchoes(true);
        setDemoGhostPings(true);
        setDemoGlyphs(true);
        setDemoThreads(true);
        setDemoWindows(true);
        setDemoPatternWalks(true);
        setDemoSequenceActive(true);
        setViewMode('signal');

        const cycle = setInterval(() => {
            setViewMode(prev => (prev === 'signal' ? 'trails' : 'signal'));
            triggerEcho();
            setWindowOpen(true);
            setTimeout(() => setWindowOpen(false), 4500);
            setTimeout(() => triggerRitual(), 2000);
            setTimeout(() => triggerWindow(), 5200);
        }, 18000);

        const fadeLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(mapFade, { toValue: 0.4, duration: 2800, useNativeDriver: true }),
                Animated.timing(mapFade, { toValue: 0.85, duration: 2800, useNativeDriver: true }),
            ])
        );
        fadeLoop.start();

        return () => {
            fadeLoop.stop();
            clearInterval(cycle);
        };
    }, [mapFade, presentationMode, triggerEcho, triggerRitual, triggerWindow]);

    useEffect(() => {
        if (!realtimeEnabled) {
            return;
        }
        if (!windowMoment.isOpen || !windowMoment.startedAt || !windowMoment.endsAt || !windowMoment.position) {
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

    useEffect(() => {
        if (profile?.activationDate) {
            const now = new Date();
            const activation = new Date(profile.activationDate);
            const diffTime = Math.abs(activation.getTime() - now.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            setDaysRemaining(diffDays);
        }
    }, [profile]);

    // Dev Actions
    const toggleWindow = () => setWindowOpen(!windowOpen);

    const handleResetOnboarding = async () => {
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
    };

    const handleClearTrails = () => {
        // In a real app, this would clear the trail state
        console.log('Clearing trails...');
    };

    const handleOpenWalks = () => {
        router.push('/walks');
    };

    const handleToggleLocation = () => {
        setOverride(isInsideNetwork ? false : true);
    };

    // Toggle View Mode
    const toggleView = () => setViewMode(prev => prev === 'signal' ? 'trails' : 'signal');

    // Determine status text and color
    const getStatusInfo = () => {
        if (!isInsideNetwork) {
            return {
                text: 'REMOTE CONNECTION',
                color: Colors.warning,
            };
        }
        if (profile?.isActivated) {
            return {
                text: 'ACTIVE',
                color: Colors.accent,
            };
        }
        return {
            text: `ACTIVATION IN ${daysRemaining} DAYS`,
            color: Colors.primary,
        };
    };

    const statusInfo = getStatusInfo();
    const windowIsOpen = windowOpen || activeWindowMoment.isOpen;
    const windowMinutes = activeWindowMoment.endsAt
        ? Math.max(1, Math.ceil((activeWindowMoment.endsAt - Date.now()) / (1000 * 60)))
        : 7;
    const focusTitle = viewMode === 'signal' ? 'SIGNAL FIELD' : 'TRAIL RESONANCE';
    const focusSize = useMemo(() => {
        const { width, height } = Dimensions.get('window');
        return Math.min(width, height) - Spacing.xxl;
    }, []);

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <Animated.View style={[styles.cityBreathHalo, breathStyle]} pointerEvents="none" />
            {!presentationMode && (
                <DevMenu
                onToggleWindow={toggleWindow}
                onTriggerEcho={triggerEcho}
                onTriggerRitual={triggerRitual}
                onTriggerWindowMoment={triggerWindow}
                onTriggerGhostPing={() => sendGhostPing(buildGhostPing())}
                onResetOnboarding={handleResetOnboarding}
                onClearTrails={handleClearTrails}
                onToggleLocation={handleToggleLocation}
                demoPassingEchoes={demoPassingEchoes}
                demoGhostPings={demoGhostPings}
                demoGlyphs={demoGlyphs}
                demoThreads={demoThreads}
                demoWindows={demoWindows}
                demoPatternWalks={demoPatternWalks}
                demoSequenceActive={demoSequenceActive}
                presentationMode={presentationMode}
                onOpenWalks={handleOpenWalks}
                onTogglePassingEchoes={() => setDemoPassingEchoes(prev => !prev)}
                onToggleGhostPings={() => setDemoGhostPings(prev => !prev)}
                onToggleGlyphs={() => setDemoGlyphs(prev => !prev)}
                onToggleThreads={() => setDemoThreads(prev => !prev)}
                onToggleWindows={() => setDemoWindows(prev => !prev)}
                onTogglePatternWalks={() => setDemoPatternWalks(prev => !prev)}
                onRunDemoSequence={() => setDemoSequenceActive(true)}
                onTogglePresentationMode={() => setPresentationMode(prev => !prev)}
                location={location}
                isInsideNetwork={isInsideNetwork}
                />
            )}

            <EchoOverlay echo={activeEcho} />
            {ritual.active && (
                <Animated.View style={[styles.ritualOverlay, { opacity: ritualOpacity }]} pointerEvents="none">
                    <Text style={styles.ritualLabel}>QUIET RITUAL</Text>
                    <Text style={styles.ritualPhrase}>{ritual.phrase}</Text>
                    <Text style={styles.ritualSig}>[1010] STILLNESS LINK</Text>
                </Animated.View>
            )}
            <FocusOverlay
                visible={focusOpen}
                title={focusTitle}
                subtitle={viewMode === 'signal' ? 'Signal field, expanded' : 'Trail field, expanded'}
                onClose={() => setFocusOpen(false)}
            >
                <View style={styles.focusStage}>
                    {viewMode === 'signal' ? (
                        <View style={[styles.focusStack, { width: focusSize, height: focusSize }]}>
                            <MapBackdrop size={focusSize} opacity={mapFade} radius={24} />
                            <SignalMap heatMap={heatMap} size={focusSize} />
                            <DriftMarker size={focusSize} strength={isInsideNetwork ? 0.8 : 0.4} />
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
                            <DriftMarker size={focusSize} strength={isInsideNetwork ? 0.8 : 0.4} />
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
            <View style={styles.statusStack}>
                <TouchableOpacity onLongPress={toggleWindow} activeOpacity={1}>
                    <Text style={[styles.header, !isInsideNetwork && { color: Colors.warning }]}>
                        1010 NETWORK
                    </Text>
                </TouchableOpacity>
                <Text style={[styles.status, { color: statusInfo.color }]}>
                    {statusInfo.text}
                </Text>
                <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{`BREATH  ${cityBreath.label}`}</Text>
                    {realtimeEnabled && (
                        <Text style={styles.metaText}>{`NODES  ${presenceCount}`}</Text>
                    )}
                    {realtimeEnabled && (
                        <Text style={styles.metaText}>{`DENSITY  ${effectiveDensity}`}</Text>
                    )}
                </View>
                {windowIsOpen && (
                    <View style={styles.windowInline}>
                        <Animated.View
                            style={[
                                styles.windowGlyph,
                                {
                                    opacity: windowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] }),
                                    transform: [{ scale: windowPulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }],
                                },
                            ]}
                        />
                        <Text style={styles.windowText}>{`WINDOW OPEN  ${windowMinutes}M`}</Text>
                    </View>
                )}
                {!isInsideNetwork && (
                    <Text style={styles.warning}>⚠ SIGNAL WEAK</Text>
                )}
            </View>

            {proximityActive && (
                <View style={styles.proximityPanel}>
                    <Animated.View style={[styles.proximityAura, auraStyle]} />
                    <Text style={styles.proximityLabel}>NEAR FIELD</Text>
                    <Text style={styles.proximityValue}>
                        {lastEncounter ? `LINKED WITH ${lastEncounter.id}` : 'SCANNING THE CROWD'}
                    </Text>
                    <Text style={styles.proximityMeta}>
                        {nearby && nearby.distance >= 0
                            ? `${nearby.distance.toFixed(2)}m  RESONANCE ${Math.round(resonance * 100)}%`
                            : 'SEARCHING FOR A SIGNAL'}
                    </Text>
                    {ritual.arming && !ritual.active && (
                        <View style={styles.ritualPrep}>
                            <Text style={styles.ritualPrepLabel}>HOLD STILL</Text>
                            <View style={styles.ritualPrepTrack}>
                                <View style={[styles.ritualPrepFill, { width: `${Math.round(ritual.armingProgress * 100)}%` }]} />
                            </View>
                        </View>
                    )}
                    <Text style={styles.proximitySignature}>[1010] AURA THREAD</Text>
                    {!!lastError && (
                        <Text style={styles.proximityError}>{lastError}</Text>
                    )}
                </View>
            )}

            <TouchableOpacity
                style={styles.visualizerContainer}
                onPress={toggleView}
                onLongPress={() => setFocusOpen(true)}
                activeOpacity={0.8}
            >
                {viewMode === 'signal' ? (
                    <View style={styles.mapStack}>
                        <MapBackdrop size={200} opacity={mapFade} />
                        <SignalMap heatMap={heatMap} />
                        <DriftMarker size={200} strength={isInsideNetwork ? 0.8 : 0.4} />
                        {showThreads && <ResonanceThreadsOverlay threads={threads} size={200} />}
                        <AmbientOverlay
                            passingEchoes={passingEchoes}
                            ghostPings={showGhostPings ? combinedGhostPings : []}
                            glyphs={showGlyphs ? glyphs : []}
                        />
                        {showWindows && (
                            <WindowMomentOverlay
                                isOpen={activeWindowMoment.isOpen}
                                position={activeWindowMoment.position}
                                size={200}
                            />
                        )}
                    </View>
                ) : (
                    <View style={styles.trailStack}>
                        <MapBackdrop size={300} opacity={mapFade} />
                        <TrailVisualizer
                            currentTrail={currentTrail}
                            historicTrails={historicTrails}
                            isResonating={isResonating}
                        />
                        <DriftMarker size={300} strength={isInsideNetwork ? 0.8 : 0.4} />
                        {showPatternWalks && <PatternWalkOverlay walks={walks} activeId={activeWalk.id} size={300} />}
                        {showThreads && <ResonanceThreadsOverlay threads={threads} size={300} />}
                        <TrailAmbientOverlay
                            passingEchoes={passingEchoes}
                            ghostPings={showGhostPings ? combinedGhostPings : []}
                            glyphs={showGlyphs ? glyphs : []}
                        />
                    </View>
                )}

            <Text style={styles.modeLabel}>
                {viewMode === 'signal' ? 'TAP TO SWITCH • HOLD TO EXPAND' : 'TAP TO SWITCH • HOLD TO EXPAND'}
            </Text>
        </TouchableOpacity>
            <TouchableOpacity style={styles.focusButton} onPress={() => setFocusOpen(true)}>
                <Text style={styles.focusButtonText}>[ ]</Text>
            </TouchableOpacity>

            <View style={styles.lowerStack}>
                <View style={styles.counterContainer}>
                    <Text style={styles.counterLabel}>PARTICIPANTS</Text>
                    <Text style={styles.counterValue}>
                        {statsLoading ? '--' : stats.totalParticipants}
                    </Text>
                </View>
                <ProximityBars strength={effectiveDensity} />
                <Text style={styles.footer}>
                    {isInsideNetwork
                        ? 'Stay in 1010 to strengthen the signal.'
                        : 'Enter 1010 postcode for full network access.'}
                </Text>
            </View>
            </ScrollView>

            {presentationMode && (
                <TouchableOpacity
                    style={[styles.presentationExit, { bottom: insets.bottom + Spacing.lg }]}
                    onPress={() => setPresentationMode(false)}
                >
                    <Text style={styles.presentationExitText}>EXIT DEMO</Text>
                </TouchableOpacity>
            )}
        </SafeAreaView>
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
    cityBreathHalo: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: Colors.surfaceHighlight,
    },
    header: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
        letterSpacing: 2,
    },
    status: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        marginBottom: Spacing.sm,
        letterSpacing: 1,
        fontFamily: Typography.mono,
    },
    statusStack: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    metaRow: {
        flexDirection: 'row',
        marginBottom: Spacing.sm,
    },
    metaText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
        marginHorizontal: Spacing.xs,
    },
    ritualOverlay: {
        position: 'absolute',
        left: Spacing.lg,
        right: Spacing.lg,
        top: '35%',
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
        backgroundColor: 'rgba(5, 5, 5, 0.88)',
        alignItems: 'center',
        zIndex: 220,
    },
    ritualLabel: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginBottom: Spacing.sm,
        fontFamily: Typography.mono,
    },
    ritualPhrase: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        textAlign: 'center',
        letterSpacing: 1,
        fontFamily: Typography.mono,
    },
    ritualSig: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginTop: Spacing.md,
        fontFamily: Typography.mono,
    },
    warning: {
        color: Colors.warning,
        fontSize: Typography.size.xs,
        marginBottom: Spacing.sm,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    windowInline: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    windowGlyph: {
        width: 10,
        height: 10,
        borderRadius: 5,
        borderWidth: 1,
        borderColor: Colors.warning,
    },
    windowText: {
        color: Colors.warning,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    visualizerContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    mapStack: {
        width: 200,
        height: 200,
        position: 'relative',
    },
    trailStack: {
        width: 300,
        height: 300,
        position: 'relative',
    },
    presentationExit: {
        position: 'absolute',
        right: Spacing.lg,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.tertiary,
        backgroundColor: 'rgba(5, 5, 5, 0.8)',
    },
    presentationExitText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    proximityPanel: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.glass,
        borderRadius: 8,
        overflow: 'hidden',
    },
    proximityAura: {
        position: 'absolute',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: Colors.surfaceHighlight,
    },
    proximitySignature: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginTop: Spacing.sm,
        fontFamily: Typography.mono,
    },
    proximityLabel: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        marginBottom: Spacing.xs,
        fontFamily: Typography.mono,
    },
    proximityValue: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        letterSpacing: 1,
        fontFamily: Typography.mono,
    },
    proximityMeta: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 1,
        marginTop: Spacing.xs,
        fontFamily: Typography.mono,
    },
    ritualPrep: {
        marginTop: Spacing.sm,
        width: 160,
        alignItems: 'center',
    },
    ritualPrepLabel: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
        marginBottom: Spacing.xs,
    },
    ritualPrepTrack: {
        width: '100%',
        height: 4,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    ritualPrepFill: {
        height: '100%',
        backgroundColor: Colors.tertiary,
    },
    proximityError: {
        color: Colors.warning,
        fontSize: Typography.size.xs,
        marginTop: Spacing.xs,
        fontFamily: Typography.mono,
    },
    modeLabel: {
        position: 'absolute',
        bottom: Spacing.sm,
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    focusButton: {
        marginTop: -Spacing.xs,
        marginBottom: Spacing.lg,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
    },
    focusButtonText: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    counterContainer: {
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    counterLabel: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontFamily: Typography.mono,
    },
    counterValue: {
        color: Colors.primary,
        fontSize: 64,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    footer: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        textAlign: 'center',
        marginTop: Spacing.lg,
        fontFamily: Typography.mono,
        letterSpacing: 1,
    },
    lowerStack: {
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    focusStage: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    focusStack: {
        position: 'relative',
    },
});

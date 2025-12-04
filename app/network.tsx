import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Colors, Typography, Spacing } from '../src/constants/Theme';
import { ProximityBars } from '../src/components/ProximityBars';
import { useNetworkStats } from '../src/hooks/useNetworkStats';
import { useProfile } from '../src/hooks/useProfile';
import { usePings } from '../src/hooks/usePings';
import { useTrails } from '../src/hooks/useTrails';
import { useEchoes } from '../src/hooks/useEchoes';
import { SignalMap } from '../src/components/SignalMap';
import { TrailVisualizer } from '../src/components/TrailVisualizer';
import { WindowAlert } from '../src/components/WindowAlert';
import { EchoOverlay } from '../src/components/EchoOverlay';
import { DevMenu } from '../src/components/DevMenu';
import { useLocation } from '../src/context/LocationContext';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function NetworkScreen() {
    const router = useRouter();
    const { stats, loading: statsLoading } = useNetworkStats();
    const { profile } = useProfile();
    const { heatMap } = usePings();
    const { currentTrail, historicTrails, isResonating } = useTrails();
    const { activeEcho, triggerEcho } = useEchoes();
    const { isInsideNetwork, location, setOverride } = useLocation();

    const [daysRemaining, setDaysRemaining] = useState(60);
    const [windowOpen, setWindowOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'signal' | 'trails'>('signal');

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

    return (
        <View style={styles.container}>
            <DevMenu
                onToggleWindow={toggleWindow}
                onTriggerEcho={triggerEcho}
                onResetOnboarding={handleResetOnboarding}
                onClearTrails={handleClearTrails}
                onToggleLocation={handleToggleLocation}
                location={location}
                isInsideNetwork={isInsideNetwork}
            />

            <WindowAlert visible={windowOpen} minutesRemaining={7} />
            <EchoOverlay echo={activeEcho} />

            <TouchableOpacity onLongPress={toggleWindow} activeOpacity={1}>
                <Text style={[styles.header, !isInsideNetwork && { color: Colors.warning }]}>
                    1010 NETWORK
                </Text>
            </TouchableOpacity>

            {!isInsideNetwork && (
                <Text style={styles.warning}>⚠ SIGNAL WEAK</Text>
            )}

            <Text style={[styles.status, { color: statusInfo.color }]}>
                {statusInfo.text}
            </Text>

            <TouchableOpacity
                style={styles.visualizerContainer}
                onPress={toggleView}
                activeOpacity={0.8}
            >
                {viewMode === 'signal' ? (
                    <SignalMap heatMap={heatMap} />
                ) : (
                    <TrailVisualizer
                        currentTrail={currentTrail}
                        historicTrails={historicTrails}
                        isResonating={isResonating}
                    />
                )}

                <Text style={styles.modeLabel}>
                    {viewMode === 'signal' ? 'SIGNAL MAP' : 'TRAIL RESONANCE'}
                </Text>
            </TouchableOpacity>

            <View style={styles.counterContainer}>
                <Text style={styles.counterLabel}>PARTICIPANTS</Text>
                <Text style={styles.counterValue}>
                    {statsLoading ? '--' : stats.totalParticipants}
                </Text>
            </View>

            <View style={{ marginBottom: Spacing.xxl }}>
                <ProximityBars strength={stats.pingDensity} />
            </View>

            <Text style={styles.footer}>
                {isInsideNetwork
                    ? 'Stay in 1010 to strengthen the signal.'
                    : 'Enter 1010 postcode for full network access.'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    header: {
        color: Colors.primary,
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        marginBottom: Spacing.sm,
        letterSpacing: 2,
    },
    status: {
        color: Colors.secondary,
        fontSize: Typography.size.sm,
        marginBottom: Spacing.xxl,
        letterSpacing: 1,
    },
    warning: {
        color: Colors.warning,
        fontSize: Typography.size.xs,
        marginBottom: Spacing.sm,
        letterSpacing: 2,
    },
    visualizerContainer: {
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    modeLabel: {
        position: 'absolute',
        bottom: Spacing.sm,
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
    },
    counterContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxl,
    },
    counterLabel: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        marginBottom: Spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    counterValue: {
        color: Colors.primary,
        fontSize: 64,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    footer: {
        position: 'absolute',
        bottom: Spacing.xl,
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        textAlign: 'center',
    },
});

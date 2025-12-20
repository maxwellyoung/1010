import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Theme';
import type { LocationObject } from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DevMenuProps {
    onToggleWindow: () => void;
    onTriggerEcho: () => void;
    onTriggerRitual: () => void;
    onTriggerWindowMoment: () => void;
    onTriggerGhostPing: () => void;
    onResetOnboarding: () => void;
    onClearTrails: () => void;
    onToggleLocation: () => void;
    demoPassingEchoes: boolean;
    demoGhostPings: boolean;
    demoGlyphs: boolean;
    demoThreads: boolean;
    demoWindows: boolean;
    demoPatternWalks: boolean;
    demoSequenceActive: boolean;
    presentationMode: boolean;
    onTogglePassingEchoes: () => void;
    onToggleGhostPings: () => void;
    onToggleGlyphs: () => void;
    onToggleThreads: () => void;
    onToggleWindows: () => void;
    onTogglePatternWalks: () => void;
    onRunDemoSequence: () => void;
    onTogglePresentationMode: () => void;
    onOpenWalks: () => void;
    location: LocationObject | null;
    isInsideNetwork: boolean;
}

export const DevMenu: React.FC<DevMenuProps> = ({
    onToggleWindow,
    onTriggerEcho,
    onResetOnboarding,
    onClearTrails,
    onToggleLocation,
    onTriggerRitual,
    onTriggerWindowMoment,
    onTriggerGhostPing,
    demoPassingEchoes,
    demoGhostPings,
    demoGlyphs,
    demoThreads,
    demoWindows,
    demoPatternWalks,
    demoSequenceActive,
    presentationMode,
    onTogglePassingEchoes,
    onToggleGhostPings,
    onToggleGlyphs,
    onToggleThreads,
    onToggleWindows,
    onTogglePatternWalks,
    onRunDemoSequence,
    onTogglePresentationMode,
    onOpenWalks,
    location,
    isInsideNetwork,
}) => {
    const [visible, setVisible] = useState(false);
    const insets = useSafeAreaInsets();

    if (!__DEV__ || presentationMode) return null;

    return (
        <>
            <TouchableOpacity
                style={[styles.trigger, { top: insets.top + 10 }]}
                onPress={() => setVisible(true)}
                activeOpacity={0.8}
            >
                <Text style={styles.triggerText}>DEV</Text>
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.container}>
                        <View style={styles.header}>
                            <Text style={styles.title}>DEVELOPER TOOLS</Text>
                            <TouchableOpacity onPress={() => setVisible(false)}>
                                <Text style={styles.close}>CLOSE</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={styles.content}>
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>LOCATION</Text>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Latitude</Text>
                                    <Text style={styles.value}>
                                        {location?.coords.latitude.toFixed(6) || '--'}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Longitude</Text>
                                    <Text style={styles.value}>
                                        {location?.coords.longitude.toFixed(6) || '--'}
                                    </Text>
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Inside Network</Text>
                                    <Text style={[styles.value, { color: isInsideNetwork ? Colors.accent : Colors.error }]}>
                                        {isInsideNetwork ? 'YES' : 'NO'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>ACTIONS</Text>

                                <TouchableOpacity style={styles.button} onPress={onToggleLocation}>
                                    <Text style={styles.buttonText}>TOGGLE NETWORK STATUS</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button} onPress={onToggleWindow}>
                                    <Text style={styles.buttonText}>TOGGLE WINDOW ALERT</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button} onPress={onTriggerEcho}>
                                    <Text style={styles.buttonText}>TRIGGER ECHO</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button} onPress={onTriggerRitual}>
                                    <Text style={styles.buttonText}>TRIGGER RITUAL</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button} onPress={onTriggerWindowMoment}>
                                    <Text style={styles.buttonText}>TRIGGER WINDOW</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button} onPress={onTriggerGhostPing}>
                                    <Text style={styles.buttonText}>TRIGGER GHOST PING</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.button} onPress={onClearTrails}>
                                    <Text style={styles.buttonText}>CLEAR TRAILS</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onResetOnboarding}>
                                    <Text style={styles.dangerButtonText}>RESET ONBOARDING</Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>DEMO SIGNALS</Text>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Presentation Mode</Text>
                                    <Switch value={presentationMode} onValueChange={onTogglePresentationMode} />
                                </View>
                                <TouchableOpacity
                                    style={[styles.button, demoSequenceActive && styles.activeButton]}
                                    onPress={onRunDemoSequence}
                                >
                                    <Text style={styles.buttonText}>
                                        {demoSequenceActive ? 'DEMO RUNNING' : 'RUN DEMO SEQUENCE'}
                                    </Text>
                                </TouchableOpacity>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Passing Echoes</Text>
                                    <Switch value={demoPassingEchoes} onValueChange={onTogglePassingEchoes} />
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Ghost Pings</Text>
                                    <Switch value={demoGhostPings} onValueChange={onToggleGhostPings} />
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Signal Glyphs</Text>
                                    <Switch value={demoGlyphs} onValueChange={onToggleGlyphs} />
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Resonance Threads</Text>
                                    <Switch value={demoThreads} onValueChange={onToggleThreads} />
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Window Moments</Text>
                                    <Switch value={demoWindows} onValueChange={onToggleWindows} />
                                </View>
                                <View style={styles.row}>
                                    <Text style={styles.label}>Pattern Walks</Text>
                                    <Switch value={demoPatternWalks} onValueChange={onTogglePatternWalks} />
                                </View>
                                <TouchableOpacity style={styles.button} onPress={onOpenWalks}>
                                    <Text style={styles.buttonText}>OPEN WALK LIBRARY</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    trigger: {
        position: 'absolute',
        right: 20,
        backgroundColor: 'rgba(255, 0, 0, 0.2)',
        padding: 8,
        borderRadius: 4,
        zIndex: 999,
    },
    triggerText: {
        color: Colors.error,
        fontWeight: 'bold',
        fontSize: 10,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: Colors.surface,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '70%',
        padding: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        fontWeight: 'bold',
    },
    close: {
        color: Colors.secondary,
        fontWeight: 'bold',
    },
    content: {
        paddingBottom: Spacing.xxl,
    },
    section: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        marginBottom: Spacing.md,
        letterSpacing: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    label: {
        color: Colors.secondary,
        fontSize: Typography.size.md,
    },
    value: {
        color: Colors.primary,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: Colors.surfaceHighlight,
        padding: Spacing.md,
        borderRadius: 8,
        marginBottom: Spacing.sm,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.primary,
        fontWeight: 'bold',
        fontSize: Typography.size.sm,
    },
    activeButton: {
        borderWidth: 1,
        borderColor: Colors.accent,
    },
    dangerButton: {
        backgroundColor: 'rgba(255, 68, 68, 0.1)',
        marginTop: Spacing.md,
    },
    dangerButtonText: {
        color: Colors.error,
        fontWeight: 'bold',
        fontSize: Typography.size.sm,
    },
});

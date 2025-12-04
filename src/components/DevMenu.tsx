import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Switch, ScrollView } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/Theme';
import type { LocationObject } from 'expo-location';

interface DevMenuProps {
    onToggleWindow: () => void;
    onTriggerEcho: () => void;
    onResetOnboarding: () => void;
    onClearTrails: () => void;
    onToggleLocation: () => void;
    location: LocationObject | null;
    isInsideNetwork: boolean;
}

export const DevMenu: React.FC<DevMenuProps> = ({
    onToggleWindow,
    onTriggerEcho,
    onResetOnboarding,
    onClearTrails,
    onToggleLocation,
    location,
    isInsideNetwork,
}) => {
    const [visible, setVisible] = useState(false);

    if (!__DEV__) return null;

    return (
        <>
            <TouchableOpacity
                style={styles.trigger}
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

                                <TouchableOpacity style={styles.button} onPress={onClearTrails}>
                                    <Text style={styles.buttonText}>CLEAR TRAILS</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={onResetOnboarding}>
                                    <Text style={styles.dangerButtonText}>RESET ONBOARDING</Text>
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
        top: 50,
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

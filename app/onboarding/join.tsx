import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Colors, Typography, Spacing } from '../../src/constants/Theme';
import { useProfile } from '../../src/hooks/useProfile';

export default function JoinScreen() {
    const router = useRouter();
    const [input, setInput] = useState('');
    const { createProfile } = useProfile();
    const [joining, setJoining] = useState(false);

    const handleJoin = async () => {
        if (!input) return;
        setJoining(true);
        try {
            await createProfile(input);
            // Small artificial delay for "network handshake" feel
            setTimeout(() => {
                router.replace('/network');
            }, 1500);
        } catch (e) {
            console.error(e);
            setJoining(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.header}>IDENTIFY</Text>
                <Text style={styles.desc}>
                    Enter your contact method for network activation.
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="PHONE / EMAIL"
                    placeholderTextColor={Colors.tertiary}
                    value={input}
                    onChangeText={setInput}
                    autoCapitalize="none"
                    editable={!joining}
                />
            </View>

            <TouchableOpacity
                style={[styles.button, (!input || joining) && styles.buttonDisabled]}
                onPress={handleJoin}
                disabled={!input || joining}
            >
                {joining ? (
                    <ActivityIndicator color={Colors.background} />
                ) : (
                    <Text style={[styles.buttonText, !input && styles.buttonTextDisabled]}>
                        JOIN NETWORK
                    </Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        justifyContent: 'space-between',
        padding: Spacing.xl,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    header: {
        color: Colors.primary,
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
        letterSpacing: 2,
    },
    desc: {
        color: Colors.secondary,
        marginBottom: Spacing.xl,
    },
    input: {
        borderBottomColor: Colors.primary,
        borderBottomWidth: 1,
        color: Colors.primary,
        fontSize: Typography.size.lg,
        paddingVertical: Spacing.sm,
        fontFamily: Typography.mono,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        alignItems: 'center',
        borderRadius: 4,
    },
    buttonDisabled: {
        backgroundColor: Colors.tertiary,
    },
    buttonText: {
        color: Colors.background,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    buttonTextDisabled: {
        color: Colors.secondary,
    },
});

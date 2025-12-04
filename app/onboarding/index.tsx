import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/Theme';

export default function WelcomeScreen() {
    const router = useRouter();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.logo}>1010</Text>
                <Text style={styles.subtitle}>NETWORK</Text>
                <Text style={styles.description}>
                    A hyperlocal presence network.{'\n'}
                    Locked to Auckland CBD.
                </Text>
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/onboarding/permissions')}
            >
                <Text style={styles.buttonText}>INITIALIZE</Text>
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
        alignItems: 'center',
    },
    logo: {
        color: Colors.primary,
        fontSize: 64,
        fontWeight: 'bold',
        letterSpacing: 4,
    },
    subtitle: {
        color: Colors.secondary,
        fontSize: Typography.size.lg,
        letterSpacing: 8,
        marginBottom: Spacing.xl,
    },
    description: {
        color: Colors.primary,
        textAlign: 'center',
        lineHeight: 24,
        opacity: 0.8,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: Spacing.md,
        alignItems: 'center',
        borderRadius: 4,
    },
    buttonText: {
        color: Colors.background,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});

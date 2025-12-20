import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/Theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
                ]}
            >
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
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.xl,
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

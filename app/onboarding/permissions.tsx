import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../../src/constants/Theme';
import { useLocation } from '../../src/context/LocationContext';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PermissionsScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { requestPermissions, errorMsg } = useLocation();

    const handlePermissions = async () => {
        await requestPermissions();
        // In a real app, we'd check if permissions were actually granted
        router.push('/onboarding/join');
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl },
                ]}
            >
                <View style={styles.content}>
                    <Text style={styles.header}>ACCESS REQUIRED</Text>

                    <View style={styles.item}>
                        <Text style={styles.label}>LOCATION</Text>
                        <Text style={styles.desc}>
                            Required to verify presence within 1010.
                            Data is quantized and anonymous.
                        </Text>
                    </View>

                    <View style={styles.item}>
                        <Text style={styles.label}>NOTIFICATIONS</Text>
                        <Text style={styles.desc}>
                            Required for network contact.
                            Expect silence for ~60 days.
                        </Text>
                    </View>

                    {errorMsg && <Text style={styles.error}>{errorMsg}</Text>}
                </View>

                <TouchableOpacity style={styles.button} onPress={handlePermissions}>
                    <Text style={styles.buttonText}>GRANT ACCESS</Text>
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
    },
    header: {
        color: Colors.primary,
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        marginBottom: Spacing.xxl,
        letterSpacing: 2,
    },
    item: {
        marginBottom: Spacing.xl,
    },
    label: {
        color: Colors.primary,
        fontSize: Typography.size.sm,
        fontWeight: 'bold',
        marginBottom: Spacing.xs,
        letterSpacing: 1,
    },
    desc: {
        color: Colors.secondary,
        lineHeight: 20,
    },
    error: {
        color: Colors.error,
        marginTop: Spacing.md,
    },
    button: {
        borderColor: Colors.primary,
        borderWidth: 1,
        padding: Spacing.md,
        alignItems: 'center',
        borderRadius: 4,
    },
    buttonText: {
        color: Colors.primary,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
});

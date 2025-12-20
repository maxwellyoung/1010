import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../src/constants/Theme';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
    const insets = useSafeAreaInsets();

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg },
                ]}
            >
                <Text style={styles.header}>LOST ROUTE</Text>
                <Text style={styles.message}>This path does not exist in 1010.</Text>
                <Text style={styles.subMessage}>Return to the network to continue.</Text>
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
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
    },
    header: {
        color: Colors.primary,
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
        letterSpacing: 2,
    },
    message: {
        color: Colors.secondary,
        fontSize: Typography.size.md,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subMessage: {
        color: Colors.tertiary,
        fontSize: Typography.size.sm,
        textAlign: 'center',
    },
});

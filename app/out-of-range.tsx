import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../src/constants/Theme';

export default function OutOfRangeScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.header}>SIGNAL LOST</Text>
            <Text style={styles.message}>
                You are outside the 1010 network boundary.
            </Text>
            <Text style={styles.subMessage}>
                Return to Auckland CBD (1010) to reconnect.
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
        color: Colors.error,
        fontSize: Typography.size.xl,
        fontWeight: 'bold',
        marginBottom: Spacing.md,
        letterSpacing: 2,
    },
    message: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subMessage: {
        color: Colors.secondary,
        fontSize: Typography.size.sm,
        textAlign: 'center',
    },
});

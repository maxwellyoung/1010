import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Typography, Spacing } from '../src/constants/Theme';
import { usePatternWalks } from '../src/hooks/usePatternWalks';
import { usePatternWalkSelection } from '../src/hooks/usePatternWalkSelection';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

export default function WalksScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { selectedId, setSelectedId } = usePatternWalkSelection();
    const { walks } = usePatternWalks(false, selectedId);

    return (
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
            <View
                style={[
                    styles.container,
                    { paddingTop: insets.top + Spacing.lg, paddingBottom: insets.bottom + Spacing.lg },
                ]}
            >
                <View style={styles.header} accessibilityRole="header">
                    <Text style={styles.title} accessibilityRole="header">PATTERN WALKS</Text>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        accessibilityLabel="Close pattern walks"
                        accessibilityRole="button"
                        accessibilityHint="Returns to the network screen"
                    >
                        <Text style={styles.close}>CLOSE</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.subtitle}>Auckland CBD patterns, held lightly.</Text>

                <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                    {walks.map(walk => {
                        const isActive = walk.id === selectedId;
                        return (
                            <TouchableOpacity
                                key={walk.id}
                                style={[styles.card, isActive && styles.cardActive]}
                                onPress={() => setSelectedId(isActive ? null : walk.id)}
                                activeOpacity={0.8}
                                accessibilityLabel={`${walk.name}. ${walk.description}. ${isActive ? 'Currently active' : 'Tap to activate'}`}
                                accessibilityRole="button"
                                accessibilityState={{ selected: isActive }}
                                accessibilityHint={isActive ? 'Double tap to deactivate this walk' : 'Double tap to activate this walk'}
                            >
                                <Text style={styles.cardName}>{walk.name}</Text>
                                <Text style={styles.cardDescription}>{walk.description}</Text>
                                <Text style={styles.cardMeta}>{isActive ? 'ACTIVE' : 'TAP TO ACTIVATE'}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
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
        paddingHorizontal: Spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.xl,
    },
    title: {
        color: Colors.primary,
        fontSize: Typography.size.lg,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    close: {
        color: Colors.secondary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
    subtitle: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 1,
        marginBottom: Spacing.lg,
        fontFamily: Typography.mono,
    },
    list: {
        paddingBottom: Spacing.xxl,
    },
    card: {
        borderWidth: 1,
        borderColor: Colors.surfaceHighlight,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    cardActive: {
        borderColor: Colors.secondary,
        backgroundColor: 'rgba(17, 17, 17, 0.5)',
    },
    cardName: {
        color: Colors.primary,
        fontSize: Typography.size.md,
        letterSpacing: 1,
        fontFamily: Typography.mono,
        marginBottom: Spacing.sm,
    },
    cardDescription: {
        color: Colors.secondary,
        fontSize: Typography.size.sm,
        lineHeight: 18,
        fontFamily: Typography.mono,
        marginBottom: Spacing.md,
    },
    cardMeta: {
        color: Colors.tertiary,
        fontSize: Typography.size.xs,
        letterSpacing: 2,
        fontFamily: Typography.mono,
    },
});

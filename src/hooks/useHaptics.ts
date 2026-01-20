import { useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics Hook
 *
 * Provides standardized haptic feedback throughout the app.
 * Falls back gracefully on unsupported devices.
 *
 * Haptic vocabulary:
 * - light: subtle acknowledgment (toggles, selections)
 * - medium: confirmation (successful actions)
 * - heavy: emphasis (important moments)
 * - soft: gentle feedback (ambient events)
 * - rigid: firm feedback (errors, warnings)
 * - success: positive completion
 * - warning: caution
 * - error: something went wrong
 */

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
type NotificationStyle = 'success' | 'warning' | 'error';

export function useHaptics(enabled: boolean = true) {
    const isSupported = Platform.OS === 'ios';

    // Impact feedback
    const impact = useCallback(async (style: ImpactStyle = 'light') => {
        if (!enabled || !isSupported) return;

        try {
            const impactStyles: Record<ImpactStyle, Haptics.ImpactFeedbackStyle> = {
                light: Haptics.ImpactFeedbackStyle.Light,
                medium: Haptics.ImpactFeedbackStyle.Medium,
                heavy: Haptics.ImpactFeedbackStyle.Heavy,
                soft: Haptics.ImpactFeedbackStyle.Soft,
                rigid: Haptics.ImpactFeedbackStyle.Rigid,
            };
            await Haptics.impactAsync(impactStyles[style]);
        } catch (error) {
            // Silently fail if haptics unavailable
        }
    }, [enabled, isSupported]);

    // Notification feedback
    const notification = useCallback(async (style: NotificationStyle = 'success') => {
        if (!enabled || !isSupported) return;

        try {
            const notificationStyles: Record<NotificationStyle, Haptics.NotificationFeedbackType> = {
                success: Haptics.NotificationFeedbackType.Success,
                warning: Haptics.NotificationFeedbackType.Warning,
                error: Haptics.NotificationFeedbackType.Error,
            };
            await Haptics.notificationAsync(notificationStyles[style]);
        } catch (error) {
            // Silently fail if haptics unavailable
        }
    }, [enabled, isSupported]);

    // Selection feedback (lightest)
    const selection = useCallback(async () => {
        if (!enabled || !isSupported) return;

        try {
            await Haptics.selectionAsync();
        } catch (error) {
            // Silently fail if haptics unavailable
        }
    }, [enabled, isSupported]);

    // Convenience methods for specific actions
    const onTap = useCallback(() => impact('light'), [impact]);
    const onPress = useCallback(() => impact('medium'), [impact]);
    const onLongPress = useCallback(() => impact('heavy'), [impact]);
    const onToggle = useCallback(() => selection(), [selection]);
    const onSuccess = useCallback(() => notification('success'), [notification]);
    const onWarning = useCallback(() => notification('warning'), [notification]);
    const onError = useCallback(() => notification('error'), [notification]);

    // Ritual-specific haptic sequence (escalating)
    const ritualArming = useCallback(async () => {
        if (!enabled || !isSupported) return;

        await impact('light');
        setTimeout(() => impact('medium'), 240);
        setTimeout(() => impact('heavy'), 520);
    }, [enabled, isSupported, impact]);

    // Encounter haptic sequence
    const encounterDetected = useCallback(async () => {
        if (!enabled || !isSupported) return;

        await impact('soft');
        setTimeout(() => impact('medium'), 150);
    }, [enabled, isSupported, impact]);

    // Window opening haptic
    const windowOpening = useCallback(async () => {
        if (!enabled || !isSupported) return;

        await impact('soft');
        setTimeout(() => impact('soft'), 200);
        setTimeout(() => impact('soft'), 400);
    }, [enabled, isSupported, impact]);

    return {
        // Core methods
        impact,
        notification,
        selection,

        // Convenience
        onTap,
        onPress,
        onLongPress,
        onToggle,
        onSuccess,
        onWarning,
        onError,

        // App-specific
        ritualArming,
        encounterDetected,
        windowOpening,

        // State
        isEnabled: enabled,
        isSupported,
    };
}

export type HapticsReturn = ReturnType<typeof useHaptics>;

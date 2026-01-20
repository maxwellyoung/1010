import { useCallback, useRef, useEffect, useState } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import * as Haptics from 'expo-haptics';

/**
 * Soundscape Hook
 *
 * Provides ambient audio cues for the network experience.
 * Sound is optional and respects user preferences.
 *
 * Inspired by Muriel Cooper's sensory interface design:
 * - Sound as information layer
 * - Ambient, not intrusive
 * - Reinforces spatial understanding
 */

type SoundType =
    | 'breath'      // City breath ambient loop
    | 'encounter'   // Proximity encounter chime
    | 'ritual'      // Quiet ritual tone
    | 'window'      // Window opening
    | 'echo'        // Echo detected
    | 'connect'     // Connection established
    | 'disconnect'; // Signal lost

interface SoundConfig {
    volume: number;
    loop: boolean;
    fadeIn?: number;
    fadeOut?: number;
    haptic?: Haptics.ImpactFeedbackStyle;
}

const SOUND_CONFIGS: Record<SoundType, SoundConfig> = {
    breath: { volume: 0.15, loop: true, fadeIn: 2000, fadeOut: 2000 },
    encounter: { volume: 0.4, loop: false, haptic: Haptics.ImpactFeedbackStyle.Light },
    ritual: { volume: 0.5, loop: false, fadeIn: 500, haptic: Haptics.ImpactFeedbackStyle.Heavy },
    window: { volume: 0.35, loop: false, haptic: Haptics.ImpactFeedbackStyle.Medium },
    echo: { volume: 0.3, loop: false },
    connect: { volume: 0.4, loop: false, haptic: Haptics.ImpactFeedbackStyle.Light },
    disconnect: { volume: 0.25, loop: false },
};

// Sound assets - these will be bundled with the app
// To add sounds: place files in assets/sounds/ and require them here
const SOUND_ASSETS: Partial<Record<SoundType, any>> = {
    // Uncomment as audio files are added:
    // breath: require('../../assets/sounds/breath.mp3'),
    // encounter: require('../../assets/sounds/encounter.mp3'),
    // ritual: require('../../assets/sounds/ritual.mp3'),
    // window: require('../../assets/sounds/window.mp3'),
    // echo: require('../../assets/sounds/echo.mp3'),
    // connect: require('../../assets/sounds/connect.mp3'),
    // disconnect: require('../../assets/sounds/disconnect.mp3'),
};

export function useSoundscape(enabled: boolean = false) {
    const soundsRef = useRef<Map<SoundType, Audio.Sound>>(new Map());
    const [isInitialized, setIsInitialized] = useState(false);
    const [isBreathPlaying, setIsBreathPlaying] = useState(false);

    // Initialize audio mode
    useEffect(() => {
        if (!enabled) return;

        const initAudio = async () => {
            try {
                await Audio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: false,
                    playsInSilentModeIOS: false,
                    shouldDuckAndroid: true,
                    playThroughEarpieceAndroid: false,
                });
                setIsInitialized(true);
            } catch (error) {
                console.warn('[SOUND] Audio initialization failed:', error);
            }
        };

        initAudio();

        return () => {
            // Cleanup all sounds on unmount
            soundsRef.current.forEach(async (sound) => {
                try {
                    await sound.unloadAsync();
                } catch {
                    // Ignore cleanup errors
                }
            });
            soundsRef.current.clear();
        };
    }, [enabled]);

    // Load a sound
    const loadSound = useCallback(async (type: SoundType): Promise<Audio.Sound | null> => {
        if (!enabled || !isInitialized) return null;

        const asset = SOUND_ASSETS[type];
        if (!asset) {
            // Sound file not available yet - use haptic fallback
            return null;
        }

        try {
            const existing = soundsRef.current.get(type);
            if (existing) {
                const status = await existing.getStatusAsync();
                if (status.isLoaded) return existing;
            }

            const { sound } = await Audio.Sound.createAsync(
                asset,
                { volume: SOUND_CONFIGS[type].volume }
            );

            soundsRef.current.set(type, sound);
            return sound;
        } catch (error) {
            console.warn(`[SOUND] Failed to load ${type}:`, error);
            return null;
        }
    }, [enabled, isInitialized]);

    // Trigger haptic feedback
    const triggerHaptic = useCallback(async (style?: Haptics.ImpactFeedbackStyle) => {
        if (!style) return;
        try {
            await Haptics.impactAsync(style);
        } catch {
            // Ignore haptic errors
        }
    }, []);

    // Play a sound with optional fade-in
    const play = useCallback(async (type: SoundType): Promise<void> => {
        if (!enabled) return;

        const config = SOUND_CONFIGS[type];

        // Always trigger haptic if configured
        if (config.haptic) {
            triggerHaptic(config.haptic);
        }

        const sound = await loadSound(type);
        if (!sound) return;

        try {
            await sound.setPositionAsync(0);
            await sound.setIsLoopingAsync(config.loop);

            if (config.fadeIn && config.fadeIn > 0) {
                await sound.setVolumeAsync(0);
                await sound.playAsync();

                // Fade in gradually
                const steps = 10;
                const stepDuration = config.fadeIn / steps;
                const volumeStep = config.volume / steps;

                for (let i = 1; i <= steps; i++) {
                    setTimeout(async () => {
                        try {
                            const status = await sound.getStatusAsync();
                            if (status.isLoaded) {
                                await sound.setVolumeAsync(volumeStep * i);
                            }
                        } catch {
                            // Sound may have been unloaded
                        }
                    }, stepDuration * i);
                }
            } else {
                await sound.playAsync();
            }

            if (type === 'breath') {
                setIsBreathPlaying(true);
            }
        } catch (error) {
            console.warn(`[SOUND] Failed to play ${type}:`, error);
        }
    }, [enabled, loadSound, triggerHaptic]);

    // Stop a sound with optional fade-out
    const stop = useCallback(async (type: SoundType): Promise<void> => {
        const sound = soundsRef.current.get(type);
        if (!sound) return;

        const config = SOUND_CONFIGS[type];

        try {
            const status = await sound.getStatusAsync();
            if (!status.isLoaded) return;

            if (config.fadeOut && config.fadeOut > 0) {
                const currentVolume = (status as AVPlaybackStatus & { volume?: number }).volume ?? config.volume;
                const steps = 10;
                const stepDuration = config.fadeOut / steps;
                const volumeStep = currentVolume / steps;

                for (let i = 1; i <= steps; i++) {
                    setTimeout(async () => {
                        try {
                            const currentStatus = await sound.getStatusAsync();
                            if (currentStatus.isLoaded) {
                                const newVolume = Math.max(0, currentVolume - volumeStep * i);
                                await sound.setVolumeAsync(newVolume);
                                if (i === steps) {
                                    await sound.stopAsync();
                                }
                            }
                        } catch {
                            // Sound may have been unloaded
                        }
                    }, stepDuration * i);
                }
            } else {
                await sound.stopAsync();
            }

            if (type === 'breath') {
                setIsBreathPlaying(false);
            }
        } catch (error) {
            console.warn(`[SOUND] Failed to stop ${type}:`, error);
        }
    }, []);

    // Convenience methods
    const playEncounter = useCallback(() => play('encounter'), [play]);
    const playRitual = useCallback(() => play('ritual'), [play]);
    const playWindow = useCallback(() => play('window'), [play]);
    const playEcho = useCallback(() => play('echo'), [play]);
    const playConnect = useCallback(() => play('connect'), [play]);
    const playDisconnect = useCallback(() => play('disconnect'), [play]);

    const startBreath = useCallback(() => play('breath'), [play]);
    const stopBreath = useCallback(() => stop('breath'), [stop]);

    // Haptic-only methods (for when sounds aren't loaded)
    const hapticLight = useCallback(() => triggerHaptic(Haptics.ImpactFeedbackStyle.Light), [triggerHaptic]);
    const hapticMedium = useCallback(() => triggerHaptic(Haptics.ImpactFeedbackStyle.Medium), [triggerHaptic]);
    const hapticHeavy = useCallback(() => triggerHaptic(Haptics.ImpactFeedbackStyle.Heavy), [triggerHaptic]);

    return {
        // Core
        play,
        stop,
        isEnabled: enabled,
        isInitialized,

        // Sound events
        playEncounter,
        playRitual,
        playWindow,
        playEcho,
        playConnect,
        playDisconnect,

        // Ambient
        startBreath,
        stopBreath,
        isBreathPlaying,

        // Haptics
        hapticLight,
        hapticMedium,
        hapticHeavy,
    };
}

export type Soundscape = ReturnType<typeof useSoundscape>;

import { Easing } from 'react-native-reanimated';

/**
 * Motion System
 *
 * Refined, organic motion that feels natural rather than technical.
 * Inspired by midday.ai's smooth, purposeful transitions.
 */

export const Motion = {
    // Durations (ms) - slightly longer for smoother feel
    duration: {
        instant: 100,
        micro: 150,
        fast: 200,
        normal: 300,
        slow: 450,
        ambient: 2000,
        background: 3500,
        breath: 5000,
        // Legacy aliases
        focus: 150,
        interaction: 200,
        feedback: 300,
        transition: 450,
    },

    // Stagger delays for graceful choreography
    stagger: {
        micro: 40,
        small: 60,
        medium: 100,
        large: 150,
    },

    // Spring configs - natural, organic feel
    spring: {
        // Quick but soft
        snappy: { damping: 22, stiffness: 250, mass: 0.8 },
        // Gentle settle
        gentle: { damping: 18, stiffness: 120, mass: 1 },
        // Slow, heavy presence
        slow: { damping: 24, stiffness: 70, mass: 1.2 },
        // Bouncy for playful moments
        bouncy: { damping: 12, stiffness: 180, mass: 0.9 },
    },

    // Easing - smooth curves
    easing: {
        // Entries - soft deceleration
        enter: Easing.bezier(0.25, 0.1, 0.25, 1),
        // Exits - gentle acceleration
        exit: Easing.bezier(0.4, 0, 0.2, 1),
        // Standard ease
        standard: Easing.bezier(0.4, 0, 0.2, 1),
        // Ambient loops
        ambient: Easing.inOut(Easing.quad),
        // Breathing/pulsing
        breath: Easing.inOut(Easing.sin),
    },

    // Opacity scale
    opacity: {
        invisible: 0,
        ghost: 0.08,
        faint: 0.15,
        subtle: 0.35,
        medium: 0.55,
        strong: 0.75,
        full: 1,
    },

    // Scale values - more subtle
    scale: {
        hidden: 0,
        compressed: 0.92,
        resting: 1,
        hover: 1.015,
        pressed: 0.98,
        expanded: 1.04,
        emphasis: 1.08,
    },
} as const;

/**
 * Entry choreography delays
 * Use these to stagger element entrances
 */
export const EntrySequence = {
    header: 0,
    status: Motion.stagger.small,
    visualizer: Motion.stagger.medium * 2,
    controls: Motion.stagger.medium * 3,
    footer: Motion.stagger.medium * 4,
} as const;

/**
 * View transition configuration
 */
export const ViewTransition = {
    duration: Motion.duration.slow,
    crossfade: true,
} as const;

// Legacy aliases for backward compatibility
export const LegacyDuration = {
    focus: Motion.duration.micro,
    interaction: Motion.duration.fast,
    feedback: Motion.duration.normal,
    transition: Motion.duration.slow,
} as const;

import { Easing } from 'react-native-reanimated';

/**
 * Motion Hierarchy
 *
 * Inspired by Emil Kowalski's motion grammar:
 * - Background: Slow, ambient, barely noticeable
 * - Ambient: Medium-slow, creates atmosphere
 * - Interaction: Quick, responsive feedback
 * - Focus: Instant, micro-interactions
 */

export const Motion = {
    // Hierarchy durations (ms)
    duration: {
        instant: 80,
        focus: 120,
        interaction: 200,
        feedback: 300,
        transition: 400,
        ambient: 2400,
        background: 4000,
        breath: 6000,
    },

    // Stagger delays for choreography
    stagger: {
        micro: 30,
        small: 50,
        medium: 80,
        large: 120,
    },

    // Spring configs - reserved for rare cases where physics is truly needed
    // Prefer withTiming with easing for most animations
    spring: {
        // Critically damped - no overshoot
        snappy: { damping: 20, stiffness: 300 },
        gentle: { damping: 20, stiffness: 150 },
        slow: { damping: 25, stiffness: 80 },
    },

    // Easing presets - all smooth, no overshoot
    easing: {
        // For entries - decelerates into place
        enter: Easing.out(Easing.cubic),
        // For exits - accelerates away
        exit: Easing.in(Easing.cubic),
        // For continuous ambient loops
        ambient: Easing.inOut(Easing.quad),
        // For subtle breathing/pulsing
        breath: Easing.inOut(Easing.sin),
    },

    // Opacity values
    opacity: {
        invisible: 0,
        ghost: 0.1,
        faint: 0.2,
        subtle: 0.4,
        medium: 0.6,
        strong: 0.8,
        full: 1,
    },

    // Scale values
    scale: {
        hidden: 0,
        compressed: 0.85,
        resting: 1,
        hover: 1.02,
        pressed: 0.96,
        expanded: 1.08,
        emphasis: 1.15,
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
    duration: Motion.duration.transition,
    crossfade: true,
} as const;

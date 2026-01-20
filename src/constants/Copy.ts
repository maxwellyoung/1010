/**
 * Copy System
 *
 * Inspired by Jordan Singer's product poetry:
 * - Warm, not clinical
 * - Human, not technical
 * - Evocative, not descriptive
 */

export const Copy = {
    // App identity
    brand: {
        name: '1010 NETWORK',
        tagline: 'The network remembers you here.',
    },

    // Status messages
    status: {
        active: 'ACTIVE',
        activating: (days: number) => `AWAKENING IN ${days} DAYS`,
        remote: 'DISTANT SIGNAL',
    },

    // Near field / proximity
    nearField: {
        label: 'NEAR FIELD',
        scanning: 'listening for others nearby',
        linked: (id: string) => `linked with ${id.slice(0, 6)}...`,
        searching: 'reaching through the noise',
        distance: (meters: number) => `${meters.toFixed(1)}m apart`,
        resonance: (percent: number) => {
            if (percent >= 80) return 'strong resonance';
            if (percent >= 50) return 'growing resonance';
            return 'faint resonance';
        },
        signature: '[1010] PRESENCE THREAD',
    },

    // Signal strength
    signal: {
        strong: 'SIGNAL CLEAR',
        weak: 'signal fading',
        lost: 'signal lost',
    },

    // Breath / density
    breath: {
        label: 'BREATH',
        dawn: 'DAWN QUIET',
        morning: 'MORNING STIR',
        midday: 'NOON PULSE',
        afternoon: 'AFTERNOON DRIFT',
        evening: 'EVENING GATHER',
        night: 'NIGHT HUSH',
        lateNight: 'DEEP QUIET',
    },

    // Window moments
    window: {
        open: (minutes: number) => `WINDOW OPEN  ${minutes}M`,
        closing: 'window closing',
        missed: 'window passed',
    },

    // Quiet ritual
    ritual: {
        label: 'QUIET RITUAL',
        hold: 'hold still',
        signature: '[1010] STILLNESS LINK',
        phrases: [
            'The city pauses with you.',
            'Two signals, one breath.',
            'Stillness makes the link.',
            'The air thins between you.',
            'A moment, held together.',
        ],
    },

    // Echo messages
    echo: {
        label: 'ECHO RECEIVED',
        messages: [
            'Someone was here.',
            'A trace remains.',
            'The network remembers.',
            'You crossed a path.',
            'An old signal, resurfacing.',
        ],
    },

    // View modes
    viewMode: {
        signal: 'SIGNAL FIELD',
        trails: 'TRAIL RESONANCE',
        hint: 'tap to shift view',
        expandHint: 'hold to expand',
    },

    // Participants
    participants: {
        label: 'PRESENT',
        loading: '--',
    },

    // Footer messages
    footer: {
        inside: 'The network strengthens around you.',
        outside: 'Enter 1010 to deepen the signal.',
        welcome: 'You are remembered here.',
    },

    // Empty states
    empty: {
        noTrails: 'no paths yet',
        noEncounters: 'waiting for a familiar signal',
        noWindows: 'windows appear when others are near',
    },

    // Errors
    error: {
        location: 'Location unavailable',
        network: 'Network unreachable',
        proximity: 'Proximity unavailable',
    },

    // First launch tutorial
    tutorial: {
        steps: [
            {
                glyph: '◎',
                title: 'YOU ARE HERE',
                body: 'A signal in the field.\nThe network sees you.',
            },
            {
                glyph: '◇',
                title: 'ECHOES REMAIN',
                body: 'Others pass through.\nTheir traces linger.',
            },
            {
                glyph: '□',
                title: 'WINDOWS OPEN',
                body: 'When signals align,\na moment forms.',
            },
            {
                glyph: '○',
                title: 'STILLNESS CONNECTS',
                body: 'Hold your ground.\nThe ritual completes itself.',
            },
            {
                glyph: '▣',
                title: 'THE FIELD REMEMBERS',
                body: 'Return often.\nThe network deepens.',
            },
        ],
        hints: {
            continue: 'tap to continue',
            enter: 'tap to enter',
        },
    },
} as const;

/**
 * Format a peer ID for display
 * Shows first 6 chars to maintain anonymity while being recognizable
 */
export const formatPeerId = (id: string): string => {
    if (id.length <= 6) return id;
    return `${id.slice(0, 6)}...`;
};

/**
 * Get time-appropriate breath label
 */
export const getBreathLabel = (hour: number): string => {
    if (hour >= 5 && hour < 7) return Copy.breath.dawn;
    if (hour >= 7 && hour < 11) return Copy.breath.morning;
    if (hour >= 11 && hour < 14) return Copy.breath.midday;
    if (hour >= 14 && hour < 17) return Copy.breath.afternoon;
    if (hour >= 17 && hour < 21) return Copy.breath.evening;
    if (hour >= 21 || hour < 1) return Copy.breath.night;
    return Copy.breath.lateNight;
};

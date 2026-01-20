/**
 * Glyph System
 *
 * Inspired by Susan Kare's symbolic micro-iconography:
 * - Each symbol has semantic meaning
 * - Consistent sizing and spacing
 * - Legible at small scales
 */

export const Glyphs = {
    // Presence indicators
    presence: {
        active: '+',      // Active presence
        ghost: 'o',       // Past presence / ghost ping
        echo: '~',        // Echo / ripple
    },

    // Portal / window
    portal: {
        open: '[]',       // Window moment open
        closed: '][',     // Window closed
        forming: '<>',    // Window forming
    },

    // Connection
    connection: {
        linked: '::',     // Two nodes linked
        seeking: '..',    // Searching for connection
        thread: '--',     // Resonance thread
    },

    // Direction / movement
    movement: {
        up: '^',          // Moving / ascending
        node: '*',        // Point of interest
        path: '/\\',      // Trail / path marker
    },

    // Status
    status: {
        on: String.fromCharCode(0x25CF),    // Filled circle
        off: String.fromCharCode(0x25CB),   // Empty circle
        partial: String.fromCharCode(0x25D0), // Half circle
        pulse: String.fromCharCode(0x25C9),  // Fisheye
    },

    // UI
    ui: {
        expand: '[ ]',    // Expand / focus
        collapse: '[x]',  // Collapse / close
        menu: ':::',      // Menu / options
        back: '<-',       // Back / return
        share: '^>',      // Share / send out
    },
} as const;

/**
 * Glyph sets for random selection
 */
export const GlyphSets = {
    // Ambient glyphs that appear in the signal field
    ambient: [
        Glyphs.presence.active,
        Glyphs.portal.forming,
        Glyphs.connection.thread,
        Glyphs.movement.node,
        Glyphs.presence.echo,
        Glyphs.connection.linked,
    ],

    // Portal-related glyphs
    portal: [
        Glyphs.portal.forming,
        Glyphs.portal.open,
        Glyphs.connection.thread,
    ],

    // Connection glyphs
    connection: [
        Glyphs.connection.linked,
        Glyphs.connection.thread,
        Glyphs.presence.active,
    ],
} as const;

/**
 * Get a random glyph from a set
 */
export const getRandomGlyph = (set: keyof typeof GlyphSets): string => {
    const glyphs = GlyphSets[set];
    return glyphs[Math.floor(Math.random() * glyphs.length)];
};

/**
 * Glyph meanings for documentation
 */
export const GlyphMeanings: Record<string, string> = {
    '+': 'Active presence in the network',
    'o': 'Ghost ping - someone was here recently',
    '~': 'Echo - a trace of past encounter',
    '[]': 'Window moment - opportunity for connection',
    '<>': 'Portal forming - window opening soon',
    '::': 'Two signals linked together',
    '--': 'Resonance thread connecting encounters',
    '^': 'Movement or ascending signal',
    '*': 'Point of interest or activity',
    '/\\': 'Trail or path marker',
};

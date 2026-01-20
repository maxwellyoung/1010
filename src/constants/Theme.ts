export const Colors = {
    background: '#050505', // Deep void
    surface: '#111111', // Subtle separation
    surfaceHighlight: '#1A1A1A',
    surfaceElevated: '#222222', // Cards, modals
    surfacePressed: '#0A0A0A', // Pressed states

    // Transit / Terminal Palette
    primary: '#E0E0E0', // High contrast text (Off-white)
    secondary: '#888888', // Mid-grey for structure
    tertiary: '#666666', // Improved contrast (4.5:1 ratio)
    quaternary: '#444444', // Very subtle, decorative only

    // Accents (Soft Futurism)
    accent: '#33FF00', // "Bio-digital" green (rare use)
    accentDim: 'rgba(51, 255, 0, 0.15)', // Subtle accent glow
    warning: '#FFAA00', // Amber
    warningDim: 'rgba(255, 170, 0, 0.15)',
    error: '#FF4444',

    // Translucency
    overlay: 'rgba(5, 5, 5, 0.9)',
    overlayLight: 'rgba(5, 5, 5, 0.7)',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassStrong: 'rgba(255, 255, 255, 0.1)',
};

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 64, // More dramatic spacing
    xxxl: 96,
};

export const Typography = {
    mono: 'SpaceMono', // Ensure this is loaded
    size: {
        xs: 11,
        sm: 13,
        base: 15, // Body text
        md: 17, // Emphasis
        lg: 20, // Section headers
        xl: 28, // Page titles
        xxl: 40, // Hero text
        jumbo: 72, // Full-screen glyphs
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 1,
        wider: 2,
        widest: 4, // Glyphs, labels
    },
};

export const Layout = {
    radius: {
        sm: 2,
        md: 4,
        lg: 12,
        full: 9999,
    },
};

export const Colors = {
    background: '#050505', // Deep void
    surface: '#111111', // Subtle separation
    surfaceHighlight: '#1A1A1A',

    // Transit / Terminal Palette
    primary: '#E0E0E0', // High contrast text (Off-white)
    secondary: '#888888', // Mid-grey for structure
    tertiary: '#444444', // Dark grey for inactive elements

    // Accents (Soft Futurism)
    accent: '#33FF00', // "Bio-digital" green (rare use)
    warning: '#FFAA00', // Amber
    error: '#FF4444',

    // Translucency
    overlay: 'rgba(5, 5, 5, 0.9)',
    glass: 'rgba(255, 255, 255, 0.05)',
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
        md: 15,
        lg: 20,
        xl: 32,
        xxl: 48,
        jumbo: 80,
    },
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 1,
        wider: 2,
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

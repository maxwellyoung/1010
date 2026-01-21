export const Colors = {
    // Refined dark palette - warm undertones
    background: '#0A0A0A', // Soft black
    surface: '#141414', // Subtle warmth
    surfaceHighlight: '#1E1E1E',
    surfaceElevated: '#262626', // Cards, modals
    surfacePressed: '#0F0F0F', // Pressed states

    // Text hierarchy - warmer grays
    primary: '#F5F5F5', // Near-white, readable
    secondary: '#A3A3A3', // Warm mid-gray
    tertiary: '#737373', // Supporting text
    quaternary: '#525252', // Decorative, hints

    // Accent - refined teal (presence/connection feel)
    accent: '#2DD4BF', // Soft teal - approachable, not sci-fi
    accentDim: 'rgba(45, 212, 191, 0.12)',
    accentMuted: 'rgba(45, 212, 191, 0.6)',
    warning: '#F59E0B', // Warm amber
    warningDim: 'rgba(245, 158, 11, 0.12)',
    error: '#EF4444',

    // Translucency - softer overlays
    overlay: 'rgba(10, 10, 10, 0.92)',
    overlayLight: 'rgba(10, 10, 10, 0.75)',
    glass: 'rgba(255, 255, 255, 0.04)',
    glassStrong: 'rgba(255, 255, 255, 0.08)',
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
    // Primary font for UI
    sans: 'Inter',
    sansMedium: 'Inter-Medium',
    sansSemiBold: 'Inter-SemiBold',
    mono: 'SpaceMono', // Reserved for data/numbers only
    size: {
        xs: 12,
        sm: 14,
        base: 16, // Body text
        md: 18, // Emphasis
        lg: 22, // Section headers
        xl: 32, // Page titles
        xxl: 48, // Hero text
        jumbo: 80, // Full-screen moments
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
    weight: {
        normal: '400' as const,
        medium: '500' as const,
        semibold: '600' as const,
    },
    letterSpacing: {
        tight: -0.3,
        normal: 0,
        wide: 0.5,
        wider: 1,
        label: 1.5, // Labels, badges
    },
};

export const Layout = {
    radius: {
        sm: 6,
        md: 10,
        lg: 16,
        xl: 24,
        full: 9999,
    },
};

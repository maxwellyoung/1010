# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Network 1010 is a hyper-local presence network for Auckland CBD's 1010 postcode. It creates ambient awareness of nearby participants without messaging or profiles—only presence signals that decay over time.

## Commands

```bash
npm install          # Install dependencies
npm run start        # Start Expo dev server
npm run ios          # Run on iOS simulator (requires native build)
npx expo run:ios     # Build and run iOS native app
npm test             # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run lint         # TypeScript type checking
```

## Architecture

### Core Data Flow

1. **LocationContext** (`src/context/LocationContext.tsx`) - Central location provider that determines if user is inside the network bounds
2. **NetworkZones** (`src/config/NetworkZones.ts`) - Abstracted city bounds for multi-zone support
3. **Supabase** - Backend for profiles, pings, presence signals, encounters, trails, and window moments
4. **Native Proximity Module** (`src/native/Proximity.ts`) - iOS-only MultipeerConnectivity + NearbyInteraction
5. **Anonymous Auth** - Initialized on app start via `ensureAnonymousSession()`, persisted with AsyncStorage
6. **Sentry** (`src/lib/sentry.ts`) - Error tracking and performance monitoring

### Screen Structure (Expo Router)

- `app/index.tsx` - Entry point, routes to onboarding or network
- `app/network.tsx` - Main network view with signal/trail visualization
- `app/onboarding/` - Three-step flow with glyph reveal animation
- `app/walks.tsx` - Pattern walk selection and creator
- `app/out-of-range.tsx` - Shown when outside network bounds

### Hook Architecture

Hooks in `src/hooks/` orchestrate all ambient behaviors:

**Core Signal Hooks**
- `useGhostPings`, `usePassingEchoes`, `useSignalGlyphs` - Ephemeral visual elements
- `useResonanceMemory` - Familiar signal detection after multiple encounters
- `useTemporalLayers` - View network at different times (hour/day/week)

**Proximity & Encounter Hooks**
- `useProximitySession` - Device-to-device detection with encounter tracking
- `useQuietRitual` - 4.2s sustained proximity trigger
- `useWindowMoments` - 7-minute windows when 2+ peers nearby

**Utility Hooks**
- `useAnimationTicker` - Unified interval manager
- `useSoundscape` - Audio with haptic fallbacks
- `usePatternWalkCreator` - User-defined walking routes
- `useEntryChoreography` - Staggered entrance animations

### Component Layers

The network screen stacks multiple overlay components (all memoized):
1. `MapBackdrop` - Monochrome base map (MapLibre)
2. `SignalMap` / `TrailVisualizer` - Primary visualization
3. `DriftMarker` - User position (only green accent)
4. `AmbientOverlay` - Ghost pings, echoes, glyphs
5. `FamiliarSignalOverlay` - Appears for repeated encounters
6. `TemporalSlider` - Time travel through network history
7. `WalkEditor` - Draw custom pattern walks

### Database Schema

Tables in `supabase/schema.sql`:
- `profiles` - User identity (anonymous or authenticated)
- `pings` - Presence heartbeats for stats
- `presence_signals` - Real-time location for heat map (15-min TTL)
- `encounters` - Peer proximity events with duration/resonance
- `trails` - Movement history by session
- `window_moments` - Shared serendipity events

Views:
- `network_stats` - Aggregated participant counts and density
- `presence_density` - Heat map data by tile
- `encounter_frequency` - Resonance thread data

### Design System

See `PATTERNS.md` for the complete pattern language. Key constants in `src/constants/`:

- **Theme.ts** - Colors, spacing, typography (SpaceMono only)
- **Motion.ts** - Animation durations by layer (background 4000ms → focus 120ms)
- **Glyphs.ts** - Abstract symbols used throughout the field
- **Copy.ts** - All user-facing text

#### Color Palette
- **Surfaces**: background (#050505), surface (#111111), surfaceHighlight (#1A1A1A), surfaceElevated (#222222)
- **Text**: primary (#E0E0E0), secondary (#888888), tertiary (#666666), quaternary (#444444)
- **Accents**: accent (#33FF00 - rare use), accentDim, warning (#FFAA00), warningDim, error

#### Typography Scale
`xs (11) → sm (13) → base (15) → md (17) → lg (20) → xl (28) → xxl (40) → jumbo (72)`

#### Animation Guidelines
All animations use react-native-reanimated. Use `interpolateColor()` for animated colors, not string templates.

### Multi-Zone Support

`src/config/NetworkZones.ts` defines network zones with:
- Geographic bounds and center coordinates
- Zone identification (postcode, city, country)
- Active/inactive status
- Helper functions: `isInsideZone()`, `findZonesAtLocation()`, `coordsToNormalized()`

Current zones:
- Auckland CBD (1010) - Active
- Wellington CBD (6011) - Planned
- Melbourne CBD (3000) - Planned

### Native Module

`src/native/Proximity.ts` wraps the iOS ProximityModule:
- `start(options)` / `stop()` - Session lifecycle
- `sendMessage(payload)` - Peer communication
- `triggerHaptic(style)` - Haptic feedback
- Events: `onPeerFound`, `onPeerLost`, `onNearbyUpdate`, `onSessionState`, `onError`

## Configuration

### Supabase
```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key"
    }
  }
}
```

### Sentry (optional)
```json
{
  "expo": {
    "extra": {
      "sentryDsn": "https://your-dsn@sentry.io/project"
    }
  }
}
```

## Key Behaviors

- **Quiet Ritual**: 4.2s sustained proximity (<1.2m, >60% resonance) triggers shared moment
- **Window Moments**: 7-minute windows when 2+ peers nearby, 30-minute minimum interval
- **City Breath**: Ambient pulsing (3200ms busy → 9000ms quiet) based on density
- **Ghost Pings**: 15-minute decay, fade with age
- **Familiar Signals**: Memory levels (passing → familiar → resonant) after 2/4/7+ encounters
- **Temporal Layers**: View network state from past hour/day/week

## Testing

Unit tests in `src/__tests__/`. Run with `npm test`.

Tests cover:
- Network bounds checking
- Resonance calculation
- Ritual trigger conditions
- City breath period
- Ghost ping aging
- Coordinate conversion
- Window moment timing
- Encounter duration

## Error Handling

- `ErrorBoundary` component wraps app with graceful fallback
- Sentry captures production errors (configure DSN to enable)
- All async operations have try-catch with console logging
- Supabase failures are non-blocking (app works offline)

## Performance Notes

- All overlay components memoized with `React.memo`
- `useAnimationTicker` consolidates intervals (500ms base tick)
- Soundscape uses haptic fallbacks when audio unavailable
- Heat map queries throttled (30s interval)
- Trail tracking has 5m movement threshold

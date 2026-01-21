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
npx convex dev       # Start Convex dev server (connects to cloud)
npx convex deploy    # Deploy Convex functions to production
```

## Architecture

### Core Data Flow

1. **LocationContext** (`src/context/LocationContext.tsx`) - Central location provider that determines if user is inside the network bounds
2. **NetworkZones** (`src/config/NetworkZones.ts`) - Abstracted city bounds for multi-zone support
3. **Convex** (`convex/`) - Real-time backend for pings, presence signals, encounters, trails, and window moments
4. **Native Proximity Module** (`src/native/Proximity.ts`) - iOS-only MultipeerConnectivity + NearbyInteraction
5. **Device ID Auth** - Generated on first launch, stored in AsyncStorage (privacy-first anonymous identity)
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

**Real-time Hooks**
- `useSignals` - Ghost pings and window moment broadcasts
- `useDensity` - Cell-based density scoring
- `usePings` - Presence heartbeats and heat map

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

### Database Schema (Convex)

Tables defined in `convex/schema.ts`:
- `pings` - Presence heartbeats for stats
- `presenceSignals` - Real-time location for heat map (15-min TTL)
- `encounters` - Peer proximity events with duration/resonance
- `trails` - Movement history by session (7-day retention)
- `windowMoments` - Shared serendipity events
- `patternWalks` - User-created walking routes
- `broadcasts` - Ephemeral ghost pings, window announcements, density pings
- `presence` - Online heartbeats for presence count

Queries in `convex/queries/`:
- `networkStats.ts` - Aggregated participant counts and density
- `presence.ts` - Nearby presence with geo filter
- `encounters.ts` - Encounter frequency by peer
- `temporal.ts` - Historic trails, encounters, window moments
- `broadcasts.ts` - Real-time ghost pings, window moments, density

Mutations in `convex/mutations/`:
- `pings.ts` - Insert pings and presence signals
- `trails.ts` - Insert trail points
- `encounters.ts` - Insert encounters
- `windowMoments.ts` - Insert window moments
- `patternWalks.ts` - Create/share pattern walks
- `broadcasts.ts` - Send ghost pings, window broadcasts, density pings
- `presence.ts` - Update presence heartbeat

### Design System

Refined, approachable aesthetic inspired by midday.ai. Key constants in `src/constants/`:

- **Theme.ts** - Colors, spacing, typography (Inter + SpaceMono for data)
- **Motion.ts** - Smooth, organic animations
- **Glyphs.ts** - Abstract symbols used throughout the field
- **Copy.ts** - All user-facing text

#### Color Palette
- **Surfaces**: background (#0A0A0A), surface (#141414), surfaceHighlight (#1E1E1E), surfaceElevated (#262626)
- **Text**: primary (#F5F5F5), secondary (#A3A3A3), tertiary (#737373), quaternary (#525252)
- **Accents**: accent (#2DD4BF - soft teal), accentDim, warning (#F59E0B), warningDim, error

#### Typography
- **Fonts**: Inter (UI), Inter-Medium, Inter-SemiBold, SpaceMono (data only)
- **Scale**: `xs (12) → sm (14) → base (16) → md (18) → lg (22) → xl (32) → xxl (48) → jumbo (80)`

#### Layout
- **Border radius**: sm (6), md (10), lg (16), xl (24), full (9999)
- **Spacing**: xs (4), sm (8), md (16), lg (24), xl (32), xxl (64)

#### Animation Guidelines
All animations use react-native-reanimated with smooth, organic timing. Use `interpolateColor()` for animated colors.

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

### Convex
Set the Convex URL in your environment or app.json:
```json
{
  "expo": {
    "extra": {
      "convexUrl": "https://your-deployment.convex.cloud"
    }
  }
}
```

Or use environment variable:
```bash
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
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
- Convex failures are non-blocking (app works offline with cached data)

## Performance Notes

- All overlay components memoized with `React.memo`
- `useAnimationTicker` consolidates intervals (500ms base tick)
- Soundscape uses haptic fallbacks when audio unavailable
- Convex queries auto-update reactively (no polling needed)
- Trail tracking has 5m movement threshold
- Scheduled cleanup functions remove expired data (presence signals, broadcasts, old trails)

## Convex Patterns

### Using Queries
```typescript
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

// Queries auto-update when data changes
const stats = useQuery(api.queries.networkStats.getNetworkStats);

// Skip query conditionally
const presence = useQuery(
  api.queries.presence.getNearbyPresence,
  isConfigured ? { lat, lng, radiusKm: 0.5 } : 'skip'
);
```

### Using Mutations
```typescript
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const sendPing = useMutation(api.mutations.pings.sendPing);

// Call mutation
await sendPing({
  deviceId,
  postcode: '1010',
  lat: location.coords.latitude,
  lng: location.coords.longitude,
  source: 'app',
});
```

### Device ID Pattern
```typescript
import { getDeviceId, isConvexConfigured } from '../lib/convex';

// Get device ID (cached after first call)
const deviceId = await getDeviceId();
```

## Convex Rules

### Function Syntax
Always use the new function syntax with `args`, `returns`, and `handler`:
```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const myQuery = query({
  args: { name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    return "Hello " + args.name;
  },
});
```

### Return Validators
- **Always include** `returns` validator for all functions
- Use `v.null()` when a function returns nothing
- Use `v.any()` only when the return type is truly dynamic

### Function Registration
- Use `query`, `mutation`, `action` for public functions
- Use `internalQuery`, `internalMutation`, `internalAction` for private functions
- Internal functions are only callable from other Convex functions

### Query Guidelines
- Use `withIndex()` instead of `filter()` when possible
- Define indexes in schema for commonly queried fields
- Use `.collect()` to get all results, `.take(n)` for limited results
- Use `.first()` or `.unique()` for single document queries

### Schema Guidelines
- Define schema in `convex/schema.ts`
- System fields `_id` and `_creationTime` are automatic
- Index names should include all fields: `by_field1_and_field2`

### Validator Types
| Type | Validator | Example |
|------|-----------|---------|
| Id | `v.id(tableName)` | `v.id("users")` |
| Null | `v.null()` | `null` |
| Number | `v.number()` | `3.14` |
| Boolean | `v.boolean()` | `true` |
| String | `v.string()` | `"hello"` |
| Array | `v.array(values)` | `v.array(v.string())` |
| Object | `v.object({...})` | `v.object({ name: v.string() })` |
| Optional | `v.optional(type)` | `v.optional(v.string())` |
| Union | `v.union(a, b)` | `v.union(v.string(), v.null())` |
| Literal | `v.literal(value)` | `v.literal("active")` |

### Cron Jobs
```typescript
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("job name", { minutes: 5 }, internal.cleanup.myJob, {});
export default crons;
```

### URLs
- Production: https://ideal-mandrill-244.convex.cloud
- Development: https://zany-spaniel-671.convex.cloud

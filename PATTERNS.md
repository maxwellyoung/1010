# 1010 Network: Pattern Language

> A living document describing the patterns that shape the 1010 experience.
> Inspired by Christopher Alexander's "A Pattern Language."

---

## Core Concepts

### The Network
The 1010 Network is a hyperlocal presence system bound to a specific geographic area (the 1010 postcode in Auckland CBD). It creates a shared awareness layer for people physically present in the same space.

### Presence, Not Communication
This is not a messaging app. There are no profiles to browse, no messages to send. Only presence—the awareness that others are here, have been here, or are becoming aware of you.

### Time as Material
The network treats time as a design material. Signals decay. Trails fade. Windows open and close. The ephemerality is the point.

---

## Pattern Catalog

### 1. City Breath

**Context:** Users need ambient awareness of network activity without explicit metrics.

**Problem:** How do we communicate the "aliveness" of the network without numbers or graphs?

**Solution:** A subtle pulsing halo that breathes at a rate determined by:
- Time of day (slower at night, faster at midday)
- Current density of participants
- Recent encounter activity

The breath is felt, not seen. Users should notice when it's absent, not when it's present.

**Implementation:**
- `useCityBreath` hook
- `CityBreathHalo` component
- Period ranges from 3200ms (busy) to 9000ms (quiet)

---

### 2. Quiet Ritual

**Context:** Two users are physically near each other (within 1.2 meters) with strong signal resonance (>60%).

**Problem:** How do we create a meaningful moment of connection without forcing interaction?

**Solution:** After 4.2 seconds of sustained proximity, a "quiet ritual" is triggered:
1. Haptic escalation (light → medium → heavy) during approach
2. Both devices display a shared phrase
3. The moment is held for 7 seconds
4. No action required from users

**Phrases rotate from a curated set:**
- "The city pauses with you."
- "Two signals, one breath."
- "Stillness makes the link."

**Why 4.2 seconds?** Long enough to be intentional, short enough to feel natural. The haptic buildup creates anticipation.

**Implementation:**
- `useQuietRitual` hook
- `RitualOverlay` component
- Proximity detection via native module

---

### 3. Window Moments

**Context:** Multiple users are present in the network simultaneously.

**Problem:** How do we create opportunities for serendipitous awareness?

**Solution:** When 2+ peers are nearby, a "window" may open:
- A 7-minute window appears at a random position
- All nearby users see the same window
- The window pulses and eventually closes
- No action is possible—only awareness

Windows are rare. They should feel like discovering a gap in reality.

**Implementation:**
- `useWindowMoments` hook
- `WindowMomentOverlay` component
- Position synchronized via Supabase realtime

---

### 4. Ghost Pings

**Context:** Users want to know others have been here, even if they're gone.

**Problem:** How do we show historical presence without creating a permanent record?

**Solution:** Ghost pings appear as faint, pulsing dots:
- Show approximate location of recent presence (last 15 minutes)
- Age displayed in minutes ("5m", "12m")
- Fade and disappear over time
- No identifying information

**Visual treatment:**
- Subtle border, no fill
- Slow pulse (2200ms cycle)
- Opacity between 0.15 and 0.4

**Implementation:**
- `useGhostPings` hook
- `GhostPingMark` component within `AmbientOverlay`

---

### 5. Resonance Threads

**Context:** Users have encountered the same person multiple times.

**Problem:** How do we acknowledge repeated encounters without revealing identity?

**Solution:** Thin lines ("threads") connect points where the same two users have crossed paths:
- Threads only appear after 2+ encounters
- Lines are subtle, barely visible
- Small circles mark encounter points
- Creates a personal topology of connection

**Implementation:**
- `useResonanceThreads` hook
- `ResonanceThreadsOverlay` component

---

### 6. Passing Echoes

**Context:** An encounter just happened.

**Problem:** How do we mark the moment of connection?

**Solution:** When proximity is detected:
- A ripple expands from the encounter point
- Fades over 9 seconds (the echo's "time to live")
- Multiple echoes can exist simultaneously
- Creates a visual history of the encounter

**Implementation:**
- `usePassingEchoes` hook
- `PassingEchoMark` component within `AmbientOverlay`

---

### 7. Signal Glyphs

**Context:** The signal field needs ambient texture.

**Problem:** How do we make the field feel alive without being distracting?

**Solution:** Abstract glyphs appear and fade throughout the field:
- Symbols: `+`, `[]`, `<>`, `/\`, `--`, `::`, `o`, `x`, `^`, `~`
- Each has semantic meaning (see Glyphs.ts)
- Appear more frequently when inside the network
- Slow fade-in (800ms), gradual fade-out

**Implementation:**
- `useSignalGlyphs` hook
- `GlyphMark` component within `AmbientOverlay`

---

### 8. Trail Resonance

**Context:** Users move through the network over time.

**Problem:** How do we visualize movement history?

**Solution:** The trail view shows:
- Current trail (last 30 minutes of movement)
- Historic trails (faded, from previous sessions)
- "Resonating" state when current path overlaps historic
- Pattern walks (predefined routes through the city)

Trails decay. Yesterday's path is fainter than today's.

**Implementation:**
- `useTrails` hook
- `TrailVisualizer` component
- `PatternWalkOverlay` for curated routes

---

### 9. View Mode Toggle

**Context:** The network has two modes of visualization.

**Problem:** How do we switch between signal and trail views?

**Solution:**
- Single tap toggles between modes
- Long press expands to full-screen focus view
- Crossfade transition (400ms) between modes
- Shared elements (map, drift marker) persist across modes

**Implementation:**
- `SignalVisualization` component with `crossfade` shared value
- `FocusOverlay` for expanded view

---

### 10. Drift Marker

**Context:** Users need to see their position in the field.

**Problem:** How do we represent "you" without creating ego?

**Solution:** A subtle orbital marker at the center:
- Green dot (the only accent color in the app)
- Gentle orbital movement (12-second period)
- Pulse that varies with signal strength
- Shadow/glow for depth

The marker drifts. You are not fixed. You are part of the flow.

**Implementation:**
- `DriftMarker` component
- Orbit radius: 6px, period: 12000ms

---

## Design Principles

### 1. Subtlety Over Notification
Never interrupt. Never alert. Everything fades in and out. Users discover, not receive.

### 2. Ambient Over Explicit
Prefer "the room feels different" over "3 users nearby." Communicate through atmosphere.

### 3. Decay Over Permanence
Everything fades. Nothing is stored forever. The network forgets.

### 4. Presence Over Identity
You are a signal, not a profile. Others are signals too. Names don't matter.

### 5. Stillness Over Action
The most meaningful interaction is no interaction—just being present together.

---

## Motion Hierarchy

```
Background (4000ms)  - City breath, radar rings
    ↓
Ambient (2400ms)     - Pulses, ghost pings, glyphs
    ↓
Transition (400ms)   - View changes, overlays
    ↓
Interaction (200ms)  - Button feedback, toggles
    ↓
Focus (120ms)        - Immediate response
```

Every animation belongs to a layer. Layers don't compete.

---

## Color Philosophy

```
Background: #050505  - The void
Surface:    #111111  - Subtle depth
Primary:    #E0E0E0  - Text, important elements
Secondary:  #888888  - Supporting text
Tertiary:   #444444  - Inactive, hints
Accent:     #33FF00  - RARE. Only for "you" marker.
Warning:    #FFAA00  - Outside network, windows
```

The accent color is sacred. It means "you are here." Nothing else uses it.

---

## Typography

One font: SpaceMono. One weight. Three sizes (xs, sm, md, lg).

Wide letter-spacing creates the terminal aesthetic. We are all nodes in a system.

---

## Future Patterns (Not Yet Implemented)

### SoundScape
- Low hum for city breath
- Soft chime for encounters
- Resonant tone for ritual
- Ambient noise bed that varies with density

### Temporal Layers
- View the network at different times (yesterday, last week)
- See your path overlay with historic paths
- Watch windows that opened in the past

### Network Memory
- The network remembers encounters
- After many encounters with the same signal, something changes
- "Familiar signal detected" without revealing identity

---

## Changelog

- **2024-01**: Initial pattern documentation
- **2024-02**: Added Quiet Ritual, Window Moments
- **2024-03**: Added Resonance Threads, Pattern Walks
- **2025-01**: Comprehensive rewrite, added motion hierarchy

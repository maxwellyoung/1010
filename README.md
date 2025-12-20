# network-1010

Hyper-local presence network with a monochrome, magical-realist UI. Built with Expo and React Native.

## Highlights

- Proximity sessions (MultipeerConnectivity + NearbyInteraction)
- Ambient layers: passing echoes, ghost pings, signal glyphs, resonance threads
- Window moments + quiet pairing ritual
- Pattern walks + trail resonance view
- Supabase presence + realtime ghost/window signals

## Structure

- `app/` Expo Router screens
- `src/components/` UI and overlays
- `src/hooks/` behavior + signal orchestration
- `src/native/` iOS proximity module
- `supabase/` local Supabase scaffolding

## Setup

1. `npm install`
2. `npx expo run:ios`

Useful scripts:

- `npm run start`
- `npm run ios`
- `npm run android`

## Configuration

Supabase credentials are read from `app.json` extras:

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

## Notes

- Safe-area spacing is handled per screen to keep layout clean on notched devices.
- The dev menu is only visible in dev builds (tap the red `DEV` badge).

## Docs

See `docs/ROADMAP.md` for planned work.

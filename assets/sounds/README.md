# Audio Assets

This folder should contain the following audio files for the soundscape layer:

## Required Files

| File | Duration | Description |
|------|----------|-------------|
| `breath.mp3` | 10-30s loop | Ambient city breath background. Subtle, low frequency hum. |
| `encounter.mp3` | 1-2s | Chime for proximity encounter. Light, subtle notification. |
| `ritual.mp3` | 3-4s | Tone for quiet ritual completion. Deeper, more resonant. |
| `window.mp3` | 2-3s | Sound when window moment opens. Ethereal, spacious. |
| `echo.mp3` | 1s | Echo detection ping. Quick, soft pulse. |
| `connect.mp3` | 1-2s | Connection established. Warm, welcoming. |
| `disconnect.mp3` | 1s | Signal lost. Fade out, dissolve. |

## Audio Guidelines

- **Format**: MP3, 128-192kbps
- **Volume**: Normalize to -12dB to -18dB (quiet, ambient)
- **Style**: Minimal, abstract, non-intrusive
- **Inspiration**: Brian Eno ambient, Alva Noto microsound

## Haptic Fallbacks

When audio files are not present, the app uses haptic feedback as a fallback:
- `encounter` → Light haptic
- `ritual` → Heavy haptic
- `window` → Medium haptic

## Implementation

Once files are added, uncomment the require statements in:
`src/hooks/useSoundscape.ts` (lines 48-54)

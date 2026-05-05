# StemLab Frontend

Expo React Native frontend for StemLab AI stem separation. Works on **Android** and **Web**.

## Tech Stack

- **Expo** (SDK 53)
- **React Native** + TypeScript
- **Zustand** — State management
- **Axios** — HTTP client
- **WebSocket** — Real-time job progress

## Setup

```bash
cd frontend
npm install
```

## Development

```bash
# Web (browser)
npx expo start --web

# Android (requires Android Studio / Expo Go)
npx expo start --android
```

## Production Build (Web)

```bash
npx expo export --platform web

# Serve the static build
npx serve dist -l 7500 -s
```

## Configuration

The API base URL is configured in `src/api/client.ts`:

```typescript
const API_BASE = __DEV__
  ? "http://localhost:7000" // Development
  : "http://100.94.82.99:7000"; // Production (Tailscale IP)
```

Update the production URL to match your Tailscale IP or domain.

## Features

- Upload any audio file (wav, mp3, flac, etc.)
- Configure stem count (2, 4, 6), quality (fast, standard, best), and mode (standard, vocals only, instrumental)
- Real-time progress via WebSocket
- Download separated stems directly to device
- MP3 or WAV export
- Dark theme UI

## Project Structure

```
src/
├── api/
│   └── client.ts          # Axios HTTP + WebSocket client
├── components/
│   ├── JobCard.tsx         # Job status card with download links
│   ├── ProgressBar.tsx     # Animated progress indicator
│   └── SettingsPanel.tsx   # Stem/quality/mode selector
├── hooks/
│   └── useJobProgress.ts  # WebSocket progress subscription
├── screens/
│   └── HomeScreen.tsx     # Main upload + job list screen
├── store/
│   └── jobStore.ts        # Zustand state management
└── types/
    └── index.ts           # TypeScript type definitions
```

## Systemd Service (Web)

```bash
# Build and restart
npx expo export --platform web && systemctl --user restart stemlab-frontend

# Check status
systemctl --user status stemlab-frontend
```

## Android Development

1. Install [Expo Go](https://expo.dev/go) on your Android device
2. Run `npx expo start`
3. Scan the QR code with Expo Go
4. Ensure your device and server are on the same network (or use Tailscale)

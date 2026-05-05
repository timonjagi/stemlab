# StemLab

**Professional-grade AI stem separation — now with a cross-platform API and mobile/web frontend.**

StemLab separates audio tracks into individual stems (Vocals, Drums, Bass, Other) using state-of-the-art AI models (Demucs and MDX-Net). Originally a Windows desktop app, this fork adds a **FastAPI backend** and **Expo React Native frontend** for cross-platform access via browser or mobile device.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────┐
│  Expo Frontend  │────▶│  FastAPI Backend  │────▶│   Demucs    │
│  (Android/Web)  │◀────│  :7000            │◀────│   + Torch   │
└─────────────────┘     └──────────────────┘     └─────────────┘
   Port 7500               REST + WebSocket          CPU/GPU
```

- **Backend** (`/backend`) — FastAPI server handling file uploads, job queueing, separation, and downloads with WebSocket progress
- **Frontend** (`/frontend`) — Expo React Native app targeting Android and Web
- **Core** (`/src`) — Original Demucs separation logic, PyQt6 dependency removed for headless operation
- **CLI** (`/stemlab.sh`, `/stemlab_cli.py`) — Command-line wrapper for direct usage

## Features

- **Cross-Platform**: Access from any device via Tailscale/network — Android app, mobile browser, or desktop
- **Real-Time Progress**: WebSocket-based progress updates during separation
- **Multiple Stem Modes**: 2-stem, 4-stem, 6-stem, vocals-only, instrumental
- **Quality Levels**: Fast, Standard, Best
- **Export Formats**: WAV (lossless) or MP3 (320kbps)
- **GPU Acceleration**: Auto-detects NVIDIA GPUs; falls back to CPU
- **Job Management**: Upload, track, download, and delete jobs via API
- **100% Local**: All processing on your machine — no data leaves your server

## Quick Start

### Backend

```bash
# Create virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
pip install demucs torch torchaudio soundfile pydub

# Start the API server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 7000
```

### Frontend (Web)

```bash
cd frontend
npm install
npx expo export --platform web

# Serve the built web app
npx serve dist -l 7500 -s
```

### Frontend (Android Dev)

```bash
cd frontend
npm install
npx expo start --android
```

### CLI (Headless)

```bash
# Activate the venv
source venv/bin/activate

# 2-stem separation (vocals + instrumental)
./stemlab.sh song.mp3 -s 2

# 4-stem, best quality, MP3 output
./stemlab.sh song.mp3 -q best -m

# Vocals only
./stemlab.sh song.mp3 --mode vocals_only
```

## API Reference

| Method   | Endpoint                             | Description                     |
| -------- | ------------------------------------ | ------------------------------- |
| `POST`   | `/api/jobs`                          | Upload audio + start separation |
| `GET`    | `/api/jobs`                          | List all jobs                   |
| `GET`    | `/api/jobs/{id}`                     | Get job status/progress         |
| `GET`    | `/api/jobs/{id}/download/{filename}` | Download a stem file            |
| `DELETE` | `/api/jobs/{id}`                     | Delete job and files            |
| `WS`     | `/ws/jobs/{id}`                      | Real-time progress updates      |
| `GET`    | `/api/health`                        | Health check (GPU status)       |

### Example: Upload and separate

```bash
curl -X POST http://localhost:7000/api/jobs \
  -F "file=@song.mp3" \
  -F "stem_count=2" \
  -F "quality=standard" \
  -F "mode=standard" \
  -F "export_mp3=false"
```

### Example: Check job status

```bash
curl http://localhost:7000/api/jobs/{job_id}
```

### Example: Download a stem

```bash
curl -O http://localhost:7000/api/jobs/{job_id}/download/vocals.wav
```

## Stem Modes

| Mode         | Stems                                     | Description               |
| ------------ | ----------------------------------------- | ------------------------- |
| 2-stem       | Vocals, Instrumental                      | Quick separation          |
| 4-stem       | Vocals, Drums, Bass, Other                | Standard separation       |
| 6-stem       | Vocals, Drums, Bass, Guitar, Piano, Other | Full separation           |
| Vocals Only  | Vocals (ultra-clean)                      | Demucs + MDX-Net ensemble |
| Instrumental | Instrumental                              | Backing track             |

## Requirements

- **Python**: 3.10+ (3.12 tested)
- **RAM**: 8GB minimum (16GB recommended)
- **GPU** (Optional): NVIDIA GPU with 4GB+ VRAM for faster processing
- **Node.js**: 18+ (for frontend development)
- **FFmpeg**: Required for MP3 export

## Deployment (systemd)

```bash
# Backend
systemctl --user start stemlab-backend
systemctl --user status stemlab-backend

# Frontend
systemctl --user start stemlab-frontend
systemctl --user status stemlab-frontend
```

## Remote Access via Tailscale

The backend binds to `0.0.0.0:7000` and frontend to `0.0.0.0:7500`, making them accessible from any device on your Tailscale network:

- **Web app**: `http://<tailscale-ip>:7500`
- **API**: `http://<tailscale-ip>:7000`

## Project Structure

```
stemlab/
├── backend/           # FastAPI backend
│   ├── main.py        # API server (upload, jobs, WebSocket, download)
│   └── requirements.txt
├── frontend/          # Expo React Native frontend
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/ # UI components
│   │   ├── hooks/     # WebSocket progress hook
│   │   ├── screens/   # App screens
│   │   ├── store/     # Zustand state management
│   │   └── types/     # TypeScript types
│   ├── App.tsx
│   └── app.json
├── src/               # Core separation logic
│   ├── core/
│   │   ├── splitter.py        # Demucs wrapper (PyQt6 removed)
│   │   ├── advanced_audio.py  # MDX-Net ensemble pipeline
│   │   └── gpu_utils.py      # GPU detection
│   └── utils/
│       └── logger.py
├── stemlab.sh         # CLI wrapper script
├── stemlab_cli.py     # CLI Python entry point
└── venv/              # Python virtual environment (gitignored)
```

## Credits

- **Demucs** by Meta Research
- **Audio Separator** (MDX-Net implementation)
- Original desktop UI by **Sunsets Acoustic** (PyQt6)

## License

See original repository for license information.

# StemLab Backend

FastAPI backend for AI stem separation, wrapping Demucs for headless operation.

## Setup

```bash
# From project root
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install demucs torch torchaudio soundfile pydub
```

## Run

```bash
source venv/bin/activate
python -m uvicorn backend.main:app --host 0.0.0.0 --port 7000
```

## API Endpoints

| Method   | Endpoint                             | Description                          |
| -------- | ------------------------------------ | ------------------------------------ |
| `POST`   | `/api/jobs`                          | Upload audio file + start separation |
| `GET`    | `/api/jobs`                          | List all jobs                        |
| `GET`    | `/api/jobs/{id}`                     | Get job status and progress          |
| `GET`    | `/api/jobs/{id}/download/{filename}` | Download a separated stem file       |
| `DELETE` | `/api/jobs/{id}`                     | Delete job and its files             |
| `WS`     | `/ws/jobs/{id}`                      | Real-time progress WebSocket         |
| `GET`    | `/api/health`                        | Health check with GPU status         |

## Upload Parameters

| Parameter    | Type   | Default    | Description                                     |
| ------------ | ------ | ---------- | ----------------------------------------------- |
| `file`       | File   | required   | Audio file (wav, mp3, flac, etc.)               |
| `stem_count` | int    | 4          | Number of stems: 2, 4, or 6                     |
| `quality`    | string | "standard" | Quality: "fast", "standard", "best"             |
| `mode`       | string | "standard" | Mode: "standard", "vocals_only", "instrumental" |
| `export_mp3` | bool   | false      | Export as MP3 320kbps instead of WAV            |

## WebSocket Progress

Connect to `ws://<host>:7000/ws/jobs/<job_id>` to receive real-time updates:

```json
{"progress": 50, "message": "Separating: 50%", "status": "processing"}
{"progress": 100, "message": "Done", "status": "completed"}
```

## Job Lifecycle

1. **Upload** → `POST /api/jobs` returns job ID
2. **Track** → Poll `GET /api/jobs/{id}` or connect WebSocket for real-time progress
3. **Download** → `GET /api/jobs/{id}/download/{filename}` for each output stem
4. **Delete** → `DELETE /api/jobs/{id}` to clean up files

## Systemd Service

```bash
systemctl --user start stemlab-backend
systemctl --user status stemlab-backend
journalctl --user -u stemlab-backend -f
```

## Environment

- Python 3.12
- demucs 4.0.1
- torch 2.11.0+cu130 (CPU mode if no GPU)
- FastAPI + uvicorn

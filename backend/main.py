import uuid
import os
import shutil
import asyncio
from enum import IntEnum, Enum
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "outputs")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

jobs: dict[str, "Job"] = {}


class Quality(IntEnum):
    fast = 0
    standard = 1
    best = 2


class StemCount(IntEnum):
    two = 2
    four = 4
    six = 6


class Mode(str, Enum):
    standard = "standard"
    vocals_only = "vocals_only"
    instrumental = "instrumental"


class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    completed = "completed"
    failed = "failed"


class SeparationRequest(BaseModel):
    stem_count: StemCount = StemCount.four
    quality: Quality = Quality.standard
    mode: Mode = Mode.standard
    export_mp3: bool = False
    keep_original: bool = True


class Job:
    def __init__(self, job_id: str, filename: str, input_path: str, options: dict):
        self.id = job_id
        self.filename = filename
        self.input_path = input_path
        self.options = options
        self.status: JobStatus = JobStatus.queued
        self.progress: int = 0
        self.message: str = "Queued"
        self.output_dir: Optional[str] = None
        self.output_files: list[str] = []
        self.error: Optional[str] = None
        self.subscribers: list[asyncio.Queue] = []

    async def update(self, progress: int, message: str, status: Optional[JobStatus] = None):
        self.progress = progress
        self.message = message
        if status:
            self.status = status
        for q in self.subscribers:
            await q.put({"progress": progress, "message": message, "status": self.status})


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="StemLab API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def run_separation(job: Job):
    import sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

    from src.core.splitter import separate_audio

    base_name = os.path.splitext(job.filename)[0]
    output_dir = os.path.join(OUTPUT_DIR, job.id, f"{base_name} - Stems")
    job.output_dir = output_dir

    job.status = JobStatus.processing
    job.message = "Processing..."

    try:
        separate_audio(
            input_file=job.input_path,
            output_dir=output_dir,
            stem_count=job.options["stem_count"],
            quality=job.options["quality"],
            export_zip=False,
            keep_original=job.options["keep_original"],
            export_mp3=job.options["export_mp3"],
            mode=job.options["mode"],
            dereverb=False,
            invert=False,
        )

        job.output_files = [
            f for f in os.listdir(output_dir)
            if os.path.isfile(os.path.join(output_dir, f))
        ]
        job.status = JobStatus.completed
        job.progress = 100
        job.message = "Done"

    except Exception as e:
        job.status = JobStatus.failed
        job.error = str(e)
        job.message = f"Failed: {e}"


@app.post("/api/jobs", response_model=dict)
async def create_job(
    file: UploadFile = File(...),
    stem_count: StemCount = StemCount.four,
    quality: Quality = Quality.standard,
    mode: Mode = Mode.standard,
    export_mp3: bool = False,
):
    job_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")

    with open(input_path, "wb") as f:
        content = await file.read()
        f.write(content)

    options = {
        "stem_count": int(stem_count),
        "quality": int(quality),
        "mode": mode.value if isinstance(mode, Mode) else mode,
        "export_mp3": export_mp3,
        "keep_original": True,
    }

    job = Job(job_id, file.filename, input_path, options)
    jobs[job_id] = job

    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, run_separation, job)

    return {"id": job_id, "filename": file.filename, "status": job.status}


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    job = jobs[job_id]
    return {
        "id": job.id,
        "filename": job.filename,
        "status": job.status,
        "progress": job.progress,
        "message": job.message,
        "output_files": job.output_files,
        "error": job.error,
    }


@app.get("/api/jobs")
async def list_jobs():
    return [
        {
            "id": j.id,
            "filename": j.filename,
            "status": j.status,
            "progress": j.progress,
            "message": j.message,
        }
        for j in jobs.values()
    ]


@app.get("/api/jobs/{job_id}/download/{filename}")
async def download_file(job_id: str, filename: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    job = jobs[job_id]
    if not job.output_dir:
        raise HTTPException(400, "Job not yet processed")
    file_path = os.path.join(job.output_dir, filename)
    if not os.path.exists(file_path):
        raise HTTPException(404, "File not found")
    media_type = "audio/mpeg" if filename.endswith(".mp3") else "audio/wav"
    return FileResponse(file_path, media_type=media_type, filename=filename)


@app.delete("/api/jobs/{job_id}")
async def delete_job(job_id: str):
    if job_id not in jobs:
        raise HTTPException(404, "Job not found")
    job = jobs[job_id]
    if job.input_path and os.path.exists(job.input_path):
        os.remove(job.input_path)
    output_dir = os.path.join(OUTPUT_DIR, job_id)
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    del jobs[job_id]
    return {"deleted": True}


@app.websocket("/ws/jobs/{job_id}")
async def job_progress(ws: WebSocket, job_id: str):
    await ws.accept()
    if job_id not in jobs:
        await ws.send_json({"error": "Job not found"})
        await ws.close()
        return

    job = jobs[job_id]
    q: asyncio.Queue = asyncio.Queue()
    job.subscribers.append(q)

    try:
        await ws.send_json({
            "progress": job.progress,
            "message": job.message,
            "status": job.status,
        })
        while True:
            try:
                update = await asyncio.wait_for(q.get(), timeout=30)
                await ws.send_json(update)
                if update.get("status") in (JobStatus.completed, JobStatus.failed):
                    break
            except asyncio.TimeoutError:
                await ws.send_json({"ping": True})
    except WebSocketDisconnect:
        pass
    finally:
        job.subscribers.remove(q)


@app.get("/api/health")
async def health():
    import torch
    return {
        "status": "ok",
        "gpu": torch.cuda.is_available(),
        "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
        "jobs": len(jobs),
    }
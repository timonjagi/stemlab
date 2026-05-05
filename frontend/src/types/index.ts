export type StemCount = 2 | 4 | 6;
export type Quality = "fast" | "standard" | "best";
export type Mode = "standard" | "vocals_only" | "instrumental";
export type JobStatus = "queued" | "processing" | "completed" | "failed";

export interface Job {
  id: string;
  filename: string;
  status: JobStatus;
  progress: number;
  message: string;
  output_files?: string[];
  error?: string;
}

export interface CreateJobResponse {
  id: string;
  filename: string;
  status: JobStatus;
}

export interface HealthResponse {
  status: string;
  gpu: boolean;
  gpu_name: string | null;
  jobs: number;
}

export interface SeparationSettings {
  stemCount: StemCount;
  quality: Quality;
  mode: Mode;
  exportMp3: boolean;
}

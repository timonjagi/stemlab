import axios from "axios";
import type { Job, CreateJobResponse, HealthResponse } from "../types";

const API_BASE = __DEV__
  ? "http://100.94.82.99:7000"
  : "http://100.94.82.99:7000";

const api = axios.create({ baseURL: API_BASE });

export const uploadAndSeparate = async (
  file: { uri: string; name: string; type: string },
  stemCount: number,
  quality: string,
  mode: string,
  exportMp3: boolean,
): Promise<CreateJobResponse> => {
  const formData = new FormData();
  formData.append("file", file as any);
  formData.append("stem_count", String(stemCount));
  formData.append("quality", quality);
  formData.append("mode", mode);
  formData.append("export_mp3", String(exportMp3));

  const res = await api.post<CreateJobResponse>("/api/jobs", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

export const getJob = async (jobId: string): Promise<Job> => {
  const res = await api.get<Job>(`/api/jobs/${jobId}`);
  return res.data;
};

export const listJobs = async (): Promise<Job[]> => {
  const res = await api.get<Job[]>("/api/jobs");
  return res.data;
};

export const deleteJob = async (jobId: string): Promise<void> => {
  await api.delete(`/api/jobs/${jobId}`);
};

export const getDownloadUrl = (jobId: string, filename: string) =>
  `${API_BASE}/api/jobs/${jobId}/download/${filename}`;

export const getHealth = async (): Promise<HealthResponse> => {
  const res = await api.get<HealthResponse>("/api/health");
  return res.data;
};

export const getWsUrl = (jobId: string) =>
  API_BASE.replace(/^http/, "ws") + `/ws/jobs/${jobId}`;

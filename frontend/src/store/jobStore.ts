import { create } from "zustand";
import type { Job, SeparationSettings, JobStatus } from "../types";
import {
  uploadAndSeparate,
  getJob,
  listJobs,
  deleteJob as deleteJobApi,
} from "../api/client";

interface JobStore {
  jobs: Job[];
  currentJob: Job | null;
  settings: SeparationSettings;
  loading: boolean;
  error: string | null;

  setSettings: (s: Partial<SeparationSettings>) => void;
  submitJob: (file: {
    uri: string;
    name: string;
    type: string;
  }) => Promise<string | null>;
  refreshJob: (id: string) => Promise<void>;
  refreshAll: () => Promise<void>;
  removeJob: (id: string) => Promise<void>;
  setCurrentJob: (id: string | null) => void;
  updateJobProgress: (
    id: string,
    progress: number,
    message: string,
    status: JobStatus,
  ) => void;
  clearError: () => void;
}

export const useJobStore = create<JobStore>((set, get) => ({
  jobs: [],
  currentJob: null,
  settings: {
    stemCount: 4,
    quality: "standard",
    mode: "standard",
    exportMp3: false,
  },
  loading: false,
  error: null,

  setSettings: (s) =>
    set((state) => ({ settings: { ...state.settings, ...s } })),

  submitJob: async (file) => {
    set({ loading: true, error: null });
    try {
      const { settings } = get();
      const resp = await uploadAndSeparate(
        file,
        settings.stemCount,
        settings.quality,
        settings.mode,
        settings.exportMp3,
      );
      const job: Job = {
        id: resp.id,
        filename: resp.filename,
        status: resp.status,
        progress: 0,
        message: "Queued",
      };
      set((state) => ({
        jobs: [job, ...state.jobs],
        currentJob: job,
        loading: false,
      }));
      return resp.id;
    } catch (e: any) {
      set({ error: e.message || "Upload failed", loading: false });
      return null;
    }
  },

  refreshJob: async (id) => {
    try {
      const job = await getJob(id);
      set((state) => ({
        jobs: state.jobs.map((j) => (j.id === id ? job : j)),
        currentJob: state.currentJob?.id === id ? job : state.currentJob,
      }));
    } catch {}
  },

  refreshAll: async () => {
    try {
      const jobs = await listJobs();
      set({ jobs });
    } catch {}
  },

  removeJob: async (id) => {
    try {
      await deleteJobApi(id);
      set((state) => ({
        jobs: state.jobs.filter((j) => j.id !== id),
        currentJob: state.currentJob?.id === id ? null : state.currentJob,
      }));
    } catch {}
  },

  setCurrentJob: (id) =>
    set((state) => ({
      currentJob: id ? state.jobs.find((j) => j.id === id) || null : null,
    })),

  updateJobProgress: (id, progress, message, status) =>
    set((state) => {
      const updated = state.jobs.map((j) =>
        j.id === id ? { ...j, progress, message, status } : j,
      );
      return {
        jobs: updated,
        currentJob:
          state.currentJob?.id === id
            ? { ...state.currentJob, progress, message, status }
            : state.currentJob,
      };
    }),

  clearError: () => set({ error: null }),
}));

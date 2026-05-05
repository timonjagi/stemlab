import { useEffect, useRef } from "react";
import { getWsUrl } from "../api/client";
import { useJobStore } from "../store/jobStore";
import type { JobStatus } from "../types";

export function useJobProgress(jobId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const updateJobProgress = useJobStore((s) => s.updateJobProgress);

  useEffect(() => {
    if (!jobId) return;

    const ws = new WebSocket(getWsUrl(jobId));
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.ping) return;
        updateJobProgress(
          jobId,
          data.progress ?? 0,
          data.message ?? "",
          (data.status as JobStatus) ?? "processing",
        );
      } catch {}
    };

    ws.onerror = () => {};

    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [jobId, updateJobProgress]);

  return wsRef;
}

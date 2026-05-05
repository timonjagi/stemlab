import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useJobStore } from "../store/jobStore";
import { useJobProgress } from "../hooks/useJobProgress";
import { SettingsPanel } from "../components/SettingsPanel";
import { ProgressBar } from "../components/ProgressBar";
import { JobCard } from "../components/JobCard";
import { getDownloadUrl } from "../api/client";
import type { SeparationSettings } from "../types";

export function HomeScreen() {
  const {
    settings,
    setSettings,
    submitJob,
    currentJob,
    jobs,
    loading,
    error,
    clearError,
  } = useJobStore();
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  useJobProgress(activeJobId);

  const pickFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const jobId = await submitJob({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || "audio/mpeg",
      });
      if (jobId) setActiveJobId(jobId);
    } catch (e) {
      console.error(e);
    }
  }, [submitJob]);

  const handleDownload = useCallback((jobId: string, filename: string) => {
    const url = getDownloadUrl(jobId, filename);
    if (typeof window !== "undefined" && window.open) {
      window.open(url, "_blank");
    }
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StemLab</Text>
      <Text style={styles.subtitle}>AI Stem Separation</Text>

      <SettingsPanel settings={settings} onChange={setSettings} />

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={[styles.uploadBtn, loading && styles.uploadBtnDisabled]}
        onPress={pickFile}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadBtnText}>Select Audio File</Text>
        )}
      </TouchableOpacity>

      {activeJobId &&
        currentJob &&
        currentJob.status !== "completed" &&
        currentJob.status !== "failed" && (
          <View style={styles.progressSection}>
            <Text style={styles.fileName}>{currentJob.filename}</Text>
            <ProgressBar
              progress={currentJob.progress}
              message={currentJob.message}
            />
          </View>
        )}

      {jobs.length > 0 && (
        <View style={styles.jobsSection}>
          <Text style={styles.sectionTitle}>Recent Jobs</Text>
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onDownload={(filename) => handleDownload(job.id, filename)}
              onDelete={() => useJobStore.getState().removeJob(job.id)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 24,
  },
  uploadBtn: {
    backgroundColor: "#6C5CE7",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
  },
  uploadBtnDisabled: {
    opacity: 0.6,
  },
  uploadBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  progressSection: {
    marginTop: 20,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  jobsSection: {
    marginTop: 24,
  },
  errorBox: {
    backgroundColor: "#3a1515",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 13,
    flex: 1,
  },
  dismissText: {
    color: "#ff6b6b",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 12,
  },
});

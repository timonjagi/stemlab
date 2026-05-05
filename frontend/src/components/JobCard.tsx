import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { Job } from "../types";
import { getDownloadUrl } from "../api/client";

interface Props {
  job: Job;
  onDownload: (filename: string) => void;
  onDelete: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  queued: "#888",
  processing: "#6C5CE7",
  completed: "#00d26a",
  failed: "#ff6b6b",
};

export function JobCard({ job, onDownload, onDelete }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.fileName} numberOfLines={1}>
          {job.filename}
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: STATUS_COLORS[job.status] || "#888" },
          ]}
        >
          <Text style={styles.badgeText}>{job.status}</Text>
        </View>
      </View>

      {job.status === "processing" && (
        <View style={styles.progressRow}>
          <View style={styles.barBg}>
            <View style={[styles.barFill, { width: `${job.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{job.progress}%</Text>
        </View>
      )}

      {job.status === "completed" && job.output_files && (
        <View style={styles.filesSection}>
          {job.output_files.map((f) => (
            <TouchableOpacity
              key={f}
              style={styles.fileLink}
              onPress={() => onDownload(f)}
            >
              <Text style={styles.fileLinkText}>{f}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {job.status === "failed" && job.error && (
        <Text style={styles.errorText}>{job.error}</Text>
      )}

      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete}>
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fileName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  barBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  barFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#6C5CE7",
  },
  progressText: {
    color: "#888",
    fontSize: 12,
    width: 36,
    textAlign: "right",
  },
  filesSection: {
    marginTop: 10,
    gap: 6,
  },
  fileLink: {
    backgroundColor: "#2a2a2a",
    borderRadius: 6,
    padding: 8,
  },
  fileLinkText: {
    color: "#6C5CE7",
    fontSize: 13,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 6,
  },
  deleteBtn: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  deleteText: {
    color: "#555",
    fontSize: 12,
  },
});

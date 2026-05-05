import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import type { SeparationSettings } from "../types";

const STEM_OPTIONS: {
  label: string;
  value: SeparationSettings["stemCount"];
}[] = [
  { label: "2 Stems", value: 2 },
  { label: "4 Stems", value: 4 },
  { label: "6 Stems", value: 6 },
];

const QUALITY_OPTIONS: {
  label: string;
  value: SeparationSettings["quality"];
}[] = [
  { label: "Fast", value: "fast" },
  { label: "Standard", value: "standard" },
  { label: "Best", value: "best" },
];

const MODE_OPTIONS: { label: string; value: SeparationSettings["mode"] }[] = [
  { label: "Standard", value: "standard" },
  { label: "Vocals Only", value: "vocals_only" },
  { label: "Instrumental", value: "instrumental" },
];

interface Props {
  settings: SeparationSettings;
  onChange: (partial: Partial<SeparationSettings>) => void;
}

export function SettingsPanel({ settings, onChange }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Stems</Text>
        <View style={styles.row}>
          {STEM_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                settings.stemCount === opt.value && styles.chipActive,
              ]}
              onPress={() => onChange({ stemCount: opt.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.stemCount === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Quality</Text>
        <View style={styles.row}>
          {QUALITY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                settings.quality === opt.value && styles.chipActive,
              ]}
              onPress={() => onChange({ quality: opt.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.quality === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Mode</Text>
        <View style={styles.row}>
          {MODE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.chip,
                settings.mode === opt.value && styles.chipActive,
              ]}
              onPress={() => onChange({ mode: opt.value })}
            >
              <Text
                style={[
                  styles.chipText,
                  settings.mode === opt.value && styles.chipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Export as MP3</Text>
          <TouchableOpacity
            style={[styles.toggle, settings.exportMp3 && styles.toggleActive]}
            onPress={() => onChange({ exportMp3: !settings.exportMp3 })}
          >
            <View
              style={[
                styles.toggleDot,
                settings.exportMp3 && styles.toggleDotActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    color: "#aaa",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  chip: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: {
    backgroundColor: "#6C5CE7",
  },
  chipText: {
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2a2a2a",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#6C5CE7",
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#555",
  },
  toggleDotActive: {
    backgroundColor: "#fff",
    alignSelf: "flex-end",
  },
});

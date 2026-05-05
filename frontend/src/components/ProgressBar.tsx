import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface Props {
  progress: number;
  message: string;
}

export function ProgressBar({ progress, message }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${progress}%` }]} />
      </View>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2a2a2a",
    overflow: "hidden",
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#6C5CE7",
  },
  message: {
    color: "#888",
    fontSize: 12,
    marginTop: 4,
  },
});

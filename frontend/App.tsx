import { StatusBar } from "expo-status-bar";
import { StyleSheet, ScrollView } from "react-native";
import { HomeScreen } from "./src/screens/HomeScreen";

export default function App() {
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <HomeScreen />
      <StatusBar style="light" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    minHeight: "100%",
  },
});

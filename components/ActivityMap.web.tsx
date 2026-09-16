import Colors from "@/constants/colors";
import { StyleSheet, Text, View } from "react-native";

interface Coordinate {
  latitude: number;
  longitude: number;
}

interface ActivityMapProps {
  location: Coordinate;
  path: Coordinate[];
  isTracking: boolean;
}

export default function ActivityMap(_: ActivityMapProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📱</Text>
      <Text style={styles.title}>Map preview is available on mobile</Text>
      <Text style={styles.description}>
        Use Expo Go or an Android/iOS preview build to test GPS route tracking.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F4FF",
    padding: 24,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
    textAlign: "center",
  },
  description: {
    color: Colors.textLight,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
    textAlign: "center",
  },
});

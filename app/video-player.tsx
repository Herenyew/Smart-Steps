import Colors from "@/constants/colors";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

export default function VideoPlayerScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { activityId, activityTitle } = useLocalSearchParams<{
    activityId: string;
    activityTitle: string;
  }>();

  const { completeActivity, isActivityCompleted } = useUserProgress();
  const [isLoading, setIsLoading] = useState(true);
  const completed = isActivityCompleted(activityId || "");

  const handleComplete = () => {
    if (activityId && !completed) {
      void completeActivity(activityId);
    }
    router.back();
  };

  // Convert YouTube URL to embed URL
  const videoId = "h3Xrtm0IVnY";
  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activityTitle || "Strength Training"}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Video Player */}
      <View style={styles.videoContainer}>
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}
        <WebView
          source={{ uri: embedUrl }}
          style={styles.video}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => setIsLoading(false)}
          allowsFullscreenVideo
          javaScriptEnabled
          domStorageEnabled
        />
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>📺 Watch & Learn</Text>
        <Text style={styles.instructionsText}>
          Follow along with the video to complete your strength training workout!
        </Text>
      </View>

      {/* Complete Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.completeButton, completed && styles.completedButton]}
          onPress={handleComplete}
        >
          {completed ? (
            <View style={styles.completedContent}>
              <Check size={24} color={Colors.cardBg} />
              <Text style={styles.completedText}>✓ Done! Go Back</Text>
            </View>
          ) : (
            <Text style={styles.completeButtonText}>🎉 I Did It!</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.text,
    flex: 1,
    textAlign: "center",
    marginHorizontal: 16,
  },
  placeholder: {
    width: 40,
  },
  videoContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: Colors.text,
    position: "relative",
  },
  video: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.text,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: Colors.cardBg,
    fontWeight: "500" as const,
  },
  instructionsContainer: {
    padding: 24,
    backgroundColor: Colors.cardBg,
    margin: 16,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  instructionsTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 15,
    color: Colors.textLight,
    lineHeight: 22,
  },
  buttonContainer: {
    padding: 16,
    marginTop: "auto",
  },
  completeButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  completedButton: {
    backgroundColor: Colors.success,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.cardBg,
  },
  completedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedText: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.cardBg,
  },
});

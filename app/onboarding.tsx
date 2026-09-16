import Colors from "@/constants/colors";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const router = useRouter();
  const { markOnboardingComplete } = useUserProgress();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState(false);
  const hasCompleted = useRef(false);

  const videoSource = "https://sheikhumer.com/intro1.mp4";
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = false;
    player.play();
  });

  const finishOnboarding = useCallback(async () => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;

    try {
      await markOnboardingComplete();
      router.replace("/chat");
    } catch {
      hasCompleted.current = false;
      setHasError(true);
    }
  }, [markOnboardingComplete, router]);

  useEffect(() => {
    const statusSubscription = player.addListener("statusChange", (status) => {
      if (status.status === "readyToPlay") {
        setIsLoading(false);
        setHasError(false);
      } else if (status.status === "error") {
        setIsLoading(false);
        setHasError(true);
      }
    });
    const endSubscription = player.addListener("playToEnd", finishOnboarding);
    const loadTimeout = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setHasError(true);
      }
    }, 12_000);

    return () => {
      clearTimeout(loadTimeout);
      statusSubscription.remove();
      endSubscription.remove();
    };
  }, [finishOnboarding, isLoading, player]);

  return (
    <View style={styles.container}>
      {(isLoading || hasError) && (
        <View style={styles.loadingContainer}>
          <Image
            source={require("@/assets/images/logo_smart_step.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          {isLoading ? (
            <ActivityIndicator
              size="large"
              color={Colors.primary}
              style={styles.loader}
            />
          ) : (
            <>
              <Text style={styles.errorText}>The intro video could not load.</Text>
              <TouchableOpacity style={styles.continueButton} onPress={finishOnboarding}>
                <Text style={styles.continueButtonText}>Continue</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen={false}
        allowsPictureInPicture={false}
        contentFit="cover"
        nativeControls={false}
      />
      {!hasError && (
        <TouchableOpacity style={styles.skipButton} onPress={finishOnboarding}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.text,
  },
  video: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF9F5",
    zIndex: 1,
  },
  logo: {
    width: 200,
    height: 200,
    marginBottom: 30,
  },
  loader: {
    marginTop: 20,
  },
  errorText: {
    color: Colors.text,
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  continueButtonText: {
    color: Colors.cardBg,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  skipButton: {
    position: "absolute",
    right: 20,
    top: 56,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  skipButtonText: {
    color: Colors.cardBg,
    fontSize: 14,
    fontWeight: "700" as const,
  },
});

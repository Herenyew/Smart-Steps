import ActivityMap from "@/components/ActivityMap";
import Colors from "@/constants/colors";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { calculateDistanceMeters, isPlausibleLocationStep } from "@/lib/location";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

interface LocationCoords {
  latitude: number;
  longitude: number;
}

export default function WalkingTrackerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { completeActivity, activities } = useUserProgress();

  const activityId = params.activityId as string;
  const activityTitle = params.activityTitle as string;
  const activity = activities.find((item) => item.id === activityId);
  const activityType = activity?.kind === "run" ? "Running" : "Walking";

  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [distance, setDistance] = useState(0);
  const [timer, setTimer] = useState(0);
  const [path, setPath] = useState<LocationCoords[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [loading, setLoading] = useState(true);

  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocation = useRef<LocationCoords | null>(null);
  const lastLocationTimestamp = useRef<number | null>(null);
  const activeStartedAt = useRef<number | null>(null);
  const accumulatedSeconds = useRef(0);

  useEffect(() => {
    requestLocationPermission();
    return () => {
      stopTracking();
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is required to track your activity."
        );
        setLoading(false);
        return;
      }

      setPermissionGranted(true);
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coords = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      };
      setLocation(coords);
      setLoading(false);
    } catch (error) {
      console.error("Error requesting location permission:", error);
      Alert.alert("Error", "Failed to get your location.");
      setLoading(false);
    }
  };


  const startTracking = async () => {
    if (!permissionGranted) {
      Alert.alert("Error", "Location permission not granted.");
      return;
    }

    if (!hasStarted) {
      setDistance(0);
      setTimer(0);
      setPath([]);
      accumulatedSeconds.current = 0;
    }

    try {
      const startingLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const startingCoords = {
        latitude: startingLocation.coords.latitude,
        longitude: startingLocation.coords.longitude,
      };
      setLocation(startingCoords);
      setPath((current) => (hasStarted ? [...current, startingCoords] : [startingCoords]));
      lastLocation.current = startingCoords;
      lastLocationTimestamp.current = startingLocation.timestamp;
      activeStartedAt.current = Date.now();
      setHasStarted(true);
      setIsTracking(true);

      timerInterval.current = setInterval(() => {
        const activeSeconds = activeStartedAt.current
          ? Math.floor((Date.now() - activeStartedAt.current) / 1000)
          : 0;
        setTimer(accumulatedSeconds.current + activeSeconds);
      }, 1000);

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (newLocation) => {
          const coords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
          };

          setLocation(coords);

          if (newLocation.coords.accuracy != null && newLocation.coords.accuracy > 50) {
            return;
          }

          if (lastLocation.current) {
            const distanceDelta = calculateDistanceMeters(lastLocation.current, coords);
            const elapsedSeconds = lastLocationTimestamp.current
              ? Math.max(1, (newLocation.timestamp - lastLocationTimestamp.current) / 1000)
              : 1;
            if (
              !isPlausibleLocationStep({
                distanceMeters: distanceDelta,
                elapsedSeconds,
                accuracyMeters: newLocation.coords.accuracy,
              })
            ) {
              return;
            }

            setDistance((prev) => prev + distanceDelta);
          }

          setPath((prev) => [...prev, coords]);
          lastLocation.current = coords;
          lastLocationTimestamp.current = newLocation.timestamp;
        }
      );
    } catch (error) {
      console.error("Error starting location tracking:", error);
      Alert.alert("Error", "Failed to start tracking.");
      stopTracking();
      setIsTracking(false);
    }
  };

  const stopTracking = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
  };

  const pauseTracking = () => {
    if (activeStartedAt.current) {
      accumulatedSeconds.current += Math.floor(
        (Date.now() - activeStartedAt.current) / 1000
      );
    }
    activeStartedAt.current = null;
    lastLocation.current = null;
    lastLocationTimestamp.current = null;
    stopTracking();
    setTimer(accumulatedSeconds.current);
    setIsTracking(false);
  };

  const handleComplete = async () => {
    if (!hasStarted) {
      Alert.alert("Start first", `Start ${activityType.toLowerCase()} before completing it.`);
      return;
    }
    pauseTracking();
    await completeActivity(activityId);
    router.back();
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${Math.round(meters)} meters`;
    }
    return `${(meters / 1000).toFixed(2)} km`;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!permissionGranted || !location) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>
          Location permission is required to use this feature.
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (isTracking) {
              Alert.alert(
                "Stop Tracking?",
                "Are you sure you want to stop tracking?",
                [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Stop",
                    style: "destructive",
                    onPress: () => {
                      pauseTracking();
                      router.back();
                    },
                  },
                ]
              );
            } else {
              router.back();
            }
          }}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{activityTitle}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.map}>
        <ActivityMap location={location} path={path} isTracking={isTracking} />
      </View>

      <View style={styles.controlPanel}>
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Distance Covered</Text>
            <Text style={styles.statValue}>{formatDistance(distance)}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatTime(timer)}</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          {!isTracking ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.startButton]}
              onPress={startTracking}
            >
              <Text style={styles.buttonText}>▶️ Start {activityType}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.pauseButton]}
              onPress={() => {
                pauseTracking();
              }}
            >
              <Text style={styles.buttonText}>⏸️ Pause</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.completeButton,
              !hasStarted && styles.disabledButton,
            ]}
            onPress={handleComplete}
            disabled={!hasStarted}
          >
            <Text style={styles.buttonText}>✓ I did it!</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "600" as const,
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 20,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
    lineHeight: 24,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  backButtonText: {
    color: Colors.cardBg,
    fontSize: 16,
    fontWeight: "700" as const,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: Colors.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  map: {
    flex: 1,
  },
  controlPanel: {
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "600" as const,
    marginBottom: 8,
    textAlign: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "800" as const,
    color: Colors.primary,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  startButton: {
    backgroundColor: Colors.success,
  },
  pauseButton: {
    backgroundColor: Colors.purple,
  },
  completeButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.cardBg,
  },
});

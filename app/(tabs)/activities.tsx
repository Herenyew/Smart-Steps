import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Check, MessageCircle, Trophy } from "lucide-react-native";

export default function ActivitiesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const {
    progress,
    activities,
    completeActivity,
    uncompleteActivity,
    isActivityCompleted,
  } = useUserProgress();
  const [animatedValues] = useState<{ [key: string]: Animated.Value }>(
    activities.reduce(
      (acc, activity) => ({
        ...acc,
        [activity.id]: new Animated.Value(1),
      }),
      {}
    )
  );

  // Reminder state
  const [reminderModalVisible, setReminderModalVisible] = useState(false);
  const [reminderMinutes, setReminderMinutes] = useState("");
  const [reminderEndTime, setReminderEndTime] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timerIntervalRef = useRef<any>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Timer countdown effect
  useEffect(() => {
    if (reminderEndTime) {
      // Update immediately
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((reminderEndTime - now) / 1000));
        setRemainingSeconds(remaining);

        if (remaining === 0) {
          // Timer finished
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          setReminderEndTime(null);
          Alert.alert("💧 Drink Water", "Time to hydrate! Stay healthy!", [
            { text: "OK", style: "default" }
          ]);
        }
      };

      updateTimer();
      timerIntervalRef.current = setInterval(updateTimer, 1000);

      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }
  }, [reminderEndTime]);

  const handleSetReminder = () => {
    const minutes = parseInt(reminderMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid number of minutes.");
      return;
    }

    const endTime = Date.now() + minutes * 60 * 1000;
    setReminderEndTime(endTime);
    setReminderModalVisible(false);
    setReminderMinutes("");
  };

  const handleRemoveReminder = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setReminderEndTime(null);
    setRemainingSeconds(0);
  };

  const handleEditReminder = () => {
    const currentMinutes = Math.ceil(remainingSeconds / 60);
    setReminderMinutes(currentMinutes.toString());
    setReminderModalVisible(true);
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleToggle = (activityId: string) => {
    const anim = animatedValues[activityId];
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    if (isActivityCompleted(activityId)) {
      void uncompleteActivity(activityId);
    } else {
      void completeActivity(activityId);
    }
  };

  const todayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.secondary, Colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerTop}>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/chat")}
            >
              <MessageCircle size={18} color={Colors.cardBg} />
              <Text style={styles.navButtonText}>Chat</Text>
            </TouchableOpacity>
            <Text style={styles.headerEmoji}>🎯✨</Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(tabs)/leaderboard")}
            >
              <Trophy size={18} color={Colors.cardBg} />
              <Text style={styles.navButtonText}>Leaderboard</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerDate}>{todayDate}</Text>
          <Text style={styles.headerTitle}>Daily Activities</Text>
          <View style={styles.scoreContainer}>
            <Text style={styles.scoreLabel}>🌟 Today&apos;s Score 🌟</Text>
            <Text style={styles.scoreValue}>{progress.todayScore} pts</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.activitiesContainer}
        showsVerticalScrollIndicator={false}
      >
        {activities.map((activity) => {
          const completed = isActivityCompleted(activity.id);
          const isHydrationCheck = activity.kind === "hydration";
          const isWalkingRunning = activity.kind === "walk" || activity.kind === "run";

          return (
            <Animated.View
              key={activity.id}
              style={[
                styles.card,
                { transform: [{ scale: animatedValues[activity.id] }] },
              ]}
            >
              <View style={styles.cardContent}>
                <LinearGradient
                  colors={[Colors.accent, Colors.purple]}
                  style={styles.iconContainer}
                >
                  <Text style={styles.icon}>{activity.icon}</Text>
                </LinearGradient>
                <View style={styles.activityInfo}>
                  <Text style={styles.activityTitle}>{activity.title}</Text>
                  <Text style={styles.activityDescription}>
                    {activity.description}
                  </Text>
                  <View style={styles.pointsBadge}>
                    <Text style={styles.pointsText}>
                      ⭐ +{activity.points} points
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.buttonGroup}>
                {activity.kind === "strength" && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() =>
                      router.push({
                        pathname: "/video-player" as any,
                        params: {
                          activityId: activity.id,
                          activityTitle: activity.title,
                          points: activity.points.toString(),
                        },
                      })
                    }
                  >
                    <Text style={styles.startButtonText}>▶️ Start</Text>
                  </TouchableOpacity>
                )}
                {isWalkingRunning && (
                  <TouchableOpacity
                    style={styles.startButton}
                    onPress={() =>
                      router.push({
                        pathname: "/walking-tracker" as any,
                        params: {
                          activityId: activity.id,
                          activityTitle: activity.title,
                          points: activity.points.toString(),
                        },
                      })
                    }
                  >
                    <Text style={styles.startButtonText}>▶️ Start</Text>
                  </TouchableOpacity>
                )}
                {isHydrationCheck && reminderEndTime && (
                  <TouchableOpacity
                    style={styles.timerButton}
                    onPress={() => {
                      Alert.alert(
                        "💧 Hydration Reminder",
                        `Time remaining: ${formatTime(remainingSeconds)}`,
                        [
                          { text: "Edit", onPress: handleEditReminder },
                          { text: "Remove", onPress: handleRemoveReminder, style: "destructive" },
                          { text: "Cancel", style: "cancel" }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.timerButtonText}>
                      ⏱️ {formatTime(remainingSeconds)}
                    </Text>
                  </TouchableOpacity>
                )}
                {isHydrationCheck && !reminderEndTime && (
                  <TouchableOpacity
                    style={styles.remindButton}
                    onPress={() => setReminderModalVisible(true)}
                  >
                    <Text style={styles.remindButtonText}>🔔 Remind me</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    completed && styles.completedButton,
                    (activity.kind === "strength" || isHydrationCheck || isWalkingRunning) && styles.completeButtonSmall,
                  ]}
                  onPress={() => handleToggle(activity.id)}
                >
                  {completed ? (
                    <View style={styles.completedContent}>
                      <Check size={20} color={Colors.cardBg} />
                      <Text style={styles.completedText}>✓ Done!</Text>
                    </View>
                  ) : (
                    <Text style={styles.completeButtonText}>🎉 I did it!</Text>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          );
        })}
      </ScrollView>

      {/* Reminder Setup Modal */}
      <Modal
        visible={reminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReminderModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>💧 Set Hydration Reminder</Text>
            <Text style={styles.modalSubtitle}>
              How many minutes from now?
            </Text>
            <TextInput
              style={styles.modalInput}
              value={reminderMinutes}
              onChangeText={setReminderMinutes}
              placeholder="Enter minutes (e.g., 30)"
              keyboardType="number-pad"
              placeholderTextColor={Colors.textLight}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setReminderModalVisible(false);
                  setReminderMinutes("");
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleSetReminder}
              >
                <Text style={styles.modalButtonConfirmText}>Set Reminder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerGradient: {
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  header: {
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  navButtonText: {
    color: Colors.cardBg,
    fontSize: 13,
    fontWeight: "700" as const,
  },
  headerEmoji: {
    fontSize: 36,
  },
  headerDate: {
    fontSize: 15,
    color: Colors.cardBg,
    fontWeight: "600" as const,
    textAlign: "center",
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: Colors.cardBg,
    marginBottom: 20,
    textAlign: "center",
  },
  scoreContainer: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "700" as const,
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "900" as const,
    color: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  activitiesContainer: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 20,
    padding: 18,
    borderWidth: 3,
    borderColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: "row",
    marginBottom: 12,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    fontSize: 32,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 19,
    fontWeight: "700" as const,
    color: Colors.text,
    marginBottom: 6,
  },
  activityDescription: {
    fontSize: 15,
    color: Colors.textLight,
    marginBottom: 10,
    lineHeight: 20,
  },
  pointsBadge: {
    alignSelf: "flex-start",
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  pointsText: {
    fontSize: 13,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  startButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.cardBg,
  },
  completeButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  completeButtonSmall: {
    flex: 1,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.cardBg,
  },
  completedButton: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
  },
  completedContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedText: {
    fontSize: 17,
    fontWeight: "800" as const,
    color: Colors.cardBg,
  },
  remindButton: {
    backgroundColor: Colors.accent,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  remindButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.cardBg,
  },
  timerButton: {
    backgroundColor: Colors.purple,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  timerButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.cardBg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 28,
    width: "100%",
    maxWidth: 360,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    marginBottom: 20,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 2,
    borderColor: Colors.accent,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonCancel: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.textLight,
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.text,
  },
  modalButtonConfirm: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: Colors.cardBg,
  },
});

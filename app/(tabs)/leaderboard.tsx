import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { LeaderboardEntry, MOCK_LEADERBOARD } from "@/constants/leaderboard";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Activity, MessageCircle } from "lucide-react-native";

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { progress } = useUserProgress();

  const leaderboard: LeaderboardEntry[] = MOCK_LEADERBOARD.map((entry) => {
    if (entry.name === "You") {
      return { ...entry, score: progress.totalScore };
    }
    return entry;
  }).sort((a, b) => b.score - a.score);

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.purple, Colors.accent]}
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
            <Text style={styles.headerEmoji}>🏆</Text>
            <TouchableOpacity
              style={styles.navButton}
              onPress={() => router.push("/(tabs)/activities")}
            >
              <Activity size={18} color={Colors.cardBg} />
              <Text style={styles.navButtonText}>Activities</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.headerTitle}>Leaderboard</Text>
          <Text style={styles.headerSubtitle}>
            🌟 Keep going! You&apos;re doing great! 🌟
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.podiumContainer}>
          <View style={styles.podiumRow}>
            {top3.length >= 2 && (
              <View style={[styles.podiumItem, styles.secondPlace]}>
                <LinearGradient
                  colors={["#C0C0C0", "#E8E8E8"]}
                  style={styles.podiumAvatar}
                >
                  <Text style={styles.podiumEmoji}>{top3[1].avatar}</Text>
                </LinearGradient>
                <View style={styles.podiumBadge}>
                  <Text style={styles.podiumRank}>2</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {top3[1].name}
                </Text>
                <Text style={styles.podiumScore}>{top3[1].score} pts</Text>
              </View>
            )}

            {top3.length >= 1 && (
              <View style={[styles.podiumItem, styles.firstPlace]}>
                <View style={styles.crownContainer}>
                  <Text style={styles.crownEmoji}>👑</Text>
                </View>
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
                  style={styles.podiumAvatar}
                >
                  <Text style={styles.podiumEmoji}>{top3[0].avatar}</Text>
                </LinearGradient>
                <View style={styles.podiumBadge}>
                  <Text style={styles.podiumRank}>1</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {top3[0].name}
                </Text>
                <Text style={styles.podiumScore}>{top3[0].score} pts</Text>
              </View>
            )}

            {top3.length >= 3 && (
              <View style={[styles.podiumItem, styles.thirdPlace]}>
                <LinearGradient
                  colors={["#CD7F32", "#E6A857"]}
                  style={styles.podiumAvatar}
                >
                  <Text style={styles.podiumEmoji}>{top3[2].avatar}</Text>
                </LinearGradient>
                <View style={styles.podiumBadge}>
                  <Text style={styles.podiumRank}>3</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>
                  {top3[2].name}
                </Text>
                <Text style={styles.podiumScore}>{top3[2].score} pts</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.rankingsContainer}>
          {rest.map((entry, index) => {
            const isCurrentUser = entry.name === "You";
            return (
              <View
                key={entry.id}
                style={[
                  styles.rankingItem,
                  isCurrentUser && styles.currentUserRanking,
                ]}
              >
                <View style={styles.rankingLeft}>
                  <View style={styles.rankNumber}>
                    <Text style={styles.rankNumberText}>{index + 4}</Text>
                  </View>
                  <View style={styles.rankingAvatar}>
                    <Text style={styles.rankingEmoji}>{entry.avatar}</Text>
                  </View>
                  <Text
                    style={[
                      styles.rankingName,
                      isCurrentUser && styles.currentUserName,
                    ]}
                  >
                    {entry.name}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.rankingScore,
                    isCurrentUser && styles.currentUserScore,
                  ]}
                >
                  {entry.score} pts
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
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
    fontSize: 48,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: "900" as const,
    color: Colors.cardBg,
    textAlign: "center",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: Colors.cardBg,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  podiumContainer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
  },
  podiumRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    gap: 12,
  },
  podiumItem: {
    alignItems: "center",
    flex: 1,
  },
  firstPlace: {
    marginBottom: 20,
  },
  secondPlace: {
    marginBottom: 0,
  },
  thirdPlace: {
    marginBottom: -10,
  },
  crownContainer: {
    position: "absolute",
    top: -20,
    zIndex: 10,
  },
  crownEmoji: {
    fontSize: 32,
  },
  podiumAvatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    borderWidth: 4,
    borderColor: Colors.cardBg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  podiumEmoji: {
    fontSize: 36,
  },
  podiumBadge: {
    position: "absolute",
    top: 62,
    right: -2,
    backgroundColor: Colors.secondary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.cardBg,
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: "900" as const,
    color: Colors.text,
  },
  podiumName: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.text,
    marginTop: 8,
    textAlign: "center",
  },
  podiumScore: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: Colors.primary,
    marginTop: 2,
  },
  rankingsContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  rankingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  currentUserRanking: {
    backgroundColor: Colors.cardBg,
    borderColor: Colors.secondary,
    borderWidth: 3,
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  rankingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  rankNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  rankNumberText: {
    fontSize: 15,
    fontWeight: "800" as const,
    color: Colors.text,
  },
  rankingAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  rankingEmoji: {
    fontSize: 22,
  },
  rankingName: {
    fontSize: 17,
    fontWeight: "600" as const,
    color: Colors.text,
    flex: 1,
  },
  currentUserName: {
    fontWeight: "800" as const,
    color: Colors.primary,
  },
  rankingScore: {
    fontSize: 15,
    fontWeight: "700" as const,
    color: Colors.textLight,
  },
  currentUserScore: {
    fontWeight: "800" as const,
    color: Colors.primary,
  },
});

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  avatar: string;
}

export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { id: "1", name: "Alex Chen", score: 2850, avatar: "🦸" },
  { id: "2", name: "Sarah Miller", score: 2640, avatar: "🌟" },
  { id: "3", name: "Marcus Johnson", score: 2420, avatar: "⚡" },
  { id: "4", name: "Emma Wilson", score: 2180, avatar: "🎯" },
  { id: "5", name: "David Park", score: 1950, avatar: "🚀" },
  { id: "6", name: "Lisa Anderson", score: 1820, avatar: "💎" },
  { id: "7", name: "Ryan Foster", score: 1690, avatar: "🏆" },
  { id: "8", name: "Nina Patel", score: 1540, avatar: "✨" },
  { id: "9", name: "Jake Thompson", score: 1380, avatar: "🔥" },
  { id: "10", name: "You", score: 0, avatar: "😊" },
];
export type ActivityKind = "manual" | "walk" | "run" | "strength" | "hydration";

export interface Activity {
  id: string;
  title: string;
  description: string;
  points: number;
  icon: string;
  kind: ActivityKind;
}

export const DAILY_ACTIVITIES: Activity[] = [
  {
    id: "1",
    title: "Morning Run",
    description: "Run for 15 minutes",
    points: 10,
    icon: "🏃",
    kind: "run",
  },
  {
    id: "2",
    title: "Healthy Breakfast",
    description: "Eat a balanced breakfast with protein",
    points: 8,
    icon: "🥗",
    kind: "manual",
  },
  {
    id: "3",
    title: "Hydration Check",
    description: "Drink 8 glasses of water",
    points: 5,
    icon: "💧",
    kind: "hydration",
  },
  {
    id: "4",
    title: "Strength Training",
    description: "Complete 30 minutes of strength exercises",
    points: 15,
    icon: "💪",
    kind: "strength",
  },
  {
    id: "5",
    title: "Meditation",
    description: "Practice 10 minutes of mindfulness",
    points: 7,
    icon: "🧘",
    kind: "manual",
  },
  {
    id: "6",
    title: "Healthy Dinner",
    description: "Prepare a nutritious dinner",
    points: 8,
    icon: "🍽️",
    kind: "manual",
  },
  {
    id: "7",
    title: "Evening Walk",
    description: "Take a 20-minute walk",
    points: 6,
    icon: "🚶",
    kind: "walk",
  },
  {
    id: "8",
    title: "Sleep Schedule",
    description: "Get 8 hours of quality sleep",
    points: 10,
    icon: "😴",
    kind: "manual",
  }
];

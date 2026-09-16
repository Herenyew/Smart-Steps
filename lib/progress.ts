import { z } from "zod";

export const completedActivitySchema = z.strictObject({
  activityId: z.string().min(1).max(100),
  completedAt: z.string().datetime(),
  points: z.number().int().min(0).max(100),
});

export const storedActivitySchema = z.strictObject({
  id: z.string().min(1).max(100),
  title: z.string().min(2).max(60),
  description: z.string().min(5).max(160),
  points: z.number().int().min(5).max(20),
  icon: z.string().min(1).max(8),
  kind: z.enum(["manual", "walk", "run", "strength", "hydration"]),
});

export const storedProgressSchema = z.strictObject({
  version: z.literal(1),
  totalScore: z.number().int().nonnegative(),
  completedActivities: z.array(completedActivitySchema).max(1000),
  hasSeenOnboarding: z.boolean(),
  hasCompletedChat: z.boolean(),
  personalizedActivities: z.array(storedActivitySchema).max(8).nullable(),
});

export type StoredProgress = z.infer<typeof storedProgressSchema>;

export const EMPTY_PROGRESS: StoredProgress = {
  version: 1,
  totalScore: 0,
  completedActivities: [],
  hasSeenOnboarding: false,
  hasCompletedChat: false,
  personalizedActivities: null,
};

export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function occurredOnLocalDay(timestamp: string, day: Date): boolean {
  return localDayKey(new Date(timestamp)) === localDayKey(day);
}

export function todayScore(progress: StoredProgress, now = new Date()): number {
  return progress.completedActivities
    .filter((activity) => occurredOnLocalDay(activity.completedAt, now))
    .reduce((sum, activity) => sum + activity.points, 0);
}

export function isCompletedToday(
  progress: StoredProgress,
  activityId: string,
  now = new Date()
): boolean {
  return progress.completedActivities.some(
    (activity) =>
      activity.activityId === activityId && occurredOnLocalDay(activity.completedAt, now)
  );
}

export function completeForToday(
  progress: StoredProgress,
  activityId: string,
  points: number,
  now = new Date()
): StoredProgress {
  if (isCompletedToday(progress, activityId, now)) return progress;

  return {
    ...progress,
    totalScore: progress.totalScore + points,
    completedActivities: [
      ...progress.completedActivities,
      { activityId, points, completedAt: now.toISOString() },
    ].slice(-1000),
  };
}

export function uncompleteForToday(
  progress: StoredProgress,
  activityId: string,
  now = new Date()
): StoredProgress {
  const removed = progress.completedActivities.filter(
    (activity) =>
      activity.activityId === activityId && occurredOnLocalDay(activity.completedAt, now)
  );
  if (removed.length === 0) return progress;

  return {
    ...progress,
    totalScore: Math.max(
      0,
      progress.totalScore - removed.reduce((sum, activity) => sum + activity.points, 0)
    ),
    completedActivities: progress.completedActivities.filter(
      (activity) =>
        !(activity.activityId === activityId && occurredOnLocalDay(activity.completedAt, now))
    ),
  };
}

export function parseStoredProgress(value: string | null): StoredProgress {
  if (!value) return EMPTY_PROGRESS;

  try {
    const result = storedProgressSchema.safeParse(JSON.parse(value));
    return result.success ? result.data : EMPTY_PROGRESS;
  } catch {
    return EMPTY_PROGRESS;
  }
}

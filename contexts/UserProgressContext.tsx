import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Activity, DAILY_ACTIVITIES } from "@/constants/activities";
import { WellnessPlan } from "@/lib/chat-contract";
import {
  EMPTY_PROGRESS,
  StoredProgress,
  completeForToday,
  isCompletedToday,
  parseStoredProgress,
  todayScore,
  uncompleteForToday,
} from "@/lib/progress";

interface UserProgress extends StoredProgress {
  todayScore: number;
}

interface UserProgressContextType {
  progress: UserProgress;
  activities: Activity[];
  isLoading: boolean;
  storageError: string | null;
  completeActivity: (activityId: string) => Promise<void>;
  uncompleteActivity: (activityId: string) => Promise<void>;
  isActivityCompleted: (activityId: string) => boolean;
  markOnboardingComplete: () => Promise<void>;
  savePersonalizedPlan: (plan: WellnessPlan) => Promise<void>;
  resetProgress: () => Promise<void>;
}

const STORAGE_KEY = "@fitness_user_progress";
const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedProgress, setStoredProgress] = useState<StoredProgress>(EMPTY_PROGRESS);
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState<string | null>(null);
  const progressRef = useRef<StoredProgress>(EMPTY_PROGRESS);
  const writeChainRef = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!mounted) return;
        const hydrated = parseStoredProgress(stored);
        progressRef.current = hydrated;
        setStoredProgress(hydrated);
      })
      .catch(() => {
        if (mounted) setStorageError("Progress could not be loaded on this device.");
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(async (next: StoredProgress) => {
    writeChainRef.current = writeChainRef.current
      .catch(() => undefined)
      .then(() => AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)));

    try {
      await writeChainRef.current;
      setStorageError(null);
    } catch {
      setStorageError("Progress could not be saved on this device.");
      throw new Error("Progress could not be saved.");
    }
  }, []);

  const commit = useCallback(
    async (update: (current: StoredProgress) => StoredProgress) => {
      const next = update(progressRef.current);
      if (next === progressRef.current) return;

      progressRef.current = next;
      setStoredProgress(next);
      await persist(next);
    },
    [persist]
  );

  const activities = useMemo<Activity[]>(
    () => storedProgress.personalizedActivities ?? DAILY_ACTIVITIES,
    [storedProgress.personalizedActivities]
  );

  const completeActivity = useCallback(
    async (activityId: string) => {
      const activity = activities.find((item) => item.id === activityId);
      if (!activity) return;
      await commit((current) => completeForToday(current, activity.id, activity.points));
    },
    [activities, commit]
  );

  const uncompleteActivity = useCallback(
    async (activityId: string) => {
      await commit((current) => uncompleteForToday(current, activityId));
    },
    [commit]
  );

  const isActivityCompleted = useCallback(
    (activityId: string) => isCompletedToday(storedProgress, activityId),
    [storedProgress]
  );

  const markOnboardingComplete = useCallback(
    () => commit((current) => ({ ...current, hasSeenOnboarding: true })),
    [commit]
  );

  const savePersonalizedPlan = useCallback(
    (plan: WellnessPlan) =>
      commit((current) => ({
        ...current,
        hasCompletedChat: true,
        personalizedActivities: plan.activities.map((activity, index) => ({
          ...activity,
          id: `personalized-${index + 1}`,
        })),
      })),
    [commit]
  );

  const resetProgress = useCallback(async () => {
    await writeChainRef.current.catch(() => undefined);
    await AsyncStorage.removeItem(STORAGE_KEY);
    progressRef.current = EMPTY_PROGRESS;
    setStoredProgress(EMPTY_PROGRESS);
    setStorageError(null);
  }, []);

  const progress = useMemo<UserProgress>(
    () => ({ ...storedProgress, todayScore: todayScore(storedProgress) }),
    [storedProgress]
  );

  const value = useMemo(
    () => ({
      progress,
      activities,
      isLoading,
      storageError,
      completeActivity,
      uncompleteActivity,
      isActivityCompleted,
      markOnboardingComplete,
      savePersonalizedPlan,
      resetProgress,
    }),
    [
      progress,
      activities,
      isLoading,
      storageError,
      completeActivity,
      uncompleteActivity,
      isActivityCompleted,
      markOnboardingComplete,
      savePersonalizedPlan,
      resetProgress,
    ]
  );

  return <UserProgressContext.Provider value={value}>{children}</UserProgressContext.Provider>;
};

export const useUserProgress = (): UserProgressContextType => {
  const context = useContext(UserProgressContext);
  if (!context) {
    throw new Error("useUserProgress must be used within a UserProgressProvider");
  }
  return context;
};

import { describe, expect, it } from "vitest";

import {
  EMPTY_PROGRESS,
  completeForToday,
  isCompletedToday,
  parseStoredProgress,
  todayScore,
  uncompleteForToday,
} from "../progress";

const morning = new Date(2026, 8, 17, 9, 0, 0);
const evening = new Date(2026, 8, 17, 19, 0, 0);
const tomorrow = new Date(2026, 8, 18, 9, 0, 0);

describe("progress", () => {
  it("completes an activity once per local day", () => {
    const first = completeForToday(EMPTY_PROGRESS, "walk", 10, morning);
    const duplicate = completeForToday(first, "walk", 10, evening);

    expect(duplicate.totalScore).toBe(10);
    expect(duplicate.completedActivities).toHaveLength(1);
    expect(todayScore(duplicate, evening)).toBe(10);
  });

  it("allows the same activity on a later day", () => {
    const first = completeForToday(EMPTY_PROGRESS, "walk", 10, morning);
    const second = completeForToday(first, "walk", 10, tomorrow);

    expect(second.totalScore).toBe(20);
    expect(second.completedActivities).toHaveLength(2);
    expect(todayScore(second, tomorrow)).toBe(10);
  });

  it("removes only today's completion and score", () => {
    const first = completeForToday(EMPTY_PROGRESS, "walk", 10, morning);
    const second = completeForToday(first, "walk", 10, tomorrow);
    const result = uncompleteForToday(second, "walk", tomorrow);

    expect(result.totalScore).toBe(10);
    expect(isCompletedToday(result, "walk", tomorrow)).toBe(false);
    expect(isCompletedToday(result, "walk", morning)).toBe(true);
  });

  it("falls back safely for malformed storage", () => {
    expect(parseStoredProgress("not-json")).toEqual(EMPTY_PROGRESS);
    expect(parseStoredProgress(JSON.stringify({ totalScore: -10 }))).toEqual(EMPTY_PROGRESS);
  });
});

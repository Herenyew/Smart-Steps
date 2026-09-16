import { describe, expect, it } from "vitest";

import { calculateDistanceMeters, isPlausibleLocationStep } from "../location";

describe("location utilities", () => {
  it("calculates a known short distance", () => {
    const distance = calculateDistanceMeters(
      { latitude: 51.5007, longitude: -0.1246 },
      { latitude: 51.5014, longitude: -0.1419 }
    );

    expect(distance).toBeGreaterThan(1100);
    expect(distance).toBeLessThan(1300);
  });

  it("rejects jitter, inaccurate fixes, and implausible jumps", () => {
    expect(
      isPlausibleLocationStep({ distanceMeters: 1, elapsedSeconds: 1, accuracyMeters: 5 })
    ).toBe(false);
    expect(
      isPlausibleLocationStep({ distanceMeters: 10, elapsedSeconds: 2, accuracyMeters: 80 })
    ).toBe(false);
    expect(
      isPlausibleLocationStep({ distanceMeters: 100, elapsedSeconds: 2, accuracyMeters: 5 })
    ).toBe(false);
  });

  it("accepts plausible walking movement", () => {
    expect(
      isPlausibleLocationStep({ distanceMeters: 8, elapsedSeconds: 4, accuracyMeters: 8 })
    ).toBe(true);
  });
});

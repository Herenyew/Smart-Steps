import { describe, expect, it } from "vitest";

import { getStartRoute } from "../start-route";

describe("startup routing", () => {
  it("routes through onboarding, chat, then activities", () => {
    expect(
      getStartRoute({ hasSeenOnboarding: false, hasCompletedChat: false })
    ).toBe("/onboarding");
    expect(
      getStartRoute({ hasSeenOnboarding: true, hasCompletedChat: false })
    ).toBe("/chat");
    expect(
      getStartRoute({ hasSeenOnboarding: true, hasCompletedChat: true })
    ).toBe("/(tabs)/activities");
  });
});

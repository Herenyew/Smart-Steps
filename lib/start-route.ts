export type StartRoute = "/onboarding" | "/chat" | "/(tabs)/activities";

export function getStartRoute(progress: {
  hasSeenOnboarding: boolean;
  hasCompletedChat: boolean;
}): StartRoute {
  if (!progress.hasSeenOnboarding) return "/onboarding";
  if (!progress.hasCompletedChat) return "/chat";
  return "/(tabs)/activities";
}

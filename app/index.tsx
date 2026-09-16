import { useUserProgress } from "@/contexts/UserProgressContext";
import { getStartRoute } from "@/lib/start-route";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function Index() {
  const { isLoading, progress } = useUserProgress();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      router.replace(getStartRoute(progress));
    }
  }, [isLoading, progress, router]);

  return <View style={{ flex: 1 }} />;
}

import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Colors from "@/constants/colors";
import { useUserProgress } from "@/contexts/UserProgressContext";
import { ChatMessage } from "@/lib/chat-contract";
import { requestChatReply } from "@/services/chatApi";
import { Activity, Send } from "lucide-react-native";

interface Message extends ChatMessage {
  id: string;
  planComplete?: boolean;
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { savePersonalizedPlan } = useUserProgress();
  const scrollViewRef = useRef<ScrollView>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 1) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    };

    const conversation = [...messages, userMessage];
    setMessages(conversation);
    setInput("");
    setErrorMessage(null);
    setIsLoading(true);

    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      const result = await requestChatReply(
        conversation.map(({ role, content }) => ({ role, content })),
        controller.signal
      );
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.message,
        planComplete: result.planComplete,
      };

      setMessages((current) => [...current, assistantMessage]);

      if (result.planComplete && result.plan) {
        await savePersonalizedPlan(result.plan);
        redirectTimerRef.current = setTimeout(() => {
          router.replace("/(tabs)/activities");
        }, 1800);
      }
    } catch (error) {
      if (!controller.signal.aborted) {
        setErrorMessage(
          error instanceof Error ? error.message : "The coach could not respond. Please try again."
        );
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false);
      requestControllerRef.current = null;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.safeArea, { paddingTop: insets.top }]} />
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerEmoji}>🏃‍♂️💪</Text>
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => router.push("/(tabs)/activities")}
          >
            <Activity size={20} color={Colors.background} />
            <Text style={styles.navButtonText}>Activities</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>Smart Step Saddeeq</Text>
        <Text style={styles.headerSubtitle}>
          Tell me about your fitness goals and what you like to do! 🎯
        </Text>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 && (
            <View style={styles.emptyState}>
              <Image
                source={require("@/assets/images/saddeeq.png")}
                style={styles.emptyStateImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyStateText}>
                Hi there! I&apos;m Smart Step Saddeeq, your friendly fitness buddy! 🎉
              </Text>
              <Text style={styles.emptyStateSubtext}>
                I&apos;ll help you create a fun wellness plan! Please don&apos;t share names, addresses, school details, medical records, or precise locations. AI suggestions can be wrong, so review the plan with a responsible adult. 🌟
              </Text>
            </View>
          )}

          {messages.map((message) => {
            const isPlanComplete = message.planComplete === true;

            return (
              <View key={message.id} style={styles.messageGroup}>
                <View
                  style={[
                    styles.messageBubble,
                    message.role === "user"
                      ? styles.userBubble
                      : styles.assistantBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === "user"
                        ? styles.userText
                        : styles.assistantText,
                    ]}
                  >
                    {message.content}
                  </Text>
                </View>
                {isPlanComplete && (
                  <View style={styles.successBubble}>
                    <Text style={styles.successText}>
                      ✅ Plan created! Redirecting to activities...
                    </Text>
                  </View>
                )}
              </View>
            );
          })}

          {errorMessage && (
            <TouchableOpacity
              style={styles.errorBubble}
              onPress={() => setErrorMessage(null)}
              accessibilityRole="button"
            >
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Text style={styles.errorHint}>Tap to dismiss, then send again.</Text>
            </TouchableOpacity>
          )}

          {isLoading && (
            <View style={styles.loadingBubble}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            placeholderTextColor={Colors.textLight}
            multiline
            maxLength={500}
            editable={!isLoading}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.background} />
            ) : (
              <Send size={20} color={Colors.background} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    backgroundColor: Colors.primary,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: Colors.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerEmoji: {
    fontSize: 32,
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  navButtonText: {
    color: Colors.background,
    fontSize: 14,
    fontWeight: "700" as const,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: Colors.background,
    textAlign: "center",
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.background,
    textAlign: "center",
    opacity: 0.95,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: Colors.cardBg,
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  emptyStateImage: {
    width: 216,
    height: 216,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: Colors.textLight,
    textAlign: "center",
    lineHeight: 24,
  },
  messageGroup: {
    gap: 8,
    marginBottom: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    backgroundColor: Colors.cardBg,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: Colors.cardBg,
    fontWeight: "600" as const,
  },
  assistantText: {
    color: Colors.text,
    fontWeight: "500" as const,
  },
  toolBubble: {
    alignSelf: "center",
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toolText: {
    fontSize: 13,
    color: Colors.textLight,
    fontWeight: "500" as const,
  },
  successBubble: {
    alignSelf: "center",
    backgroundColor: Colors.success,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
  },
  successText: {
    fontSize: 13,
    color: Colors.background,
    fontWeight: "600" as const,
  },
  errorBubble: {
    alignSelf: "center",
    backgroundColor: "#FEE2E2",
    borderColor: "#EF4444",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  errorText: {
    color: "#991B1B",
    fontSize: 14,
    fontWeight: "600" as const,
    textAlign: "center",
  },
  errorHint: {
    color: "#991B1B",
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
  },
  loadingBubble: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    borderWidth: 3,
    borderColor: Colors.secondary,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textLight,
    fontWeight: "500" as const,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

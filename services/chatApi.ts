import {
  ChatMessage,
  ChatResponse,
  chatResponseSchema,
} from "@/lib/chat-contract";

const REQUEST_TIMEOUT_MS = 30_000;

function getChatUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error(
      "AI chat is not configured. Set EXPO_PUBLIC_API_BASE_URL to the deployed server URL."
    );
  }

  return `${baseUrl}/api/chat`;
}

export async function requestChatReply(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<ChatResponse> {
  const timeoutController = new AbortController();
  const timeout = setTimeout(() => timeoutController.abort(), REQUEST_TIMEOUT_MS);
  const abort = () => timeoutController.abort();
  signal?.addEventListener("abort", abort, { once: true });

  try {
    const response = await fetch(getChatUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("The coach is busy right now. Please wait a moment and try again.");
      }
      throw new Error("The coach could not respond. Please try again.");
    }

    const result = chatResponseSchema.safeParse(await response.json());
    if (!result.success) {
      throw new Error("The coach returned an unexpected response. Please try again.");
    }

    return result.data;
  } catch (error) {
    if (timeoutController.signal.aborted) {
      throw new Error("The request timed out. Check your connection and try again.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abort);
  }
}

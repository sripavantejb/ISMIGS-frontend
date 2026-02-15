import { ISMIGS_SYSTEM_PROMPT } from "./ismigsSystemPrompt";
import { API_BASE } from "@/config/api";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

/**
 * Model IDs known to work with Google AI Studio.
 * Used as fallback when OpenAI is unavailable.
 */
const GEMINI_MODELS_TO_TRY = [
  "gemini-2.5-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash",
];

const QUOTA_EXCEEDED_MESSAGE =
  "API quota exceeded. Please try again in a few minutes.";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Message history format for Gemini chat
 */
export interface ChatMessage {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

/**
 * OpenAI message format
 */
export interface OpenAIMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Try OpenAI API first, fallback to Gemini if OpenAI fails
 */
export async function sendChatMessage(
  history: ChatMessage[],
  userMessage: string,
  context?: string
): Promise<string> {
  // Try OpenAI first
  try {
    const openAIResponse = await tryOpenAI(history, userMessage, context);
    if (openAIResponse) {
      return openAIResponse;
    }
  } catch (openAIError) {
    console.warn("OpenAI request failed, falling back to Gemini:", openAIError);
    // Continue to Gemini fallback
  }

  // Fallback to Gemini
  return tryGemini(history, userMessage, context);
}

/**
 * Try OpenAI API
 */
async function tryOpenAI(
  history: ChatMessage[],
  userMessage: string,
  context?: string
): Promise<string> {
  const currentDateTime = new Date().toISOString();
  const systemInstruction = `${ISMIGS_SYSTEM_PROMPT}\n\n[Current date and time: ${currentDateTime}]`;
  const finalSystemInstruction = context
    ? `${systemInstruction}\n\n[User context: ${context}]`
    : systemInstruction;

  // Convert Gemini history format to OpenAI format
  const openAIHistory: OpenAIMessage[] = history.map((msg) => ({
    role: msg.role === "model" ? "assistant" : "user",
    content: msg.parts[0]?.text || "",
  }));

  const messages: OpenAIMessage[] = [
    { role: "system", content: finalSystemInstruction },
    ...openAIHistory,
    { role: "user", content: userMessage },
  ];

  const response = await fetch(`${API_BASE}/api/openai/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || /invalid.*key|api_key|authorization/i.test(errorText)) {
      throw new Error(
        "OpenAI API key is invalid or not set. Add OPENAI_API_KEY in .env and restart the dev server."
      );
    }
    if (response.status === 429) {
      throw new Error(QUOTA_EXCEEDED_MESSAGE);
    }
    throw new Error(`OpenAI request failed: ${errorText || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();

  if (!text) {
    throw new Error("Empty response from OpenAI API");
  }

  return text;
}

/**
 * Try Gemini API (fallback)
 */
async function tryGemini(
  history: ChatMessage[],
  userMessage: string,
  context?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Neither OpenAI nor Gemini API key is configured. Please set OPENAI_API_KEY or VITE_GEMINI_API_KEY in your .env file."
    );
  }

  const currentDateTime = new Date().toISOString();
  const systemInstruction = `${ISMIGS_SYSTEM_PROMPT}\n\n[Current date and time: ${currentDateTime}]`;
  const finalSystemInstruction = context
    ? `${systemInstruction}\n\n[User context: ${context}]`
    : systemInstruction;

  const contents = [
    ...history.map((msg) => ({
      role: msg.role === "model" ? "model" : "user",
      parts: msg.parts,
    })),
    { role: "user" as const, parts: [{ text: userMessage }] },
  ];

  const body = {
    systemInstruction: {
      parts: [{ text: finalSystemInstruction }],
    },
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
    },
  };

  let lastError: Error | null = null;
  for (const model of GEMINI_MODELS_TO_TRY) {
    const url = `${GEMINI_BASE}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const doRequest = () =>
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

    let res = await doRequest();
    const maxRetries = 2;
    let retries = 0;

    while (res.status === 429 && retries < maxRetries) {
      await res.json().catch(() => null);
      await sleep(4000);
      retries++;
      res = doRequest();
    }

    if (res.status === 429) {
      lastError = new Error(QUOTA_EXCEEDED_MESSAGE);
      continue;
    }

    try {
      if (!res.ok) {
        const errText = await res.text();
        if (res.status === 404) {
          lastError = new Error(`Model ${model} not found`);
          continue;
        }
        if (res.status === 429) {
          lastError = new Error(QUOTA_EXCEEDED_MESSAGE);
          continue;
        }
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const text =
        data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

      if (!text) {
        throw new Error("Empty response from Gemini API");
      }
      return text;
    } catch (err) {
      if (err instanceof Error && err.message === QUOTA_EXCEEDED_MESSAGE) {
        lastError = err;
        continue;
      }
      if (err instanceof Error && err.message.includes("not found")) {
        lastError = err;
        continue;
      }
      if (err instanceof Error) {
        if (err.message.includes("API_KEY") || err.message.includes("401")) {
          throw new Error(
            "Invalid Gemini API key. Please check VITE_GEMINI_API_KEY in your .env file."
          );
        }
        if (err.message.includes("quota") || err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED")) {
          throw new Error(QUOTA_EXCEEDED_MESSAGE);
        }
        throw err;
      }
      throw new Error(`Failed to get response from Gemini: ${String(err)}`);
    }
  }

  throw (
    lastError ||
    new Error(
      "No supported Gemini model available. Check your API key and quota at https://aistudio.google.com"
    )
  );
}

/**
 * Convert UI message format to chat format (works for both OpenAI and Gemini)
 */
export function convertToChatHistory(
  messages: Array<{ role: "user" | "assistant"; content: string }>
): ChatMessage[] {
  return messages
    .filter((msg) => msg.role === "user" || msg.role === "assistant")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));
}

/**
 * Legacy function name for backward compatibility
 */
export const convertToGeminiHistory = convertToChatHistory;


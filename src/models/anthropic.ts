import { $fetch } from "ofetch";
import { env } from "std-env";
import type { DistilledParams } from "../types";

const CLAUDE_BASE_URL = "https://api.openai.com/v1";

export async function anthropic(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const body = {
    model,
    stream: params.stream,
    /* Format: "json", */
    messages: params.messages,
  };
  if (debugCallback) {
    debugCallback(body);
  }

  const res = $fetch("/", {
    baseURL: CLAUDE_BASE_URL,
    body,
    headers: {
      Authorization: `Bearer ${env.CLAUDE_API_KEY}`,
    },
    method: "POST",
    responseType: params.stream ? "stream" : undefined,
  });

  return { content: res as unknown as string | ReadableStream<{ delta: string; total: string }> };
}

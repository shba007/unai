import { $fetch } from "ofetch";
import { env } from "std-env";
import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done_reason: string;
  done: boolean;
  total_duration: number;
  load_duration: number;
  prompt_eval_count: number;
  prompt_eval_duration: number;
  eval_count: number;
  eval_duration: number;
}

export async function ollama(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const body = {
    model,
    stream: params.stream,
    ...(params.format
      ? {
          format: params.format,
        }
      : {}),
    messages: params.messages,
  };
  if (debugCallback) {
    debugCallback(body);
  }
  let status: { code: number; message: string };

  const res = $fetch<OllamaResponse | ReadableStream<Uint8Array>>("/api/chat", {
    baseURL: env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    method: "POST",
    body,
    // @ts-expect-error responseType stream is not typed in ofetch
    responseType: params.stream ? "stream" : undefined,
    onResponseError({ response }) {
      status = { code: response.status, message: response.statusText };
    },
  });

  return {
    content: await res
      .then((data) => {
        if (data instanceof ReadableStream) {
          let delta: string;
          let total: string;

          return mapStream<{ delta: string; total: string }>(data, (streamData: OllamaResponse) => {
            const value = streamData.message.content;
            delta = value;
            total = (total ?? "") + value;

            return { delta, total };
          });
        } else {
          return data.message.content;
        }
      })
      .catch((error) => {
        throw new Error(
          `Ollama Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`,
        );
      }),
  };
}

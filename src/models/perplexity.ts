import { $fetch } from "ofetch";
import { env } from "std-env";

import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";

const PERPLEXITY_BASE_URL = "https://api.perplexity.ai";

export interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations: string[];
  object: string;
  choices: {
    index: number;
    finish_reason: string;
    message: Delta;
    delta: Delta;
  }[];
}

export interface Delta {
  role: string;
  content: string;
}

export async function perplexity(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const body = {
    messages: params.messages.map(({ role, content }) => ({ content: content.text, role })),
    model,
    stream: params.stream,
  };
  if (debugCallback) {
    debugCallback(body);
  }
  let status: { code: number; message: string };

  const res = $fetch<PerplexityResponse | ReadableStream<Uint8Array>>("/chat/completions", {
    baseURL: PERPLEXITY_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.PERPLEXITY_API_KEY}`,
    },
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

          return mapStream<{ delta: string; total: string }>(
            data,
            (streamData: PerplexityResponse) => {
              const value = streamData.choices.at(-1)!.delta?.content ?? "";
              delta = value;
              total = (total ?? "") + value;

              return { delta, total };
            },
          );
        } else {
          return data.choices.at(-1)!.message.content;
        }
      })
      .catch((error) => {
        throw new Error(
          `Perplexity Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`,
        );
      }),
  };
}

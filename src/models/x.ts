import { $fetch } from "ofetch";
import { env } from "std-env";

import type { DistilledParams } from "../types";
import mapStream from "../utils/map-stream";
import convertToBase64 from "../utils/convert-to-base64";

interface XTextResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    delta: { role: string; content: string; refusal: null };
    message: { role: string; content: string; refusal: null };
    logprobs: null;
    finish_reason: string;
  }[];
  system_fingerprint: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    prompt_tokens_details: {
      cached_tokens: number;
      audio_tokens: number;
    };
    completion_tokens_details: {
      reasoning_tokens: number;
      audio_tokens: number;
      accepted_prediction_tokens: number;
      rejected_prediction_tokens: number;
    };
  };
}

const X_BASE_URL = "https://api.x.ai/v1";

async function text(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const messages = await Promise.all(
      params.messages.map(async ({ role, content }) => ({
        content: await Promise.all([
          { text: content.text, type: "text" },
          ...content.images.map(async (url) => ({
            image_url: { url: await convertToBase64(url) },
            type: "image_url",
          })),
        ]),
        role,
      })),
    ),
    body = {
      model,
      stream: params.stream,
      ...(params.format
        ? {
            response_format: {
              json_schema: {
                name: "unique_response",
                schema: params.format,
                strict: true,
              },
              type: "json_schema",
            },
          }
        : {}),
      messages,
    };
  if (debugCallback) {
    debugCallback(body);
  }
  let status: { code: number; message: string };

  const res = $fetch<XTextResponse | ReadableStream<Uint8Array>>("/chat/completions", {
    baseURL: X_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.X_API_KEY}`,
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
          let delta: string, total: string;

          return mapStream<{ delta: string; total: string }>(data, (streamData: XTextResponse) => {
            const value = streamData.choices.at(-1)!.delta?.content ?? "";
            delta = value;
            total = (total ?? "") + value;

            return { delta, total };
          });
        }
        return data.choices.at(-1)!.message.content;
      })
      .catch((error) => {
        throw new Error(
          `X Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`,
        );
      }),
  };
}

export { text };

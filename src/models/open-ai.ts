import { $fetch } from "ofetch";
import { env } from "std-env";
import { fileTypeFromBuffer } from "file-type";

import type { DistilledParams, DistilledToolParams } from "../types";
import mapStream from "../utils/map-stream";
import convertToBase64 from "../utils/convert-to-base64";

interface OpenAITextResponse {
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

const OPENAI_BASE_URL = "https://api.openai.com/v1";

async function text(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const messages = await Promise.all(
    params.messages.map(async ({ role, content }) => ({
      role,
      content: await Promise.all([
        content?.text ? { type: "text", text: content.text } : {},
        ...(content?.images
          ? content.images.map(async (url) => {
              return {
                type: "image_url",
                image_url: { url: await convertToBase64(url) },
              };
            })
          : []),
      ]),
    })),
  );

  const body = {
    model,
    stream: params.stream,
    ...(params.format
      ? {
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "unique_response",
              strict: true,
              schema: params.format,
            },
          },
        }
      : {}),
    messages,
  };
  if (debugCallback) debugCallback(body);
  let status: { code: number; message: string };

  const res = $fetch<OpenAITextResponse | ReadableStream<Uint8Array>>("/chat/completions", {
    baseURL: OPENAI_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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
          let delta = "";
          let total = "";

          return mapStream<{ delta: string; total: string }>(
            data,
            (streamData: OpenAITextResponse) => {
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
          `OpenAI Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`,
        );
      }),
  };
}

interface OpenAIToolResponse {
  id: string;
  object: string;
  created_at: number;
  status: string;
  error: null;
  incomplete_details: null;
  instructions: null;
  max_output_tokens: null;
  model: string;
  output: {
    type: string;
    id: string;
    call_id: string;
    name: string;
    arguments: string;
    status: string;
  }[];
  parallel_tool_calls: boolean;
  previous_response_id: null;
  reasoning: {
    effort: null;
    generate_summary: null;
  };
  store: boolean;
  temperature: number;
  text: {
    format: {
      type: string;
    };
  };
  tool_choice: string;
  tools: {
    type: "function";
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: {
        [key: string]: {
          type: string;
        };
      };
      required: string[];
      additionalProperties: boolean;
    };
    strict: boolean;
  }[];
  top_p: number;
  truncation: string;
  usage: {
    input_tokens: number;
    input_tokens_details: {
      cached_tokens: number;
    };
    output_tokens: number;
    output_tokens_details: {
      reasoning_tokens: number;
    };
    total_tokens: number;
  };
  user: null;
  metadata: Record<string, any>;
}

export interface OpenAIToolCall {
  type: "function_call";
  id: string;
  call_id: string;
  name: string;
  arguments: string;
  status: string;
}

async function tool(
  model: string,
  params: DistilledToolParams,
  debugCallback?: (body: object) => void,
) {
  const messages = await Promise.all(
    params.messages.map(
      async ({ role, content, type, call_id, id, name, arguments: args, status, output }) =>
        role
          ? {
              role,
              content: content?.text ?? content,
            }
          : {
              type,
              id,
              call_id,
              name,
              arguments: args,
              status,
              output,
            },
    ),
  );

  const isToolCall = params.tools !== undefined;

  const body = isToolCall
    ? {
        model,
        stream: params.stream,
        input: messages.map(
          ({ role, content, type, call_id, id, name, arguments: args, status, output }) =>
            role ? { role, content } : { type, call_id, id, name, arguments: args, status, output },
        ),
        tools: Object.entries(params.tools).map(([name, toolItem]) => {
          const { description, parameters, strict } = toolItem.definition;

          const properties: Record<string, { type: string }> = {};
          for (const paramKey of Object.keys(parameters)) {
            properties[paramKey] = { type: parameters[paramKey].type };
          }

          const required = Object.keys(parameters).filter(
            (paramKey) => parameters[paramKey].required,
          );

          return {
            type: "function",
            name,
            description,
            parameters: {
              type: "object",
              properties,
              required,
              additionalProperties: false,
            },
            strict,
          };
        }),
      }
    : {
        model,
        stream: params.stream,
        ...(params.format
          ? {
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "unique_response",
                  strict: true,
                  schema: params.format,
                },
              },
            }
          : {}),
        input: messages,
      };
  if (debugCallback) debugCallback(body);
  let status: { code: number; message: string };

  const res = $fetch<OpenAIToolResponse | ReadableStream<Uint8Array>>("/responses", {
    baseURL: OPENAI_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
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
          let delta = "";
          let total = "";

          return mapStream<{ delta: string; total: string }>(
            data,
            (streamData: OpenAIToolResponse) => {
              const value = streamData.choices.at(-1)!.delta?.content ?? "";
              delta = value;
              total = (total ?? "") + value;

              return { delta, total };
            },
          );
        } else {
          return "output" in data ? data.output : [];
        }
      })
      .catch((error) => {
        throw new Error(
          `OpenAI Fetch Failed ${status.code} ${status.message} - ${JSON.stringify(error.data, undefined, 2)}`,
        );
      }),
  };
}

interface OpenAIAudioResponse {
  text: string;
}

async function audioTranscribe(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const buffer = Buffer.from(params.messages.at(-1)!.content.audios.at(-1)!);
  const fileType = await fileTypeFromBuffer(buffer);
  const blob = new Blob([buffer], { type: fileType?.mime });

  const body = new FormData();
  body.append("file", blob);
  body.append("model", model);

  if (debugCallback) debugCallback(body);

  const res = $fetch<OpenAIAudioResponse>("/audio/transcriptions", {
    baseURL: OPENAI_BASE_URL,
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body,
    onResponseError({ response }) {
      throw new Error(`OpenAI Fetch Failed ${response.status} ${response.statusText}`);
    },
  });

  return {
    content: await res.then((data) => {
      return data.text;
    }),
  };
}

async function audioGenerate(
  model: string,
  params: DistilledParams,
  debugCallback?: (body: object) => void,
) {
  const persona = "alloy";
  const body = {
    model,
    input: params.messages.at(-1),
    voice: persona,
  };

  if (debugCallback) debugCallback(body);

  const res = $fetch<ArrayBuffer>("/audio/speech", {
    baseURL: OPENAI_BASE_URL,
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body,
    responseType: "arrayBuffer",
  });

  return {
    content: await res.then((data) => {
      return data;
    }),
  };
}

export { text, tool, audioTranscribe, audioGenerate };

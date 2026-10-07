import zodToJsonSchema from "zod-to-json-schema";
import { openAI } from "../models";
import type { BasicMessage, DistilledToolMessage, DistilledToolParams, ToolParams } from "../types";
import formatJSONSchema from "../utils/format-json-schema";
import type { OpenAIToolCall } from "../models/open-ai";
// Import consola from 'consola'

type ToolUseModelOpenAIModel =
  | "@OpenAI/gpt-4o:2024-05-13"
  | "@OpenAI/gpt-4o:2024-08-06"
  | "@OpenAI/gpt-4o:2024-11-20"
  | "@OpenAI/gpt-4o:latest";

export type ToolUseModel = ToolUseModelOpenAIModel;

export async function toolUse<T = string>(
  model: ToolUseModel,
  params: ToolParams,
  debugCallback?: (body: object) => void,
) {
  let finalResult, initialResult;

  params.messages =
    "prompt" in params
      ? ([{ content: params.prompt, role: "user" }] as BasicMessage[])
      : params.messages.map<BasicMessage>(({ role, content }) =>
          typeof content === "string"
            ? {
                content,
                role,
              }
            : { content, role },
        );

  const distilledParams: DistilledToolParams = {
    format: params.format ? zodToJsonSchema(params.format as Zod.AnyZodObject) : undefined,
    messages: params.messages as unknown as DistilledToolMessage[],
    stream: params.stream ?? false,
    tools: params.tools ?? [],
  };

  switch (model) {
    case "@OpenAI/gpt-4o:2024-05-13":
    case "@OpenAI/gpt-4o:2024-08-06":
    case "@OpenAI/gpt-4o:2024-11-20":
    case "@OpenAI/gpt-4o:latest": {
      distilledParams.format = formatJSONSchema("OpenAI", distilledParams.format);
      const modelName = model
        .split("/")
        .slice(1)
        .join("/")
        .replace(":latest", "")
        .replace(":", "-");
      initialResult = await openAI.tool(modelName, distilledParams, debugCallback);

      if (!initialResult || initialResult.content instanceof ReadableStream) {
        return;
      }

      distilledParams.messages.push(...(initialResult.content as unknown as OpenAIToolCall[]));

      const promiseQue: Promise<any>[] = [];
      for (const {
        type,
        name,
        arguments: toolArgs,
        call_id,
      } of initialResult.content as unknown as OpenAIToolCall[]) {
        if (type !== "function_call") {
          continue;
        }

        for (const [funcName, funcItem] of Object.entries(params.tools)) {
          if (funcName !== name) {
            continue;
          }

          const args = JSON.parse(toolArgs);
          // Consola({ args })

          promiseQue.push(
            funcItem
              .function(args)
              .then((value) => ({ call_id, value }))
              .catch(() => {
                throw { call_id };
              }),
          );
        }
      }

      for (const { status, value } of await Promise.allSettled(promiseQue)) {
        if (status === "rejected") {
          continue;
        }

        distilledParams.messages.push({
          call_id: value.call_id,
          output: value.value.toString(),
          type: "function_call_output",
        });
      }

      finalResult = await openAI.tool(modelName, distilledParams, debugCallback);
      break;
    }
    default: {
      throw new Error("Enter a valid model name");
    }
  }

  if (!finalResult) {
    throw new Error("result is undefined");
  }

  const formattedResult = await finalResult,
    content = (
      params.format && !(formattedResult.content instanceof ReadableStream)
        ? JSON.parse(formattedResult.content)
        : formattedResult.content
    ) as T;
  // Consola.log({ content })

  return formattedResult.content instanceof ReadableStream
    ? ({
        content,
      } as {
        content: ReadableStream<{
          delta: string;
          total: string;
        }>;
      })
    : ({
        content: content.flatMap((item) => item.content),
      } as { content: T });
}

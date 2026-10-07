import { openAI } from "../models";
import type { DistilledParams, Params } from "../types";

type AudioGenerateModelOpenAIModel = "@OpenAI/tts-1";

export type AudioOpenAIVoicePreset =
  | "@OpenAI/alloy"
  | "@OpenAI/ash"
  | "@OpenAI/coral"
  | "@OpenAI/echo"
  | "@OpenAI/fable"
  | "@OpenAI/onyx"
  | "@OpenAI/nova"
  | "@OpenAI/sage"
  | "@OpenAI/shimmer";

export type AudioGenerateModel = AudioGenerateModelOpenAIModel;

export async function audioGenerate(
  model: AudioGenerateModel,
  params: Params,
  debugCallback?: (body: object) => void,
) {
  let result;

  switch (model) {
    case "@OpenAI/tts-1": {
      const modelName = model
        .split("/")
        .slice(1)
        .join("/")
        .replace(":latest", "")
        .replace(":", "-");

      result = openAI.audioGenerate(modelName, params as DistilledParams, debugCallback);
      break;
    }
    default: {
      throw new Error("Enter a valid model name");
    }
  }

  const finalResult = await result;

  return { content: finalResult.content };
}

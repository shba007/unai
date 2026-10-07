import { exit } from "node:process";
import { z } from "zod";
import { initAI } from "../src";

const ai = initAI(),
  // NOTE: responseSchema should always be and z object
  responseSchema = z.object({
    timeline: z.array(
      z.object({
        color: z.string(),
        time: z.string().datetime(),
      }),
    ),
  }),
  result = await ai.run<z.infer<typeof responseSchema>>(
    "text-generate",
    "@Google/gemini-2.0-flash-lite",
    {
      format: responseSchema,
      prompt: "What is the sky color in every 6 hour",
      stream: false,
    },
  );

if (result.content instanceof ReadableStream) {
  exit(0);
}

console.log({ result: result.content.timeline });

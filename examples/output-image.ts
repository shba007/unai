import { initAI } from "../src";

const ai = initAI(),
  result = await ai.run("image-generation", "@Google/gemini-1.5-flash-8b", {
    prompt: "Draw a sky",
  });

console.log({ result: result.content });

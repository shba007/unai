import fs from "node:fs";
import { initAI } from "../src";

const ai = initAI(),
  filePath = "./examples/prompt1.wav",
  audioBuffer = fs.readFileSync(filePath),
  result = await ai.run("audio-transcribe", "@OpenAI/whisper-v2", {
    messages: [
      {
        content: {
          // Audios: ['file://test.mp3],
          audios: [audioBuffer],
        },
        role: "user",
      },
    ],
  });

console.log({ result: result.content });

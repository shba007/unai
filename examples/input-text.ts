import fs from "node:fs";
import { initAI } from "../src";

const ai = initAI(),
  result = await ai.run(
    "text-generate",
    "@Google/gemini-2.0-flash-lite",
    {
      messages: [
        {
          content: "reply in one word",
          role: "system",
        },
        {
          content: "What is the sky color",
          role: "user",
        },
        {
          content: "Blue",
          role: "assistant",
        },
        {
          content: "What is the sea color",
          role: "user",
        },
      ],
    },
    (body: object) => {
      fs.writeFileSync("./dump-body.json", JSON.stringify(body, undefined, 2));
    },
  );

console.log({ result: result.content });

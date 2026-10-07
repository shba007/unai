import { describe, expect, test } from "vitest";
import { initAI } from "../src";

describe("Text Generate", () => {
  const ai = initAI();

  test("Sanity Test", async () => {
    expect(true).toBe(true);
  });

  /*   Test('Ollama', async () => {
      // Run the AI text generation with a set of messages.
      const result = await ai.run(
        'text-generate',
        '@Ollama/Meta/llama3.2:3b',
        {
          messages: [
            {
              role: 'system',
              content: 'reply in one word',
            },
            {
              role: 'user',
              content: 'What is the tree color',
            },
            {
              role: 'assistant',
              content: 'Green',
            },
            {
              role: 'user',
              content: 'What is the sky color',
            },
          ],
        }
      );
  
      expect(result).toHaveProperty('content');
      expect(result.content).toMatch(/blue/i);
  
      console.log({ result: result.content });
    }); */

  test("Gemini", async () => {
    // Run the AI text generation with a set of messages.
    const result = await ai.run("text-generate", "@Google/gemini-1.5-flash-8b", {
      messages: [
        {
          content: "reply in one word",
          role: "system",
        },
        {
          content: "What is the tree color",
          role: "user",
        },
        {
          content: "Green",
          role: "assistant",
        },
        {
          content: "What is the sky color",
          role: "user",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });
  });

  test("OpenAI", async () => {
    // Run the AI text generation with a set of messages.
    const result = await ai.run("text-generate", "@OpenAI/o3-mini:latest", {
      messages: [
        {
          content: "reply in one word",
          role: "system",
        },
        {
          content: "What is the tree color",
          role: "user",
        },
        {
          content: "Green",
          role: "assistant",
        },
        {
          content: "What is the sky color",
          role: "user",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });
  });

  test("Perplexity", async () => {
    // Run the AI text generation with a set of messages.
    const result = await ai.run("text-generate", "@Perplexity/sonar", {
      messages: [
        {
          content: "reply in one word",
          role: "system",
        },
        {
          content: "What is the tree color",
          role: "user",
        },
        {
          content: "Green",
          role: "assistant",
        },
        {
          content: "What is the sky color",
          role: "user",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });
  });

  /*Test('Anthropic', async () => {
     // Run the AI text generation with a set of messages.
     const result = await ai.run(
       'text-generate',
       '@X/grok-2:1212',
       {
         messages: [
             {
             role: 'system',
             content: 'reply in one word',
           },
           {
             role: 'user',
             content: 'What is the tree color',
           },
           {
             role: 'assistant',
             content: 'Green',
           },
           {
             role: 'user',
             content: 'What is the sky color',
           },
         ],
       }
     );
 
     expect(result).toHaveProperty('content');
     expect(result.content).toMatch(/blue/i);
 
     console.log({ result: result.content }); 
  });*/

  test("Grok", async () => {
    // Run the AI text generation with a set of messages.
    const result = await ai.run("text-generate", "@X/grok-2:1212", {
      messages: [
        {
          content: "reply in one word",
          role: "system",
        },
        {
          content: "What is the tree color",
          role: "user",
        },
        {
          content: "Green",
          role: "assistant",
        },
        {
          content: "What is the sky color",
          role: "user",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });
  });

  test("Groq", async () => {
    // Run the AI text generation with a set of messages.
    const result = await ai.run("text-generate", "@Groq/llama3-70b-8192", {
      messages: [
        {
          content: "What is the tree color",
          role: "user",
        },
        {
          content: "Green",
          role: "assistant",
        },
        {
          content: "What is the sky color",
          role: "user",
        },
      ],
    });

    expect(result).toHaveProperty("content");
    expect(result.content).toMatch(/blue/i);

    console.log({ result: result.content });
  });
});

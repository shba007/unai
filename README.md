# unai

[![npm version](https://img.shields.io/npm/v/@shba007/unai?color=blue)](https://npmjs.com/package/@shba007/unai)
[![npm downloads](https://img.shields.io/npm/dm/@shba007/unai?color=blue)](https://npmjs.com/package/@shba007/unai)
[![License](https://img.shields.io/npm/l/@shba007/unai?color=blue)](https://github.com/shba007/unai?tab=MIT-1-ov-file)

> Unified AI Adapter Library. For Ollama, Gemini, Openai

## How to Use

Install package:

```sh
# ✨ Auto-detect
npx nypm install @shba007/unai

# npm
npm install @shba007/unai

# yarn
yarn add @shba007/unai

# pnpm
pnpm install @shba007/unai

# bun
bun install @shba007/unai
```

Code:

**No Stream**

```ts
import { initAI } from "@shba007/unai";

const ai = initAI();

const result = await ai.run("@Google/gemini-1.5-flash-8b", {
  prompt: "What is the sky color",
});

console.log({ result: result.content });
```

**Stream**

```ts
import { initAI, readStream } from "@shba007/unai";

const ai = initAI();

const result = await ai.run("@Google/gemini-1.5-flash-8b", {
  prompt: "write 1 to 100",
  stream: true,
});

readStream(result.content, ({ delta, total }) => {
  process.stdout.write(delta);
});
```

## Todo

| **Feature**                | **Ollama** | **Gemini** | **OpenAI** | **Perplexity** | **Anthropic** | **X** | **Groq** |
| -------------------------- | ---------- | ---------- | ---------- | -------------- | ------------- | ----- | -------- |
| Text (Unstructured) Input  | ✅         | ✅         | ✅         | ✅             | ❌            | ✅    | ✅       |
| Text (Structured) Input    | ✅         | ✅         | ✅         | ✅             | ❌            | ✅    | ❌       |
| Text (Unstructured) Output | ✅         | ✅         | ✅         | ✅             | ❌            | ✅    | ❌       |
| Text (Structured) Output   | ✅         | ✅         | ✅         | ❌             | ❌            | ❌    | ❌       |
| Streamed Response          | ✅         | ✅         | ✅         | ✅             | ❌            | ✅    | ❌       |
| Document Input             | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |
| Document Output            | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |
| Image Input                | ❌         | ❌         | ✅         | ❌             | ❌            | ❌    | ❌       |
| Image Output               | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |
| Audio Input                | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |
| Audio Output               | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |
| JSON Mode                  | ✅         | ✅         | ✅         | ❌             | ❌            | ❌    | ❌       |
| Function Calling/Tool Use  | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |
| Memory (STM/LTM)           | ❌         | ❌         | ❌         | ❌             | ❌            | ❌    | ❌       |

# System Role Support

<!-- - @OpenAI/o1-mini:2024-09-12
- @OpenAI/o1-mini:latest
- @OpenAI/o1-preview:2024-09-12
- @OpenAI/o1-preview:latest -->

- @OpenAI/o1:2024-12-17
- @OpenAI/o1:latest
- @OpenAI/o3-mini:2025-01-31
- @OpenAI/o3-mini:latest
- @Perplexity/sonar

# Structured Output Support

- gpt-4o-mini-2024-07-18 and later
- gpt-4o-2024-08-06 and later
- o1-2024-12-17 and later
- o3-mini-2025-1-31 and later

# Input Image Support

- gpt-4o-mini-2024-07-18 and later
- gpt-4o-2024-08-06 and later
- o1-2024-12-17 and later

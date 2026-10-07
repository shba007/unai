import fs from "node:fs";
import { initAI } from "../src";
import type { Tool } from "../src/types";

const ai = initAI(),
  tools: Record<string, Tool> = {
    getExchangeRate: {
      definition: {
        description: "Get the exchange rate from one currency to another.",
        parameters: {
          from: { required: true, type: "string" },
          to: { required: true, type: "string" },
        },
        strict: true,
      },
      function: async ({ from, to }: { from: string; to: string }) => {
        // Console.log(`getExchangeRate ${from} ${to}`)
        const response = await fetch(`https://open.er-api.com/v6/latest/${from}`),
          data = await response.json();
        return data.rates[to];
      },
    },
    getJoke: {
      definition: {
        description: "Get a random joke.",
        parameters: {},
        strict: true,
      },
      function: async () => {
        console.log(`getJoke`);
        const response = await fetch("https://official-joke-api.appspot.com/random_joke"),
          data = await response.json();
        return `${data.setup} ${data.punchline}`;
      },
    },
    getTime: {
      definition: {
        description: "Get the current server time in ISO format.",
        parameters: {},
        strict: true,
      },
      function: async () => {
        console.log(`getTime`);
        return new Date().toISOString();
      },
    },
    getWeather: {
      definition: {
        description: "Get current temperature for provided coordinates in celsius.",
        parameters: {
          latitude: { required: true, type: "number" },
          longitude: { required: true, type: "number" },
        },
        strict: true,
      },
      function: async ({ latitude, longitude }: { latitude: number; longitude: number }) => {
        console.log(`getWeather called with ${latitude} ${longitude}`);
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m`,
          ),
          data = await response.json();
        return data.current.temperature_2m;
      },
    },
  },
  result = await ai.run(
    "tool-use",
    "@OpenAI/gpt-4o:latest",
    {
      messages: [
        {
          content:
            "What is the weather like in Paris and Kolkata today? Tell me a joke with current time? get the exchange rate of inr to usd",
          role: "user",
        },
      ],
      stream: false,
      tools,
    },
    (body: object) => {
      fs.writeFileSync("./dump-body.json", JSON.stringify(body, undefined, 2));
    },
  );

console.log({ result: result.content });

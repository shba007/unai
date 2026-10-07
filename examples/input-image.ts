import { initAI } from "../src";

const ai = initAI(),
  imageIds = ["4e76ccc5-8381-4b21-be22-636808e7b7c8", "a9193fed-769a-47bd-ac70-afceb8ff5295"],
  result = await ai.run("image-caption", "@OpenAI/o1:latest", {
    messages: [
      {
        content: {
          images: imageIds.map(
            (id) =>
              `https://ucarecdn.com/${id}/-/format/auto/-/quality/smart/-/scale_crop/1280x1920/center/`,
          ),
          text: "Write the alt text for seo for each image",
        },
        role: "user",
      },
    ],
  });

console.log({ result: result.content });

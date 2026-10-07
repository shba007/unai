export default function <T>(stream: ReadableStream<Uint8Array>, mapFunction: (value: any) => T) {
  const reader = stream.getReader(),
    decoder = new TextDecoder();
  let partialData = ""; // Buffer to hold incomplete chunks

  return new ReadableStream<T>({
    async start(controller) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Process any remaining buffered data
          if (partialData.trim().length > 0) {
            processAndEnqueue(partialData, controller);
          }
          controller.close();
          break;
        }

        // Append new decoded text to the buffer
        partialData += decoder.decode(value, { stream: true });

        // Split into complete parts; last part may be incomplete
        const parts = partialData.split(/\r\n|\n\n/);
        partialData = parts.pop() ?? "";

        for (const chunk of parts) {
          processAndEnqueue(chunk, controller);
        }
      }
    },
  });

  function processAndEnqueue(chunk: string, controller: ReadableStreamDefaultController<T>) {
    // Ensure the chunk has the expected prefix length
    if (chunk.length <= 6) {
      return;
    }
    try {
      // Remove the prefix (e.g. "data: ") and parse JSON
      const parsedChunk = JSON.parse(chunk.slice(6)) as T,
        mappedChunk = mapFunction(parsedChunk);
      if (mappedChunk) {
        controller.enqueue(mappedChunk);
      }
    } catch {
      // Optionally log or handle parsing errors here
    }
  }
}

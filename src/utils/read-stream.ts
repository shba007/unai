export default function <T>(stream: ReadableStream<T>, readFunction: (value: T) => void) {
  return new Promise<void>((resolve) => {
    const reader = stream.getReader();

    reader
      .read()
      .then(function processText({ done, value }): any {
        if (done) {
          return;
        }

        readFunction(value);

        return reader.read().then(processText);
      })
      .finally(() => {
        resolve();
      });
  });
}

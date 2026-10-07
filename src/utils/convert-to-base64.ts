import { $fetch } from "ofetch";
import pathe from "pathe";
import { storage } from "../storage";

const getBufferPrefix = (mimeType: string) => `data:${mimeType};base64,`;

/**
 * Converts a file path or URL to a Base64-encoded string.
 * @param path - The file path or URL.
 * @param convertUrl - Whether to convert URLs to Base64. Defaults to true.
 * @returns A promise that resolves to the Base64-encoded string.
 */
export default async function (path: string, convertUrl = true): Promise<string> {
  try {
    if (path.startsWith("file://")) {
      const filePath = path.slice(7);
      const fileBuffer = (await storage.getItemRaw(pathe.resolve(filePath))) as ArrayBuffer;
      if (!fileBuffer) {
        throw new Error(`File not found: ${filePath}`);
      }
      const mimeType = "image/jpeg";
      return getBufferPrefix(mimeType) + Buffer.from(fileBuffer).toString("base64");
    } else if (path.startsWith("http://") || path.startsWith("https://")) {
      if (!convertUrl) return path;
      const response = await $fetch(path, { responseType: "arrayBuffer" });
      const buffer = Buffer.from(response);
      const mimeType = "image/jpeg";
      return getBufferPrefix(mimeType) + buffer.toString("base64");
    } else {
      throw new Error('Invalid path: must start with "file://", "http://", or "https://".');
    }
  } catch (error: any) {
    throw new Error(`Failed to convert to Base64: ${error.message}`, { cause: error });
  }
}

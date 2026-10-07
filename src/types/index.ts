export type Role = "system" | "user" | "developer" | "assistant";

export interface Tool {
  definition: {
    description: string;
    parameters: Record<string, { type: string; required: boolean }>;
    strict: boolean;
  };
  function: (...args: any[]) => Promise<any>;
}

export interface BasicMessage {
  role: Role;
  content: string;
}

export interface DetailedMessage {
  role?: Role;
  content?: { audios?: (string | Buffer<ArrayBufferLike>)[]; text?: string; images?: string[] };
}

export interface BaseParams {
  stream?: boolean;
  format?: object;
}

export interface PromptParams extends BaseParams {
  prompt: string; // Only prompt is allowed
  messages?: never;
}

export interface MessageParams extends BaseParams {
  prompt?: never;
  messages: (BasicMessage | DetailedMessage)[]; // Only messages are allowed
}

export interface ToolParams extends BaseParams {
  prompt?: string;
  messages: BasicMessage[]; // Only messages are allowed
  tools: Record<string, Tool>;
}

export type Params = PromptParams | MessageParams | ToolParams;

export interface DistilledDetailedMessage {
  role: Role;
  content: { audios: Buffer<ArrayBufferLike>[]; text: string; images: string[] };
}

export interface DistilledParams {
  stream: boolean;
  messages: DistilledDetailedMessage[];
  format: any;
  tools: Record<string, Tool>;
}

export interface DistilledToolMessage {
  role?: Role;
  content?: { text?: string };
  type?: "function_call" | "function_call_output";
  call_id: string;
  output: string;
}

export interface DistilledToolParams {
  stream: boolean;
  messages: DistilledToolMessage[];
  format: any;
  tools: Record<string, Tool>;
}

import { randomUUID } from "crypto";
import {
  FinishReason,
  FunctionCallingConfigMode,
  GoogleGenAI,
  ThinkingLevel,
  type Content,
  type FunctionDeclaration,
  type GenerateContentConfig,
  type GenerateContentResponse,
  type Part,
  type ThinkingConfig,
  type Tool as GeminiTool,
  type ToolConfig as GeminiToolConfig,
} from "@google/genai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4" ;
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  model?: string;
  thinking?: Record<string, unknown>;
  reasoning?: Record<string, unknown>;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// Gemini has no server-side default model; callers in this codebase always
// pass one, but this keeps invokeLLM from throwing an unhelpful error if one
// is ever omitted.
const DEFAULT_MODEL = "gemini-3.6-flash";
const DEFAULT_MAX_TOKENS = 8192;
const EFFORT_LEVELS = new Set(["low", "medium", "high", "xhigh", "max"]);

let cachedClient: GoogleGenAI | null = null;

const getClient = (): GoogleGenAI => {
  if (!ENV.geminiApiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey: ENV.geminiApiKey });
  }
  return cachedClient;
};

const toGeminiPart = (part: MessageContent): Part => {
  if (typeof part === "string") {
    return { text: part };
  }

  if (part.type === "text") {
    return { text: part.text };
  }

  if (part.type === "image_url") {
    return { fileData: { fileUri: part.image_url.url } };
  }

  if (part.type === "file_url") {
    if (part.file_url.mime_type) {
      return { fileData: { fileUri: part.file_url.url, mimeType: part.file_url.mime_type } };
    }
    throw new Error("File content requires a mime_type for the Gemini API");
  }

  throw new Error("Unsupported message content part");
};

// Gemini keeps the system prompt in a separate top-level field, uses "model"
// instead of "assistant" for the model's own turns, and represents a tool
// result as a functionResponse part on a "user" turn rather than a
// dedicated "tool" role — this reshapes the OpenAI-style flat message list
// accordingly.
const buildGeminiRequest = (
  messages: Message[]
): { systemInstruction?: string; contents: Content[] } => {
  const systemParts: string[] = [];
  const contents: Content[] = [];

  for (const message of messages) {
    if (message.role === "system") {
      const text = ensureArray(message.content)
        .map(part => (typeof part === "string" ? part : part.type === "text" ? part.text : ""))
        .filter(Boolean)
        .join("\n");
      if (text) systemParts.push(text);
      continue;
    }

    if (message.role === "tool" || message.role === "function") {
      const responseText = ensureArray(message.content)
        .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
        .join("\n");
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name: message.name ?? "tool_result", response: { output: responseText } } }],
      });
      continue;
    }

    contents.push({
      role: message.role === "assistant" ? "model" : "user",
      parts: ensureArray(message.content).map(toGeminiPart),
    });
  }

  return {
    systemInstruction: systemParts.length ? systemParts.join("\n\n") : undefined,
    contents,
  };
};

const toGeminiTools = (tools: Tool[] | undefined): GeminiTool[] | undefined => {
  if (!tools || tools.length === 0) return undefined;
  const functionDeclarations: FunctionDeclaration[] = tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    parametersJsonSchema: tool.function.parameters ?? { type: "object", properties: {} },
  }));
  return [{ functionDeclarations }];
};

const toGeminiToolConfig = (
  toolChoice: "none" | "auto" | ToolChoiceExplicit | undefined
): GeminiToolConfig | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none") return { functionCallingConfig: { mode: FunctionCallingConfigMode.NONE } };
  if (toolChoice === "auto") return { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } };
  return { functionCallingConfig: { mode: FunctionCallingConfigMode.ANY, allowedFunctionNames: [toolChoice.function.name] } };
};

// The `reasoning: { effort }` shape mirrors OpenAI's reasoning-effort models;
// Gemini's closest equivalent is thinkingLevel. Verified directly against the
// live API: the older numeric thinkingBudget (e.g. thinkingBudget: 0 to
// disable thinking) is REJECTED with a 400 INVALID_ARGUMENT on gemini-3.6-flash
// — this model generation only accepts the newer thinkingLevel enum
// (MINIMAL/LOW/MEDIUM/HIGH). There's no direct analogue for every effort
// level, so only "low" (the only value this codebase actually sends) is
// translated, to the lowest available level. An explicit `thinking` block
// (already Gemini-shaped) is passed through as-is.
const toThinkingConfig = (
  thinking: Record<string, unknown> | undefined,
  reasoning: Record<string, unknown> | undefined
): ThinkingConfig | undefined => {
  if (thinking) return thinking as unknown as ThinkingConfig;
  if (reasoning?.effort === "low") return { thinkingLevel: ThinkingLevel.MINIMAL };
  return undefined;
};

const toFinishReason = (finishReason: FinishReason | undefined): string | null => {
  switch (finishReason) {
    case undefined:
    case FinishReason.FINISH_REASON_UNSPECIFIED:
      return null;
    case FinishReason.STOP:
      return "stop";
    case FinishReason.MAX_TOKENS:
      return "length";
    case FinishReason.SAFETY:
    case FinishReason.PROHIBITED_CONTENT:
    case FinishReason.BLOCKLIST:
    case FinishReason.SPII:
    case FinishReason.RECITATION:
      return "content_filter";
    case FinishReason.MALFORMED_FUNCTION_CALL:
    case FinishReason.UNEXPECTED_TOOL_CALL:
      return "tool_calls";
    default:
      return finishReason;
  }
};

const toInvokeResult = (response: GenerateContentResponse, model: string): InvokeResult => {
  const candidate = response.candidates?.[0];
  const toolCalls: ToolCall[] = (response.functionCalls ?? []).map((call, index) => ({
    id: call.id ?? `${response.responseId ?? "call"}_${index}`,
    type: "function",
    function: { name: call.name ?? "", arguments: JSON.stringify(call.args ?? {}) },
  }));

  return {
    id: response.responseId ?? randomUUID(),
    created: Math.floor(Date.now() / 1000),
    model: response.modelVersion ?? model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: response.text ?? "",
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: toFinishReason(candidate?.finishReason),
      },
    ],
    usage: {
      prompt_tokens: response.usageMetadata?.promptTokenCount ?? 0,
      completion_tokens: response.usageMetadata?.candidatesTokenCount ?? 0,
      total_tokens: response.usageMetadata?.totalTokenCount ?? 0,
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const client = getClient();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
    model,
    thinking,
    reasoning,
    maxTokens,
    max_tokens,
  } = params;

  const { systemInstruction, contents } = buildGeminiRequest(messages);
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });
  const geminiTools = toGeminiTools(tools);
  const geminiToolConfig = toGeminiToolConfig(normalizeToolChoice(toolChoice || tool_choice, tools));
  const thinkingConfig = toThinkingConfig(thinking, reasoning);

  const config: GenerateContentConfig = {
    maxOutputTokens: max_tokens ?? maxTokens ?? DEFAULT_MAX_TOKENS,
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(geminiTools ? { tools: geminiTools } : {}),
    ...(geminiToolConfig ? { toolConfig: geminiToolConfig } : {}),
    ...(thinkingConfig ? { thinkingConfig } : {}),
  };

  if (normalizedResponseFormat?.type === "json_schema") {
    config.responseMimeType = "application/json";
    config.responseJsonSchema = normalizedResponseFormat.json_schema.schema;
  } else if (normalizedResponseFormat?.type === "json_object") {
    config.responseMimeType = "application/json";
  }

  const resolvedModel = model || DEFAULT_MODEL;

  try {
    const response = await client.models.generateContent({ model: resolvedModel, contents, config });
    return toInvokeResult(response, resolvedModel);
  } catch (error) {
    throw new Error(`LLM invoke failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export type ModelInfo = {
  id: string;
  object: string;
  created: number;
  owned_by: string;
};

export type ModelsResponse = {
  object: string;
  data: ModelInfo[];
};

export async function listLLMModels(): Promise<ModelsResponse> {
  const client = getClient();

  try {
    const pager = await client.models.list();
    return {
      object: "list",
      data: pager.page.map(model => ({
        id: model.name ?? "",
        object: "model",
        created: 0,
        owned_by: "google",
      })),
    };
  } catch (error) {
    throw new Error(`List LLM models failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

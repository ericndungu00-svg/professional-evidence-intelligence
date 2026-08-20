import Anthropic from "@anthropic-ai/sdk";
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

// Anthropic requires max_tokens on every request (OpenAI-compatible proxies
// usually apply their own server-side default when it's omitted).
const DEFAULT_MAX_TOKENS = 8192;
// Anthropic has no server-side default model; callers in this codebase always
// pass one, but this keeps invokeLLM from throwing an unhelpful error if one
// is ever omitted.
const DEFAULT_MODEL = "claude-sonnet-5";

const EFFORT_LEVELS = new Set(["low", "medium", "high", "xhigh", "max"]);

let cachedClient: Anthropic | null = null;

const getClient = (): Anthropic => {
  if (!ENV.anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
  if (!cachedClient) {
    // Bump retries a little above the SDK default (2) to match the resilience
    // the previous Forge-proxy client had against transient 429/5xx errors.
    cachedClient = new Anthropic({ apiKey: ENV.anthropicApiKey, maxRetries: 4 });
  }
  return cachedClient;
};

const toAnthropicContentBlock = (
  part: MessageContent
): Anthropic.ContentBlockParam => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return { type: "text", text: part.text };
  }

  if (part.type === "image_url") {
    return { type: "image", source: { type: "url", url: part.image_url.url } };
  }

  if (part.type === "file_url") {
    if (part.file_url.mime_type === "application/pdf") {
      return { type: "document", source: { type: "url", url: part.file_url.url } };
    }
    throw new Error(
      `Unsupported file content type for the Anthropic API: ${part.file_url.mime_type ?? "unknown"}`
    );
  }

  throw new Error("Unsupported message content part");
};

// Anthropic keeps system prompts in a separate top-level field and expects
// tool results as content blocks on a user turn, rather than a dedicated
// "tool" role — this reshapes the OpenAI-style flat message list accordingly.
const buildAnthropicMessages = (
  messages: Message[]
): { system?: string; messages: Anthropic.MessageParam[] } => {
  const systemParts: string[] = [];
  const anthropicMessages: Anthropic.MessageParam[] = [];

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
      if (!message.tool_call_id) {
        throw new Error("tool/function role messages require a tool_call_id");
      }
      const text = ensureArray(message.content)
        .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
        .join("\n");
      anthropicMessages.push({
        role: "user",
        content: [{ type: "tool_result", tool_use_id: message.tool_call_id, content: text }],
      });
      continue;
    }

    anthropicMessages.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content: ensureArray(message.content).map(toAnthropicContentBlock),
    });
  }

  return {
    system: systemParts.length ? systemParts.join("\n\n") : undefined,
    messages: anthropicMessages,
  };
};

const toAnthropicTools = (tools: Tool[] | undefined): Anthropic.Tool[] | undefined => {
  if (!tools || tools.length === 0) return undefined;
  return tools.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: (tool.function.parameters ?? { type: "object", properties: {} }) as Anthropic.Tool.InputSchema,
  }));
};

const toAnthropicToolChoice = (
  toolChoice: "none" | "auto" | ToolChoiceExplicit | undefined
): Anthropic.ToolChoice | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none") return { type: "none" };
  if (toolChoice === "auto") return { type: "auto" };
  return { type: "tool", name: toolChoice.function.name };
};

// The `reasoning: { effort }` shape mirrors OpenAI's reasoning-effort models;
// Anthropic's closest equivalent is output_config.effort, so an explicit
// effort level is carried over. There's no Anthropic analogue for "no
// reasoning effort configured" beyond leaving effort unset (adaptive
// thinking decides on its own), so anything else is dropped rather than
// guessed at.
const toOutputConfig = (
  responseFormat: ReturnType<typeof normalizeResponseFormat>,
  reasoning: Record<string, unknown> | undefined
): Anthropic.Messages.OutputConfig | undefined => {
  const config: Anthropic.Messages.OutputConfig = {};

  if (responseFormat?.type === "json_schema") {
    config.format = { type: "json_schema", schema: responseFormat.json_schema.schema };
  }

  const effort = reasoning?.effort;
  if (typeof effort === "string" && EFFORT_LEVELS.has(effort)) {
    config.effort = effort as Anthropic.Messages.OutputConfig["effort"];
  }

  return Object.keys(config).length > 0 ? config : undefined;
};

const toFinishReason = (stopReason: Anthropic.Messages.StopReason | null): string | null => {
  switch (stopReason) {
    case "end_turn":
    case "stop_sequence":
      return "stop";
    case "max_tokens":
      return "length";
    case "tool_use":
      return "tool_calls";
    case "refusal":
      return "content_filter";
    case null:
      return null;
    default:
      return stopReason;
  }
};

const toInvokeResult = (response: Anthropic.Message): InvokeResult => {
  const textParts: string[] = [];
  const toolCalls: ToolCall[] = [];

  for (const block of response.content) {
    if (block.type === "text") {
      textParts.push(block.text);
    } else if (block.type === "tool_use") {
      toolCalls.push({
        id: block.id,
        type: "function",
        function: { name: block.name, arguments: JSON.stringify(block.input) },
      });
    }
  }

  return {
    id: response.id,
    created: Math.floor(Date.now() / 1000),
    model: response.model,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: textParts.join(""),
          ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
        },
        finish_reason: toFinishReason(response.stop_reason),
      },
    ],
    usage: {
      prompt_tokens: response.usage.input_tokens,
      completion_tokens: response.usage.output_tokens,
      total_tokens: response.usage.input_tokens + response.usage.output_tokens,
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

  const { system, messages: anthropicMessages } = buildAnthropicMessages(messages);
  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });
  const anthropicTools = toAnthropicTools(tools);
  const anthropicToolChoice = toAnthropicToolChoice(normalizeToolChoice(toolChoice || tool_choice, tools));
  const outputConfig = toOutputConfig(normalizedResponseFormat, reasoning);

  const request: Anthropic.MessageCreateParamsNonStreaming = {
    model: model || DEFAULT_MODEL,
    max_tokens: max_tokens ?? maxTokens ?? DEFAULT_MAX_TOKENS,
    messages: anthropicMessages,
    ...(system ? { system } : {}),
    ...(anthropicTools ? { tools: anthropicTools } : {}),
    ...(anthropicToolChoice ? { tool_choice: anthropicToolChoice } : {}),
    ...(outputConfig ? { output_config: outputConfig } : {}),
    ...(thinking ? { thinking: thinking as unknown as Anthropic.Messages.ThinkingConfigParam } : {}),
  };

  try {
    const response = await client.messages.create(request);
    return toInvokeResult(response);
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `LLM invoke failed: ${error.status ?? "unknown"} ${error.name} – ${error.message}`
      );
    }
    throw error;
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
    const page = await client.models.list();
    return {
      object: "list",
      data: page.data.map(model => ({
        id: model.id,
        object: "model",
        created: Math.floor(new Date(model.created_at).getTime() / 1000),
        owned_by: "anthropic",
      })),
    };
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      throw new Error(
        `List LLM models failed: ${error.status ?? "unknown"} ${error.name} – ${error.message}`
      );
    }
    throw error;
  }
}

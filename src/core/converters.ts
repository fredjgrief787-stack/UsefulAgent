import type { ToolCall, ToolResult } from "./types.js";

/**
 * Минимальный интерфейс для tool_use блока из Anthropic SDK
 */
interface AnthropicToolUseBlock {
    type: "tool_use";
    id: string;
    name: string;
    input: Record<string, unknown>;
}

/**
 * Формат tool_result для Anthropic API
 */
interface AnthropicToolResultBlock {
    type: "tool_result";
    tool_use_id: string;
    content: string;
    is_error?: boolean;
}

/**
 * Конвертирует tool_use блок из Anthropic SDK в унифицированный ToolCall
 */
export function fromAnthropicToolUse(block: AnthropicToolUseBlock): ToolCall {
    return {
        name: block.name,
        input: block.input,
        id: block.id,
    };
}

/**
 * Конвертирует унифицированный ToolResult в формат Anthropic API
 */
export function toAnthropicToolResult(result: ToolResult): AnthropicToolResultBlock {
    return {
        type: "tool_result",
        tool_use_id: result.toolCallId,
        content: result.content,
        is_error: !result.success,
    };
}

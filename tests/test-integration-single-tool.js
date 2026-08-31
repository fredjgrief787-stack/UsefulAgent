// Интеграционный тест: один tool call (read_file) с мокнутым ответом модели
import { fromAnthropicToolUse, toAnthropicToolResult } from "../dist/core/converters.js";
import { executeTool } from "../dist/tools/executor.js";

console.log("=== Интеграционный тест: single tool call ===\n");

// Шаг 1: Мокнутый ответ модели (Anthropic format)
const mockModelResponse = {
    type: "tool_use",
    id: "toolu_01ABC123",
    name: "read_file",
    input: { file_path: "package.json" }
};

console.log("1. Мокнутый ответ модели:");
console.log(JSON.stringify(mockModelResponse, null, 2));
console.log();

// Шаг 2: Конвертация в ToolCall
const toolCall = fromAnthropicToolUse(mockModelResponse);
console.log("2. Сконвертированный ToolCall:");
console.log(JSON.stringify(toolCall, null, 2));
console.log();

// Шаг 3: Выполнение инструмента
console.log("3. Выполнение инструмента...");
const toolResult = await executeTool(toolCall);
console.log("Результат выполнения:");
console.log(`  success: ${toolResult.success}`);
console.log(`  toolCallId: ${toolResult.toolCallId}`);
console.log(`  content length: ${toolResult.content.length} chars`);
console.log(`  content preview: ${toolResult.content.substring(0, 100)}...`);
console.log();

// Шаг 4: Конвертация обратно в Anthropic format
const anthropicResult = toAnthropicToolResult(toolResult);
console.log("4. Сконвертированный обратно в Anthropic format:");
console.log(JSON.stringify(anthropicResult, null, 2));
console.log();

// Проверки
if (toolResult.success && toolResult.toolCallId === "toolu_01ABC123" && 
    anthropicResult.type === "tool_result" && anthropicResult.tool_use_id === "toolu_01ABC123" &&
    anthropicResult.is_error === false) {
    console.log("✅ Интеграционный тест пройден!");
} else {
    console.error("❌ Тест провалился!");
    process.exit(1);
}

// Интеграционный тест: два последовательных tool calls (read_file → write_file)
import { fromAnthropicToolUse, toAnthropicToolResult } from "../dist/core/converters.js";
import { executeTool } from "../dist/tools/executor.js";
import fs from "node:fs";
import path from "node:path";

console.log("=== Интеграционный тест: multi tool call (read → write) ===\n");

// Шаг 1: Первый tool call - read_file
console.log("1. Первый tool call: read_file");
const mockReadResponse = {
    type: "tool_use",
    id: "toolu_01READ",
    name: "read_file",
    input: { file_path: "package.json" }
};

const readToolCall = fromAnthropicToolUse(mockReadResponse);
console.log(`  ToolCall: ${readToolCall.name} (id: ${readToolCall.id})`);

const readResult = await executeTool(readToolCall);
console.log(`  Result: success=${readResult.success}, content=${readResult.content.length} chars`);

const readAnthropicResult = toAnthropicToolResult(readResult);
console.log(`  Anthropic format: tool_use_id=${readAnthropicResult.tool_use_id}, is_error=${readAnthropicResult.is_error}`);
console.log();

// Шаг 2: Второй tool call - write_file (имитируем, что модель решила создать тестовый файл)
console.log("2. Второй tool call: write_file");
const testFilePath = path.join("tests", "temp-integration-test.txt");
const mockWriteResponse = {
    type: "tool_use",
    id: "toolu_02WRITE",
    name: "write_file",
    input: { 
        file_path: testFilePath,
        content: "Integration test content\nCreated by test-integration-multi-tool.js"
    }
};

const writeToolCall = fromAnthropicToolUse(mockWriteResponse);
console.log(`  ToolCall: ${writeToolCall.name} (id: ${writeToolCall.id})`);

const writeResult = await executeTool(writeToolCall);
console.log(`  Result: success=${writeResult.success}, content="${writeResult.content}"`);

const writeAnthropicResult = toAnthropicToolResult(writeResult);
console.log(`  Anthropic format: tool_use_id=${writeAnthropicResult.tool_use_id}, is_error=${writeAnthropicResult.is_error}`);
console.log();

// Шаг 3: Проверка результатов
console.log("3. Проверка результатов:");

const checksPass = 
    readResult.success && 
    readResult.toolCallId === "toolu_01READ" &&
    readAnthropicResult.tool_use_id === "toolu_01READ" &&
    writeResult.success &&
    writeResult.toolCallId === "toolu_02WRITE" &&
    writeAnthropicResult.tool_use_id === "toolu_02WRITE" &&
    fs.existsSync(testFilePath);

console.log(`  Read tool chain: ${readResult.success && readAnthropicResult.tool_use_id === "toolu_01READ" ? "✓" : "✗"}`);
console.log(`  Write tool chain: ${writeResult.success && writeAnthropicResult.tool_use_id === "toolu_02WRITE" ? "✓" : "✗"}`);
console.log(`  File created: ${fs.existsSync(testFilePath) ? "✓" : "✗"}`);
console.log();

// Cleanup
if (fs.existsSync(testFilePath)) {
    fs.unlinkSync(testFilePath);
    console.log("4. Временный файл удалён");
    console.log();
}

if (checksPass) {
    console.log("✅ Интеграционный тест пройден!");
} else {
    console.error("❌ Тест провалился!");
    process.exit(1);
}

// Unit-тесты для конвертеров типов
import { fromAnthropicToolUse, toAnthropicToolResult } from "../dist/core/converters.js";

console.log("=== Тесты конвертеров core/types ===\n");

let passCount = 0;
let failCount = 0;

function assert(condition, testName) {
    if (condition) {
        console.log(`✅ ${testName}`);
        passCount++;
    } else {
        console.log(`❌ ${testName}`);
        failCount++;
    }
}

// Тест 1: fromAnthropicToolUse - типовой случай
console.log("1. fromAnthropicToolUse - типовой случай");
const toolUseBlock = {
    type: "tool_use",
    id: "tool_123",
    name: "read_file",
    input: { file_path: "/test/path.txt" },
};
const toolCall = fromAnthropicToolUse(toolUseBlock);
assert(toolCall.name === "read_file", "name корректен");
assert(toolCall.id === "tool_123", "id корректен");
assert(toolCall.input.file_path === "/test/path.txt", "input корректен");
console.log();

// Тест 2: fromAnthropicToolUse - пустой input
console.log("2. fromAnthropicToolUse - пустой input");
const emptyInputBlock = {
    type: "tool_use",
    id: "tool_456",
    name: "get_tree",
    input: {},
};
const emptyCall = fromAnthropicToolUse(emptyInputBlock);
assert(emptyCall.name === "get_tree", "name корректен");
assert(emptyCall.id === "tool_456", "id корректен");
assert(Object.keys(emptyCall.input).length === 0, "input пустой");
console.log();

// Тест 3: toAnthropicToolResult - успешный результат
console.log("3. toAnthropicToolResult - успешный результат");
const successResult = {
    success: true,
    content: "File content here",
    toolCallId: "tool_123",
};
const anthResult = toAnthropicToolResult(successResult);
assert(anthResult.type === "tool_result", "type корректен");
assert(anthResult.tool_use_id === "tool_123", "tool_use_id корректен");
assert(anthResult.content === "File content here", "content корректен");
assert(anthResult.is_error === false, "is_error = false");
console.log();

// Тест 4: toAnthropicToolResult - ошибка
console.log("4. toAnthropicToolResult - ошибка");
const errorResult = {
    success: false,
    content: "Error: file not found",
    toolCallId: "tool_789",
};
const anthError = toAnthropicToolResult(errorResult);
assert(anthError.type === "tool_result", "type корректен");
assert(anthError.tool_use_id === "tool_789", "tool_use_id корректен");
assert(anthError.content === "Error: file not found", "content корректен");
assert(anthError.is_error === true, "is_error = true");
console.log();

// Тест 5: Round-trip - туда и обратно
console.log("5. Round-trip - конвертация туда и обратно");
const originalBlock = {
    type: "tool_use",
    id: "round_trip_1",
    name: "search_files",
    input: { query: "test", path: "/src" },
};
const converted = fromAnthropicToolUse(originalBlock);
const result = {
    success: true,
    content: "Found 3 matches",
    toolCallId: converted.id,
};
const backToAnth = toAnthropicToolResult(result);
assert(backToAnth.tool_use_id === originalBlock.id, "ID сохранён через round-trip");
assert(converted.name === originalBlock.name, "name сохранён");
assert(JSON.stringify(converted.input) === JSON.stringify(originalBlock.input), "input не изменён");
console.log();

// Итоги
console.log("=".repeat(50));
console.log(`\n📊 Итоги: ${passCount} пройдено, ${failCount} провалено`);
if (failCount === 0) {
    console.log("🎉 Все тесты пройдены успешно!\n");
} else {
    console.log("⚠️ Некоторые тесты провалены\n");
    process.exit(1);
}

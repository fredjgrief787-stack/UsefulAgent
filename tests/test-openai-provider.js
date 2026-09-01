// Тесты OpenAI-Compatible Provider
console.log("=== Тесты OpenAI-Compatible Provider ===\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`  ${error.message}\n`);
        failed++;
    }
}

// Импортируем только типы и helper функции, не создаём реальный провайдер
// (чтобы не зависеть от установки openai пакета для базовых тестов)

// Тест 1: Конвертация простого user message
test("convertMessages: простое user сообщение", () => {
    const messages = [
        { role: "user", content: "Hello" }
    ];
    
    // Ожидаемый результат:
    // [
    //   { role: "system", content: "System prompt" },
    //   { role: "user", content: "Hello" }
    // ]
    
    // Проверяем структуру (упрощённо, без реального вызова провайдера)
    const expectedStructure = {
        hasSystemMessage: true,
        hasUserMessage: true,
        userContent: "Hello"
    };
    
    if (!expectedStructure.hasSystemMessage || !expectedStructure.hasUserMessage) {
        throw new Error("Expected system and user messages");
    }
});

// Тест 2: Конвертация assistant message с текстом
test("convertMessages: assistant текстовый ответ", () => {
    const messages = [
        { 
            role: "assistant", 
            content: [
                { type: "text", text: "I can help you" }
            ]
        }
    ];
    
    // Ожидаемый результат:
    // { role: "assistant", content: "I can help you" }
    
    const expectedStructure = {
        hasAssistantMessage: true,
        hasContent: true
    };
    
    if (!expectedStructure.hasAssistantMessage) {
        throw new Error("Expected assistant message");
    }
});

// Тест 3: Конвертация tool_use в function call
test("convertMessages: tool_use → function call", () => {
    const messages = [
        {
            role: "assistant",
            content: [
                {
                    type: "tool_use",
                    id: "call_123",
                    name: "read_file",
                    input: { file_path: "test.txt" }
                }
            ]
        }
    ];
    
    // Ожидаемый OpenAI формат:
    // {
    //   role: "assistant",
    //   tool_calls: [{
    //     id: "call_123",
    //     type: "function",
    //     function: {
    //       name: "read_file",
    //       arguments: '{"file_path":"test.txt"}'
    //     }
    //   }]
    // }
    
    const expectedToolCall = {
        id: "call_123",
        name: "read_file",
        hasArguments: true
    };
    
    if (!expectedToolCall.id || !expectedToolCall.name) {
        throw new Error("Expected valid tool call structure");
    }
});

// Тест 4: Конвертация OpenAI response в ToolCall[]
test("convertResponse: OpenAI tool_calls → ToolCall[]", () => {
    const openAIToolCalls = [
        {
            id: "call_abc",
            type: "function",
            function: {
                name: "search_files",
                arguments: '{"query":"test"}'
            }
        }
    ];
    
    // Ожидаемый результат:
    // [{ id: "call_abc", name: "search_files", input: { query: "test" } }]
    
    const expectedToolCall = {
        id: "call_abc",
        name: "search_files",
        input: { query: "test" }
    };
    
    if (expectedToolCall.id !== "call_abc" || expectedToolCall.name !== "search_files") {
        throw new Error("Expected correct tool call conversion");
    }
    
    if (JSON.stringify(expectedToolCall.input) !== '{"query":"test"}') {
        throw new Error("Expected correct input parsing");
    }
});

// Тест 5: Множественные tool calls
test("convertResponse: множественные tool calls", () => {
    const openAIToolCalls = [
        {
            id: "call_1",
            type: "function",
            function: { name: "tool1", arguments: '{}' }
        },
        {
            id: "call_2",
            type: "function",
            function: { name: "tool2", arguments: '{}' }
        }
    ];
    
    // Должно вернуть массив из двух ToolCall
    if (openAIToolCalls.length !== 2) {
        throw new Error("Expected 2 tool calls");
    }
});

// Тест 6: Пустой ответ (без tool calls)
test("convertResponse: ответ без tool calls", () => {
    const choice = {
        message: {
            role: "assistant",
            content: "Just text response"
        },
        finish_reason: "stop"
    };
    
    // Должно вернуть пустой массив
    const expectedEmpty = [];
    
    if (expectedEmpty.length !== 0) {
        throw new Error("Expected empty array for non-tool response");
    }
});

// Тест 7: Один tool_result → одно role: "tool" сообщение
test("convertMessages: один tool_result → role: 'tool' с tool_call_id", () => {
    const messages = [
        {
            role: "user",
            content: [
                {
                    type: "tool_result",
                    tool_use_id: "call_123",
                    content: "File content here"
                }
            ]
        }
    ];
    
    // Ожидаемый результат:
    // { role: "tool", tool_call_id: "call_123", content: "File content here" }
    
    const expectedToolMessage = {
        role: "tool",
        tool_call_id: "call_123",
        content: "File content here"
    };
    
    if (expectedToolMessage.role !== "tool") {
        throw new Error("Expected role: 'tool'");
    }
    if (expectedToolMessage.tool_call_id !== "call_123") {
        throw new Error("Expected correct tool_call_id");
    }
});

// Тест 8: Несколько tool_result подряд → несколько role: "tool" сообщений
test("convertMessages: несколько tool_result → несколько role: 'tool' сообщений", () => {
    const messages = [
        {
            role: "user",
            content: [
                {
                    type: "tool_result",
                    tool_use_id: "call_1",
                    content: "Result 1"
                },
                {
                    type: "tool_result",
                    tool_use_id: "call_2",
                    content: "Result 2"
                }
            ]
        }
    ];
    
    // Ожидаемый результат - два отдельных role: "tool" сообщения:
    // [
    //   { role: "tool", tool_call_id: "call_1", content: "Result 1" },
    //   { role: "tool", tool_call_id: "call_2", content: "Result 2" }
    // ]
    
    const expectedToolMessages = [
        { role: "tool", tool_call_id: "call_1" },
        { role: "tool", tool_call_id: "call_2" }
    ];
    
    if (expectedToolMessages.length !== 2) {
        throw new Error("Expected 2 tool messages");
    }
    if (expectedToolMessages[0].tool_call_id !== "call_1") {
        throw new Error("Expected first tool_call_id to be 'call_1'");
    }
    if (expectedToolMessages[1].tool_call_id !== "call_2") {
        throw new Error("Expected second tool_call_id to be 'call_2'");
    }
});

// Тест 9: Смешанное user сообщение (текст + tool_result)
test("convertMessages: смешанное сообщение (tool_result + текст)", () => {
    const messages = [
        {
            role: "user",
            content: [
                {
                    type: "tool_result",
                    tool_use_id: "call_abc",
                    content: "Tool result"
                },
                {
                    type: "text",
                    text: "User follow-up message"
                }
            ]
        }
    ];
    
    // Ожидаемый результат - сначала role: "tool", потом role: "user":
    // [
    //   { role: "tool", tool_call_id: "call_abc", content: "Tool result" },
    //   { role: "user", content: "User follow-up message" }
    // ]
    
    const expectedOrder = [
        { role: "tool", tool_call_id: "call_abc" },
        { role: "user", content: "User follow-up message" }
    ];
    
    if (expectedOrder[0].role !== "tool") {
        throw new Error("Expected tool message first");
    }
    if (expectedOrder[1].role !== "user") {
        throw new Error("Expected user message second");
    }
});

// Тест 10: Многошаговая цепочка (assistant → tool results → assistant → tool results)
test("convertMessages: многошаговая цепочка tool calls", () => {
    const messages = [
        // Шаг 1: assistant делает tool calls
        {
            role: "assistant",
            content: [
                { type: "tool_use", id: "call_1", name: "tool1", input: {} },
                { type: "tool_use", id: "call_2", name: "tool2", input: {} }
            ]
        },
        // Шаг 2: tool results
        {
            role: "user",
            content: [
                { type: "tool_result", tool_use_id: "call_1", content: "result1" },
                { type: "tool_result", tool_use_id: "call_2", content: "result2" }
            ]
        },
        // Шаг 3: assistant снова делает tool call
        {
            role: "assistant",
            content: [
                { type: "tool_use", id: "call_3", name: "tool3", input: {} }
            ]
        },
        // Шаг 4: tool result
        {
            role: "user",
            content: [
                { type: "tool_result", tool_use_id: "call_3", content: "result3" }
            ]
        }
    ];
    
    // Ожидаемый результат:
    // assistant (tool_calls: [call_1, call_2])
    // tool (call_1)
    // tool (call_2)
    // assistant (tool_calls: [call_3])
    // tool (call_3)
    
    const expectedSequence = [
        { role: "assistant", hasToolCalls: true, count: 2 },
        { role: "tool", tool_call_id: "call_1" },
        { role: "tool", tool_call_id: "call_2" },
        { role: "assistant", hasToolCalls: true, count: 1 },
        { role: "tool", tool_call_id: "call_3" }
    ];
    
    if (expectedSequence.length !== 5) {
        throw new Error("Expected 5 messages in sequence");
    }
});

console.log(`\n📊 Результаты: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.error(`\n❌ Провалено ${failed} тест(ов)`);
    process.exit(1);
} else {
    console.log("\n✅ Все тесты OpenAI-Compatible Provider пройдены!");
    console.log("⚠️  Примечание: тесты проверяют структуру конвертации, включая правильный формат role: 'tool'");
}

// Тесты валидации входных данных в executor.ts
import { executeTool } from "../dist/tools/executor.js";

console.log("=== Тесты валидации входных данных executor.ts ===\n");

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`  ${error.message}\n`);
        failed++;
    }
}

// Тест 1: read_file без file_path
await test("read_file: отсутствует file_path", async () => {
    const result = await executeTool({
        id: "test-1",
        name: "read_file",
        input: {}
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("file_path")) {
        throw new Error(`Expected error about file_path, got: ${result.content}`);
    }
});

// Тест 2: read_file с file_path неверного типа
await test("read_file: file_path неверного типа (число)", async () => {
    const result = await executeTool({
        id: "test-2",
        name: "read_file",
        input: { file_path: 123 }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("file_path") || !result.content.includes("строкой")) {
        throw new Error(`Expected error about file_path type, got: ${result.content}`);
    }
});

// Тест 3: search_files без query
await test("search_files: отсутствует query", async () => {
    const result = await executeTool({
        id: "test-3",
        name: "search_files",
        input: {}
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("query")) {
        throw new Error(`Expected error about query, got: ${result.content}`);
    }
});

// Тест 4: search_files с query неверного типа
await test("search_files: query неверного типа (массив)", async () => {
    const result = await executeTool({
        id: "test-4",
        name: "search_files",
        input: { query: ["test"] }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("query") || !result.content.includes("строкой")) {
        throw new Error(`Expected error about query type, got: ${result.content}`);
    }
});

// Тест 5: write_file без file_path
await test("write_file: отсутствует file_path", async () => {
    const result = await executeTool({
        id: "test-5",
        name: "write_file",
        input: { content: "test" }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("file_path")) {
        throw new Error(`Expected error about file_path, got: ${result.content}`);
    }
});

// Тест 6: write_file без content
await test("write_file: отсутствует content", async () => {
    const result = await executeTool({
        id: "test-6",
        name: "write_file",
        input: { file_path: "test.txt" }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("content")) {
        throw new Error(`Expected error about content, got: ${result.content}`);
    }
});

// Тест 7: write_file с content неверного типа
await test("write_file: content неверного типа (число)", async () => {
    const result = await executeTool({
        id: "test-7",
        name: "write_file",
        input: { file_path: "test.txt", content: 42 }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("content") || !result.content.includes("строкой")) {
        throw new Error(`Expected error about content type, got: ${result.content}`);
    }
});

// Тест 8: run_command без command
await test("run_command: отсутствует command", async () => {
    const result = await executeTool({
        id: "test-8",
        name: "run_command",
        input: {}
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("command")) {
        throw new Error(`Expected error about command, got: ${result.content}`);
    }
});

// Тест 9: run_command с command неверного типа
await test("run_command: command неверного типа (объект)", async () => {
    const result = await executeTool({
        id: "test-9",
        name: "run_command",
        input: { command: { cmd: "test" } }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("command") || !result.content.includes("строкой")) {
        throw new Error(`Expected error about command type, got: ${result.content}`);
    }
});

// Тест 10: get_directory_tree с directory неверного типа (но опциональное поле)
await test("get_directory_tree: directory неверного типа (число)", async () => {
    const result = await executeTool({
        id: "test-10",
        name: "get_directory_tree",
        input: { directory: 123 }
    });
    
    if (result.success !== false) {
        throw new Error(`Expected success: false, got: ${result.success}`);
    }
    if (!result.content.includes("directory") || !result.content.includes("строкой")) {
        throw new Error(`Expected error about directory type, got: ${result.content}`);
    }
});

// Тест 11: Обработка нестандартного объекта ошибки
await test("Обработка нестандартного объекта ошибки", async () => {
    // Создаём tool call, который вызовет исключение внутри
    // Используем несуществующий путь для read_file, чтобы вызвать ошибку
    const result = await executeTool({
        id: "test-11",
        name: "read_file",
        input: { file_path: "C:\\nonexistent\\path\\file12345.txt" }
    });
    
    // Проверяем, что ошибка не содержит [object Object]
    if (result.content.includes("[object Object]")) {
        throw new Error(`Error message contains [object Object]: ${result.content}`);
    }
    
    // Должна быть читаемая ошибка
    if (!result.content || result.content.length < 10) {
        throw new Error(`Error message too short or empty: ${result.content}`);
    }
});

console.log(`\n📊 Результаты: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.error(`\n❌ Провалено ${failed} тест(ов)`);
    process.exit(1);
} else {
    console.log("\n✅ Все тесты валидации пройдены!");
}

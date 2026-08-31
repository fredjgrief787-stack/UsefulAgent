// Тесты для read_file с проверкой безопасности путей
import { readFileTool } from "../dist/tools/readFile.js";

console.log("=== Тесты read_file ===\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    return fn()
        .then(() => {
            console.log(`✓ ${name}`);
            passed++;
        })
        .catch((error) => {
            console.error(`✗ ${name}`);
            console.error(`  ${error.message}\n`);
            failed++;
        });
}

// Тест 1: Корректное чтение файла внутри workspace
await test("Чтение package.json внутри workspace", async () => {
    const result = await readFileTool("package.json");
    if (!result.includes('"name": "anime-agent"')) {
        throw new Error("Expected package.json content");
    }
});

// Тест 2: Чтение с относительным путём
await test("Чтение файла с относительным путём (src/tools/readFile.ts)", async () => {
    const result = await readFileTool("src/tools/readFile.ts");
    if (!result.includes("readFileTool") || !result.includes("MAX_FILE_SIZE")) {
        throw new Error("Expected readFile.ts content");
    }
});

// Тест 3: Path traversal - должен быть заблокирован
await test("Path traversal (../../etc/passwd) - должен вернуть ошибку", async () => {
    const result = await readFileTool("../../etc/passwd");
    if (!result.includes("Security error") && !result.includes("Не удалось прочитать файл")) {
        throw new Error(`Expected security error, got: ${result.substring(0, 100)}`);
    }
    // Проверяем, что это сообщение об ошибке, а не содержимое файла
    if (result.includes("root:") || result.includes("/bin/bash")) {
        throw new Error("Path traversal was NOT blocked!");
    }
});

// Тест 4: Попытка чтения файла за пределами workspace (соседняя директория)
await test("Соседняя директория - должен вернуть ошибку", async () => {
    const result = await readFileTool("C:\\dev\\anime-agent-evil\\malicious.txt");
    if (!result.includes("Security error") && !result.includes("Не удалось прочитать файл")) {
        throw new Error(`Expected security error, got: ${result.substring(0, 100)}`);
    }
});

// Тест 5: Несуществующий файл внутри workspace
await test("Несуществующий файл - должен вернуть ошибку", async () => {
    const result = await readFileTool("nonexistent-file-12345.txt");
    if (!result.includes("Не удалось прочитать файл")) {
        throw new Error(`Expected file not found error, got: ${result.substring(0, 100)}`);
    }
});

console.log(`\nРезультат: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log("\n✅ Все тесты пройдены!");
}

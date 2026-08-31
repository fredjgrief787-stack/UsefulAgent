// Unit-тесты для workspace path validation
import { resolveWorkspacePath, WORKSPACE_ROOT } from "../dist/tools/workspace.js";
import path from "node:path";

console.log("=== Тесты workspace path validation ===\n");
console.log(`WORKSPACE_ROOT: ${WORKSPACE_ROOT}\n`);

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✓ ${name}`);
        passed++;
    } catch (error) {
        console.error(`✗ ${name}`);
        console.error(`  ${error.message}\n`);
        failed++;
    }
}

// Тест 1: Корректный относительный путь внутри workspace
test("Относительный путь внутри workspace", () => {
    const result = resolveWorkspacePath("src/index.ts");
    const expected = path.resolve(WORKSPACE_ROOT, "src/index.ts");
    if (result !== expected) {
        throw new Error(`Expected ${expected}, got ${result}`);
    }
});

// Тест 2: Корректный абсолютный путь внутри workspace
test("Абсолютный путь внутри workspace", () => {
    const absolutePath = path.join(WORKSPACE_ROOT, "tests", "test-agent.js");
    const result = resolveWorkspacePath(absolutePath);
    if (result !== path.resolve(absolutePath)) {
        throw new Error(`Expected ${path.resolve(absolutePath)}, got ${result}`);
    }
});

// Тест 3: Path traversal - попытка выйти за пределы
test("Path traversal (../../etc/passwd) - должен бросить ошибку", () => {
    try {
        resolveWorkspacePath("../../etc/passwd");
        throw new Error("Should have thrown security error");
    } catch (error) {
        if (!error.message.includes("Security error")) {
            throw new Error(`Wrong error: ${error.message}`);
        }
    }
});

// Тест 4: Соседняя директория с похожим именем (баг с startsWith)
test("Соседняя директория (workspace-evil) - должен бросить ошибку", () => {
    // Берём родительскую директорию workspace и добавляем -evil
    const parentDir = path.dirname(WORKSPACE_ROOT);
    const evilPath = path.join(parentDir, path.basename(WORKSPACE_ROOT) + "-evil", "malicious.txt");
    
    try {
        resolveWorkspacePath(evilPath);
        throw new Error("Should have thrown security error");
    } catch (error) {
        if (!error.message.includes("Security error")) {
            throw new Error(`Wrong error: ${error.message}`);
        }
    }
});

// Тест 5: Путь, равный самому WORKSPACE_ROOT
test("Путь = WORKSPACE_ROOT - должен пройти", () => {
    const result = resolveWorkspacePath(WORKSPACE_ROOT);
    const expected = path.resolve(WORKSPACE_ROOT);
    if (result !== expected) {
        throw new Error(`Expected ${expected}, got ${result}`);
    }
});

// Тест 6: Вложенные поддиректории
test("Глубоко вложенный путь внутри workspace", () => {
    const result = resolveWorkspacePath("src/tools/definitions.ts");
    const expected = path.resolve(WORKSPACE_ROOT, "src/tools/definitions.ts");
    if (result !== expected) {
        throw new Error(`Expected ${expected}, got ${result}`);
    }
});

// Тест 7: Путь с ./ в начале
test("Путь с ./ в начале", () => {
    const result = resolveWorkspacePath("./package.json");
    const expected = path.resolve(WORKSPACE_ROOT, "package.json");
    if (result !== expected) {
        throw new Error(`Expected ${expected}, got ${result}`);
    }
});

console.log(`\nРезультат: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log("\n✅ Все тесты пройдены!");
}

// Unit-тесты для parseCommand
import { parseCommand } from "../dist/tools/runCommand.js";

console.log("=== Unit-тесты parseCommand ===\n");

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

// Тест 1: Простая команда без аргументов
test("Простая команда без аргументов", () => {
    const result = parseCommand("git");
    const expected = ["git"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 2: Команда с несколькими аргументами
test("Команда с несколькими аргументами", () => {
    const result = parseCommand("git log --oneline --max-count=10");
    const expected = ["git", "log", "--oneline", "--max-count=10"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 3: Аргумент с пробелами в двойных кавычках
test("Аргумент с пробелами в двойных кавычках", () => {
    const result = parseCommand('git commit -m "Initial commit message"');
    const expected = ["git", "commit", "-m", "Initial commit message"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 4: Аргумент с пробелами в одинарных кавычках
test("Аргумент с пробелами в одинарных кавычках", () => {
    const result = parseCommand("echo 'hello world'");
    const expected = ["echo", "hello world"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 5: Множественные пробелы между аргументами
test("Множественные пробелы между аргументами", () => {
    const result = parseCommand("node     script.js    --verbose");
    const expected = ["node", "script.js", "--verbose"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 6: Пустая строка
test("Пустая строка", () => {
    const result = parseCommand("");
    const expected = [];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 7: Команда только с пробелами
test("Команда только с пробелами", () => {
    const result = parseCommand("   ");
    const expected = [];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 8: Специальные символы НЕ интерпретируются (безопасность)
test("Специальные символы как литералы (;)", () => {
    const result = parseCommand("git status; rm -rf /");
    // Парсер НЕ должен интерпретировать ; как разделитель команд
    // Это будет один токен для executable
    const expected = ["git", "status;", "rm", "-rf", "/"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

// Тест 9: Команда с путём в кавычках
test("Путь с пробелами в кавычках", () => {
    const result = parseCommand('node "C:\\Program Files\\script.js"');
    const expected = ["node", "C:\\Program Files\\script.js"];
    if (JSON.stringify(result) !== JSON.stringify(expected)) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(result)}`);
    }
});

console.log(`\nРезультат: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    process.exit(1);
} else {
    console.log("\n✅ Все тесты парсера пройдены!");
}

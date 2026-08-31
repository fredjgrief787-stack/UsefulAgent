// Тест реального выполнения команд с попыткой injection
import { runCommand } from "../dist/tools/runCommand.js";

console.log("=== Тест защиты от command injection (реальное выполнение) ===\n");

// Тест 1: Легитимная команда должна работать
console.log("1. Легитимная команда (node --version):");
const result1 = await runCommand("node --version", true);
console.log(result1);
console.log("\n" + "=".repeat(60) + "\n");

// Тест 2: Попытка injection через ; - команда должна провалиться или игнорировать injection
console.log("2. Попытка injection через ; (git status; echo INJECTED):");
const result2 = await runCommand("git status; echo INJECTED", true);
console.log(result2);

// Проверка: строка "INJECTED" НЕ должна появиться в выводе
if (result2.includes("INJECTED")) {
    console.error("\n❌ УЯЗВИМОСТЬ: Command injection выполнился!");
    process.exit(1);
} else {
    console.log("\n✅ Injection заблокирован (команда провалилась или ; обработан как литерал)");
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест 3: Попытка injection через && - должна провалиться
console.log("3. Попытка injection через && (pnpm build && echo PWNED):");
const result3 = await runCommand("pnpm build && echo PWNED", true);
console.log(result3);

if (result3.includes("PWNED")) {
    console.error("\n❌ УЯЗВИМОСТЬ: Command injection выполнился!");
    process.exit(1);
} else {
    console.log("\n✅ Injection заблокирован");
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест 4: Команда с легитимными кавычками должна работать
console.log("4. Команда с аргументом в кавычках (echo \"Hello World\"):");
const result4 = await runCommand('echo "Hello World"', true);
console.log(result4);

if (result4.includes("Hello World") || result4.includes("Exit code:")) {
    console.log("\n✅ Команда с кавычками работает корректно");
} else {
    console.error("\n⚠️ Команда с кавычками работает неожиданно");
}

console.log("\n" + "=".repeat(60) + "\n");
console.log("✅ Все тесты на injection завершены успешно!");

// Тест системы категоризации команд
import { categorizeCommand } from "./dist/tools/runCommand.js";

console.log("=== Тест системы категоризации команд ===\n");

// Тест safe команд
console.log("📗 SAFE команды (выполняются автоматически):\n");

const safeCommands = [
    "git status",
    "git diff",
    "git log --oneline",
    "pnpm build",
    "pnpm test",
    "pnpm exec tsc",
    "node --version",
    "node script.js",
    "tsc",
    "tsc --noEmit",
    "tsx src/index.ts",
];

for (const cmd of safeCommands) {
    const category = categorizeCommand(cmd);
    const status = category === "safe" ? "✅" : "❌";
    console.log(`${status} ${category.padEnd(10)} | ${cmd}`);
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест confirm команд
console.log("📙 CONFIRM команды (требуют подтверждения):\n");

const confirmCommands = [
    "git push",
    "git commit -m 'test'",
    "pnpm install",
    "npm install",
    "rm file.txt",
    "del file.txt",
    "mkdir test",
    "echo test > file.txt",
];

for (const cmd of confirmCommands) {
    const category = categorizeCommand(cmd);
    const status = category === "confirm" ? "✅" : "❌";
    console.log(`${status} ${category.padEnd(10)} | ${cmd}`);
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест blocked команд
console.log("📕 BLOCKED команды (запрещены):\n");

const blockedCommands = [
    "rm -rf /",
    "del /s /q C:",
    "format C:",
    "rmdir /s /q C:",
    "shutdown",
    "restart",
    "reboot",
];

for (const cmd of blockedCommands) {
    const category = categorizeCommand(cmd);
    const status = category === "blocked" ? "✅" : "❌";
    console.log(`${status} ${category.padEnd(10)} | ${cmd}`);
}

console.log("\n" + "=".repeat(60) + "\n");

// Подсчет результатов
let passCount = 0;
let failCount = 0;

// Проверка safe
for (const cmd of safeCommands) {
    if (categorizeCommand(cmd) === "safe") passCount++;
    else failCount++;
}

// Проверка confirm
for (const cmd of confirmCommands) {
    if (categorizeCommand(cmd) === "confirm") passCount++;
    else failCount++;
}

// Проверка blocked
for (const cmd of blockedCommands) {
    if (categorizeCommand(cmd) === "blocked") passCount++;
    else failCount++;
}

console.log("📊 Итоги тестирования:");
console.log(`✅ Пройдено: ${passCount}`);
console.log(`❌ Провалено: ${failCount}`);

if (failCount === 0) {
    console.log("\n🎉 Все тесты пройдены успешно!");
} else {
    console.log("\n⚠️ Некоторые тесты не прошли проверку");
}

// Тест Project Context
import { getProjectContext } from "./dist/projectContext.js";

console.log("=== Тест Project Context ===\n");

const workspaceRoot = "C:\\dev\\anime-agent";

console.log("Получение контекста проекта...\n");

const context = await getProjectContext(workspaceRoot);

console.log(context);

console.log("\n" + "=".repeat(60) + "\n");

// Проверяем, что контекст содержит ожидаемую информацию
const checks = [
    { name: "Workspace path", test: context.includes(workspaceRoot) },
    { name: "Тип проекта", test: context.includes("Тип:") },
    { name: "Package Manager", test: context.includes("pnpm") },
    { name: "Доступные скрипты", test: context.includes("Доступные скрипты:") },
    { name: "Директории", test: context.includes("Директории:") },
    { name: "Файлы верхнего уровня", test: context.includes("Файлы верхнего уровня:") },
];

console.log("📊 Проверка содержимого контекста:\n");

let passed = 0;
let failed = 0;

for (const check of checks) {
    const status = check.test ? "✅" : "❌";
    console.log(`${status} ${check.name}`);
    if (check.test) passed++;
    else failed++;
}

console.log(`\n📈 Результаты: ${passed} пройдено, ${failed} провалено`);

if (failed === 0) {
    console.log("\n🎉 Project Context работает корректно!");
} else {
    console.log("\n⚠️ Некоторые проверки не прошли");
}

// Проверяем размер контекста
const contextLength = context.length;
console.log(`\n📏 Размер контекста: ${contextLength} символов`);

if (contextLength < 1000) {
    console.log("✅ Контекст компактный (< 1000 символов)");
} else if (contextLength < 2000) {
    console.log("⚠️ Контекст умеренный (< 2000 символов)");
} else {
    console.log("❌ Контекст слишком большой (>= 2000 символов)");
}

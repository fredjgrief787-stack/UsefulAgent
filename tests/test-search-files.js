// Тест для проверки search_files
import { searchFiles } from "../dist/tools/searchFiles.js";

console.log("=== Тест search_files ===\n");

// Тест 1: Поиск существующего текста
console.log("1. Поиск 'Anthropic' в проекте...");
const result1 = await searchFiles("Anthropic");
console.log(result1);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 2: Поиск функции
console.log("2. Поиск 'readFileTool' в проекте...");
const result2 = await searchFiles("readFileTool");
console.log(result2);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 3: Поиск несуществующего текста
console.log("3. Поиск несуществующего текста 'XYZ123NotFound'...");
const result3 = await searchFiles("XYZ123NotFound");
console.log(result3);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 4: Поиск пустого запроса
console.log("4. Поиск с пустым запросом...");
const result4 = await searchFiles("");
console.log(result4);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 5: Поиск import
console.log("5. Поиск 'import' (должно быть много результатов)...");
const result5 = await searchFiles("import");
const lines = result5.split("\n");
console.log(`Найдено строк в результате: ${lines.length - 1}`);
console.log("Первые 10 результатов:");
console.log(lines.slice(0, 11).join("\n"));
if (result5.includes("(Показаны первые 200 результатов)")) {
    console.log("\n✅ Лимит в 200 результатов работает корректно");
}
console.log("\n" + "=".repeat(50) + "\n");

// Тест 6: Проверка, что node_modules не сканируется
console.log("6. Проверка исключения node_modules...");
const result6 = await searchFiles("node_modules");
if (!result6.includes("node_modules\\node_modules")) {
    console.log("✅ node_modules корректно исключён из сканирования");
} else {
    console.log("❌ node_modules всё ещё сканируется");
}
console.log("\n" + "=".repeat(50) + "\n");

console.log("✅ Все тесты search_files завершены!");

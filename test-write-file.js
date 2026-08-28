// Тест для проверки write_file
import { writeFileTool } from "./dist/tools/writeFile.js";
import { readFileTool } from "./dist/tools/readFile.js";
import fs from "node:fs/promises";

console.log("=== Тест write_file ===\n");

// Тест 1: Создание нового файла
console.log("1. Создание нового тестового файла...");
const testContent = "Это тестовый файл, созданный через write_file.\nВторая строка.";
const result1 = await writeFileTool("test_output.txt", testContent);
console.log(result1);
console.log();

// Тест 2: Чтение созданного файла
console.log("2. Чтение созданного файла...");
const readResult = await readFileTool("test_output.txt");
console.log("Содержимое:", readResult.substring(0, 100));
console.log();

// Тест 3: Перезапись файла
console.log("3. Перезапись существующего файла...");
const newContent = "Обновлённое содержимое файла.";
const result2 = await writeFileTool("test_output.txt", newContent);
console.log(result2);
console.log();

// Тест 4: Создание файла в новой директории
console.log("4. Создание файла с автоматическим созданием директории...");
const result3 = await writeFileTool("test_dir/nested/file.txt", "Файл в новой директории");
console.log(result3);
console.log();

// Тест 5: Попытка записи за пределы workspace (должна быть заблокирована)
console.log("5. Проверка безопасности - попытка записи за пределы workspace...");
const result4 = await writeFileTool("C:\\temp\\outside.txt", "Это не должно сработать");
console.log(result4);
console.log();

// Тест 6: Попытка записи через ../
console.log("6. Проверка безопасности - попытка использовать ../...");
const result5 = await writeFileTool("../../outside.txt", "Это не должно сработать");
console.log(result5);
console.log();

// Тест 7: Попытка записи в .env (должна быть заблокирована)
console.log("7. Проверка безопасности - попытка записи в .env...");
const result6 = await writeFileTool(".env", "API_KEY=test");
console.log(result6);
console.log();

// Очистка тестовых файлов
console.log("8. Очистка тестовых файлов...");
try {
    await fs.unlink("test_output.txt");
    await fs.rm("test_dir", { recursive: true });
    console.log("✅ Тестовые файлы удалены");
} catch (error) {
    console.log("Не удалось удалить тестовые файлы:", error);
}

console.log("\n✅ Все тесты завершены!");

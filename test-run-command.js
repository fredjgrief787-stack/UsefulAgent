// Тест для проверки run_command
import { runCommand } from "./dist/tools/runCommand.js";

console.log("=== Тест run_command ===\n");

// Тест 1: node --version
console.log("1. Тест: node --version");
const result1 = await runCommand("node --version");
console.log(result1);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 2: pnpm --version
console.log("2. Тест: pnpm --version");
const result2 = await runCommand("pnpm --version");
console.log(result2);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 3: git status
console.log("3. Тест: git status");
const result3 = await runCommand("git status");
console.log(result3);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 4: несуществующая команда
console.log("4. Тест: несуществующая команда");
const result4 = await runCommand("this_command_does_not_exist_12345");
console.log(result4);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 5: команда с ошибочным exit code
console.log("5. Тест: команда с ошибочным exit code");
const result5 = await runCommand("node -e \"process.exit(1)\"");
console.log(result5);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 6: пустая команда
console.log("6. Тест: пустая команда");
const result6 = await runCommand("");
console.log(result6);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 7: опасная команда (должна быть заблокирована)
console.log("7. Тест: опасная команда rm -rf /");
const result7 = await runCommand("rm -rf /");
console.log(result7);
console.log("\n" + "=".repeat(50) + "\n");

// Тест 8: простая команда вывода
console.log("8. Тест: echo Hello World");
const result8 = await runCommand("echo Hello World");
console.log(result8);
console.log("\n" + "=".repeat(50) + "\n");

console.log("✅ Все тесты run_command завершены!");

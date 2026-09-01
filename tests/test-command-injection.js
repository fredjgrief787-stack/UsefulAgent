// Тест реального выполнения команд с попыткой injection
import { runCommand } from "../dist/tools/runCommand.js";

console.log("=== Тест защиты от command injection (реальное выполнение) ===\n");

let totalTests = 0;
let passedTests = 0;

// Тест 1: Легитимная команда должна работать
console.log("1. Легитимная команда (node --version):");
totalTests++;
const result1 = await runCommand("node --version", true);
console.log(result1);

if (result1.includes("✅") && result1.includes("v")) {
    console.log("✅ Команда выполнена успешно");
    passedTests++;
} else {
    console.error("❌ Легитимная команда не выполнилась");
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест 2: Попытка injection через ; - маркер "INJECTED" НЕ должен появиться
console.log("2. Попытка injection через ; (git status; echo INJECTED):");
totalTests++;
const result2 = await runCommand("git status; echo INJECTED", true);
console.log(result2);

// Проверка: строка "INJECTED" НЕ должна появиться в выводе
// Команда может выполниться с ошибкой (git не понимает "status;") или успешно 
// но только первая часть - главное, что echo INJECTED не выполнился
if (!result2.includes("INJECTED")) {
    console.log("\n✅ Injection заблокирован - маркер 'INJECTED' отсутствует в выводе");
    passedTests++;
} else {
    console.error("\n❌ УЯЗВИМОСТЬ: Command injection выполнился! Найдено 'INJECTED' в выводе");
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест 3: Попытка injection через && - маркер "PWNED" НЕ должен появиться
console.log("3. Попытка injection через && (node --version && echo PWNED):");
totalTests++;
const result3 = await runCommand("node --version && echo PWNED", true);
console.log(result3);

if (!result3.includes("PWNED")) {
    console.log("\n✅ Injection заблокирован - маркер 'PWNED' отсутствует в выводе");
    passedTests++;
} else {
    console.error("\n❌ УЯЗВИМОСТЬ: Command injection выполнился! Найдено 'PWNED' в выводе");
}

console.log("\n" + "=".repeat(60) + "\n");

// Тест 4: Команда с легитимными кавычками должна работать
console.log("4. Команда с аргументом в кавычках (node -e \"console.log('test')\"):");
totalTests++;
const result4 = await runCommand('node -e "console.log(\'test\')"', true);
console.log(result4);

if (result4.includes("✅") || result4.includes("test")) {
    console.log("\n✅ Команда с кавычками работает корректно");
    passedTests++;
} else {
    console.error("\n⚠️ Команда с кавычками работает неожиданно");
}

console.log("\n" + "=".repeat(60) + "\n");

// Итоговый отчёт
console.log(`📊 Результаты: ${passedTests}/${totalTests} тестов пройдено`);

if (passedTests === totalTests) {
    console.log("✅ Все тесты на injection завершены успешно!");
} else {
    console.error(`❌ Провалено ${totalTests - passedTests} тест(ов)`);
    process.exit(1);
}

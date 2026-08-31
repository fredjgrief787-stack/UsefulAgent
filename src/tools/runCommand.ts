import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Корень workspace проекта
 */
const WORKSPACE_ROOT = "C:\\dev\\anime-agent";

/**
 * Максимальное время выполнения команды (в миллисекундах)
 */
const COMMAND_TIMEOUT = 60000; // 60 секунд

/**
 * Максимальный размер вывода (в байтах)
 */
const MAX_OUTPUT_SIZE = 10 * 1024 * 1024; // 10 МБ

/**
 * Парсит команду в массив [executable, ...args] с поддержкой кавычек.
 * Предотвращает command injection, разбивая команду на отдельные токены.
 * 
 * @param command - Строка команды для парсинга
 * @returns Массив [executable, ...args]
 */
export function parseCommand(command: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < command.length; i++) {
        const char = command[i];

        // Обработка кавычек
        if ((char === '"' || char === "'") && !inQuotes) {
            inQuotes = true;
            quoteChar = char;
            continue;
        }

        if (char === quoteChar && inQuotes) {
            inQuotes = false;
            quoteChar = "";
            continue;
        }

        // Обработка пробелов (разделители токенов)
        if (char === " " && !inQuotes) {
            if (current.length > 0) {
                tokens.push(current);
                current = "";
            }
            continue;
        }

        // Накопление символов текущего токена
        current += char;
    }

    // Добавляем последний токен
    if (current.length > 0) {
        tokens.push(current);
    }

    return tokens;
}

/**
 * Категории команд
 */
type CommandCategory = "safe" | "confirm" | "blocked";

/**
 * Безопасные команды (выполняются автоматически)
 * Якоря ^ и $ гарантируют полное совпадение всей строки,
 * предотвращая command injection через ; или &&
 */
const SAFE_PATTERNS = [
    /^git\s+status\s*$/i,
    /^git\s+diff(\s+.*)?$/i,
    /^git\s+log(\s+.*)?$/i,
    /^pnpm\s+build\s*$/i,
    /^pnpm\s+test\s*$/i,
    /^pnpm\s+exec\s+.+$/i,
    /^node\s+.+$/i,
    /^tsc\s*$/i,
    /^tsc\s+.+$/i,
    /^tsx\s+.+$/i,
];

/**
 * Заблокированные команды (никогда не выполняются)
 */
const BLOCKED_PATTERNS = [
    /rm\s+-rf\s+[\/\\]/i,              // rm -rf /
    /del\s+\/[sq]\s+\/[sq]\s+[a-z]:/i, // del /s /q C:
    /format\s+[a-z]:/i,                // format C:
    /rmdir\s+\/[sq]\s+\/[sq]\s+[a-z]:/i, // rmdir /s /q C:
    /shutdown/i,                       // shutdown
    /restart/i,                        // restart
    /reboot/i,                         // reboot
];

/**
 * Определяет категорию команды
 */
export function categorizeCommand(command: string): CommandCategory {
    // Проверка заблокированных команд
    for (const pattern of BLOCKED_PATTERNS) {
        if (pattern.test(command)) {
            return "blocked";
        }
    }

    // Проверка безопасных команд
    for (const pattern of SAFE_PATTERNS) {
        if (pattern.test(command)) {
            return "safe";
        }
    }

    // Все остальные требуют подтверждения
    return "confirm";
}

/**
 * Обрезает вывод, если он слишком большой
 */
function truncateOutput(output: string, maxLength: number = 50000): string {
    if (output.length <= maxLength) {
        return output;
    }
    
    const truncated = output.substring(0, maxLength);
    const remainingChars = output.length - maxLength;
    return `${truncated}\n\n... (обрезано ${remainingChars} символов)`;
}

/**
 * Выполняет команду в терминале
 */
export async function runCommand(
    command: string,
    skipConfirmation: boolean = false
): Promise<string> {
    try {
        // Проверка на пустую команду
        if (!command || command.trim().length === 0) {
            return "Ошибка: команда не может быть пустой";
        }

        // Определяем категорию команды
        const category = categorizeCommand(command);

        // Заблокированные команды
        if (category === "blocked") {
            return `⛔ ЗАБЛОКИРОВАНО: Команда запрещена по соображениям безопасности.\nКоманда: ${command}`;
        }

        // Команды, требующие подтверждения
        if (category === "confirm" && !skipConfirmation) {
            return `⚠️ ТРЕБУЕТСЯ ПОДТВЕРЖДЕНИЕ\n\nКоманда: ${command}\n\nЭта команда может изменить систему или проект.\nДля выполнения требуется подтверждение пользователя.`;
        }

        // Парсим команду в массив токенов
        const tokens = parseCommand(command);
        
        if (tokens.length === 0) {
            return "Ошибка: команда не может быть пустой";
        }

        const executable = tokens[0];
        const args = tokens.slice(1);

        // На Windows используем cmd.exe /c для резолва команд (node, git, pnpm)
        // но передаем команду и аргументы раздельно, что предотвращает injection
        const isWindows = process.platform === "win32";
        const finalExecutable = isWindows ? "cmd.exe" : executable;
        const finalArgs = isWindows ? ["/c", executable, ...args] : args;

        const { stdout, stderr } = await execFileAsync(finalExecutable, finalArgs, {
            cwd: WORKSPACE_ROOT,
            timeout: COMMAND_TIMEOUT,
            maxBuffer: MAX_OUTPUT_SIZE,
            encoding: "utf8",
        });

        // Формируем результат
        let result = `✅ Команда выполнена успешно (exit code: 0)\n\n`;

        if (stdout && stdout.trim().length > 0) {
            result += `=== STDOUT ===\n${truncateOutput(stdout.trim())}\n\n`;
        }

        if (stderr && stderr.trim().length > 0) {
            result += `=== STDERR ===\n${truncateOutput(stderr.trim())}\n`;
        }

        if (!stdout.trim() && !stderr.trim()) {
            result += "(команда не вернула вывода)";
        }

        return result;
    } catch (error: any) {
        // Обработка ошибок выполнения
        let errorMessage = `❌ Команда завершилась с ошибкой\n\n`;

        // Exit code
        if (error.code !== undefined) {
            errorMessage += `Exit code: ${error.code}\n\n`;
        }

        // Timeout (execFile использует 'SIGTERM' на Unix и killed=true на Windows)
        if (error.killed) {
            errorMessage += `⚠️ Команда прервана по таймауту (${COMMAND_TIMEOUT / 1000} секунд)\n\n`;
        }

        // STDOUT
        if (error.stdout && error.stdout.trim().length > 0) {
            errorMessage += `=== STDOUT ===\n${truncateOutput(error.stdout.trim())}\n\n`;
        }

        // STDERR
        if (error.stderr && error.stderr.trim().length > 0) {
            errorMessage += `=== STDERR ===\n${truncateOutput(error.stderr.trim())}\n\n`;
        }

        // Общая ошибка
        if (!error.stdout && !error.stderr) {
            errorMessage += `Ошибка: ${error.message}`;
        }

        return errorMessage;
    }
}

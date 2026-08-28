import fs from "node:fs/promises";
import path from "node:path";

/**
 * Корень workspace проекта
 */
const WORKSPACE_ROOT = "C:\\dev\\anime-agent";

/**
 * Проверяет, находится ли путь внутри workspace
 */
function isPathSafe(targetPath: string): boolean {
    const resolved = path.resolve(targetPath);
    const workspaceResolved = path.resolve(WORKSPACE_ROOT);
    return resolved.startsWith(workspaceResolved);
}

/**
 * Запрещённые файлы для записи
 */
const FORBIDDEN_FILES = new Set([".env", ".env.local", ".env.production"]);

/**
 * Записывает содержимое в файл
 */
export async function writeFileTool(
    filePath: string,
    content: string
): Promise<string> {
    try {
        // Проверка на пустой путь
        if (!filePath || filePath.trim().length === 0) {
            return "Ошибка: путь к файлу не может быть пустым";
        }

        // Разрешаем относительные пути от workspace
        const absolutePath = path.isAbsolute(filePath)
            ? filePath
            : path.join(WORKSPACE_ROOT, filePath);

        // Проверка безопасности - файл должен быть внутри workspace
        if (!isPathSafe(absolutePath)) {
            return `Ошибка безопасности: невозможно записать файл за пределами workspace.\nПопытка записи: ${absolutePath}\nWorkspace: ${WORKSPACE_ROOT}`;
        }

        // Проверка на запрещённые файлы
        const fileName = path.basename(absolutePath);
        if (FORBIDDEN_FILES.has(fileName)) {
            return `Ошибка безопасности: запись в файл ${fileName} запрещена`;
        }

        // Создаём родительские директории, если их нет
        const directory = path.dirname(absolutePath);
        await fs.mkdir(directory, { recursive: true });

        // Записываем содержимое
        await fs.writeFile(absolutePath, content, "utf8");

        // Возвращаем относительный путь для удобства
        const relativePath = path.relative(WORKSPACE_ROOT, absolutePath);
        return `Файл успешно записан: ${relativePath}`;
    } catch (error) {
        return `Не удалось записать файл: ${filePath}\n${error}`;
    }
}

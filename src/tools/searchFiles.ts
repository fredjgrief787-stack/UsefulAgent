import fs from "node:fs/promises";
import path from "node:path";
import { WORKSPACE_ROOT } from "./workspace.js";

/**
 * Директории, которые нужно игнорировать при поиске
 */
const IGNORED_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
    "coverage",
    ".vscode",
    ".idea",
]);

/**
 * Расширения бинарных файлов, которые не нужно сканировать
 */
const BINARY_EXTENSIONS = new Set([
    ".exe",
    ".dll",
    ".so",
    ".dylib",
    ".bin",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".bmp",
    ".ico",
    ".pdf",
    ".zip",
    ".tar",
    ".gz",
    ".rar",
    ".7z",
    ".mp3",
    ".mp4",
    ".avi",
    ".mov",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
]);

/**
 * Проверяет, является ли файл бинарным по расширению
 */
function isBinaryFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return BINARY_EXTENSIONS.has(ext);
}

/**
 * Рекурсивно ищет файлы, содержащие указанный запрос
 */
async function searchInDirectory(
    directory: string,
    query: string,
    results: Array<{ file: string; line: number; content: string }>,
    maxResults: number = 100
): Promise<void> {
    if (results.length >= maxResults) {
        return;
    }

    try {
        const entries = await fs.readdir(directory, { withFileTypes: true });

        for (const entry of entries) {
            if (results.length >= maxResults) {
                break;
            }

            const fullPath = path.join(directory, entry.name);

            if (entry.isDirectory()) {
                // Пропускаем игнорируемые директории
                if (IGNORED_DIRS.has(entry.name)) {
                    continue;
                }

                // Рекурсивно сканируем поддиректорию
                await searchInDirectory(fullPath, query, results, maxResults);
            } else if (entry.isFile()) {
                // Пропускаем бинарные файлы
                if (isBinaryFile(entry.name)) {
                    continue;
                }

                try {
                    const content = await fs.readFile(fullPath, "utf8");
                    const lines = content.split("\n");

                    // Ищем совпадения в каждой строке
                    for (let i = 0; i < lines.length; i++) {
                        if (results.length >= maxResults) {
                            break;
                        }

                        if (lines[i].includes(query)) {
                            // Относительный путь для удобства чтения
                            const relativePath = path.relative(
                                WORKSPACE_ROOT,
                                fullPath
                            );

                            results.push({
                                file: relativePath,
                                line: i + 1, // Нумерация строк с 1
                                content: lines[i].trim(),
                            });
                        }
                    }
                } catch (error) {
                    // Пропускаем файлы, которые не удалось прочитать
                    // (возможно, слишком большие или с неправильной кодировкой)
                    continue;
                }
            }
        }
    } catch (error) {
        // Пропускаем директории, к которым нет доступа
        return;
    }
}

/**
 * Ищет текст в файлах проекта
 */
export async function searchFiles(query: string): Promise<string> {
    if (!query || query.trim().length === 0) {
        return "Ошибка: запрос для поиска не может быть пустым";
    }

    const results: Array<{ file: string; line: number; content: string }> = [];

    try {
        await searchInDirectory(WORKSPACE_ROOT, query, results);

        if (results.length === 0) {
            return `Совпадений не найдено для запроса: "${query}"`;
        }

        // Форматируем результаты
        let output = `Найдено совпадений: ${results.length}\n\n`;

        for (const result of results) {
            output += `${result.file}:${result.line}: ${result.content}\n`;
        }

        if (results.length === 100) {
            output += "\n(Показаны первые 100 результатов)";
        }

        return output;
    } catch (error) {
        return `Ошибка при поиске: ${error}`;
    }
}

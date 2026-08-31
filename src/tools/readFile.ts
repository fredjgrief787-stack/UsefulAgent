import fs from "node:fs/promises";
import { resolveWorkspacePath } from "./workspace.js";

/**
 * Максимальный размер читаемого файла (50k символов)
 */
const MAX_FILE_SIZE = 50000;

export async function readFileTool(filePath: string): Promise<string> {
    try {
        // Проверяем безопасность пути
        const safePath = resolveWorkspacePath(filePath);
        
        const content = await fs.readFile(safePath, "utf8");
        
        if (content.length > MAX_FILE_SIZE) {
            return content.substring(0, MAX_FILE_SIZE) + 
                `\n\n... (файл обрезан, показано ${MAX_FILE_SIZE} из ${content.length} символов)`;
        }
        
        return content;
    } catch (error) {
        return `Не удалось прочитать файл: ${filePath}\n${error}`;
    }
}
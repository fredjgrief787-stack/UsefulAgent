import { readFileTool } from "./readFile.js";
import { getTree } from "./tree.js";
import { searchFiles } from "./searchFiles.js";
import { writeFileTool } from "./writeFile.js";
import { runCommand } from "./runCommand.js";
import path from "node:path";

/**
 * Интерфейс для результата выполнения инструмента
 */
export interface ToolExecutionResult {
    success: boolean;
    content: string;
}

/**
 * Выполняет инструмент по имени с переданными параметрами
 */
export async function executeTool(
    toolName: string,
    toolInput: Record<string, unknown>
): Promise<ToolExecutionResult> {
    try {
        switch (toolName) {
            case "read_file": {
                const filePath = toolInput.file_path as string;
                const content = await readFileTool(filePath);
                return {
                    success: true,
                    content,
                };
            }

            case "get_directory_tree": {
                const directory = (toolInput.directory as string) || process.cwd();
                const tree = await getTree(directory);
                return {
                    success: true,
                    content: tree,
                };
            }

            case "search_files": {
                const query = toolInput.query as string;
                const results = await searchFiles(query);
                return {
                    success: true,
                    content: results,
                };
            }

            case "write_file": {
                const filePath = toolInput.file_path as string;
                const content = toolInput.content as string;
                const result = await writeFileTool(filePath, content);
                return {
                    success: true,
                    content: result,
                };
            }

            case "run_command": {
                const command = toolInput.command as string;
                const result = await runCommand(command);
                return {
                    success: true,
                    content: result,
                };
            }

            default:
                return {
                    success: false,
                    content: `Неизвестный инструмент: ${toolName}`,
                };
        }
    } catch (error) {
        return {
            success: false,
            content: `Ошибка выполнения инструмента ${toolName}: ${error}`,
        };
    }
}

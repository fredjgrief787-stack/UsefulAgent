import { readFileTool } from "./readFile.js";
import { getTree } from "./tree.js";
import { searchFiles } from "./searchFiles.js";
import { writeFileTool } from "./writeFile.js";
import { runCommand } from "./runCommand.js";
import type { ToolCall, ToolResult } from "../core/types.js";
import path from "node:path";

/**
 * Выполняет инструмент на основе ToolCall и возвращает ToolResult
 */
export async function executeTool(toolCall: ToolCall): Promise<ToolResult> {
    const { name, input, id } = toolCall;
    
    try {
        switch (name) {
            case "read_file": {
                // Валидация обязательного поля file_path
                if (!input.file_path || typeof input.file_path !== "string") {
                    return {
                        success: false,
                        content: "Ошибка валидации: поле 'file_path' обязательно и должно быть строкой",
                        toolCallId: id,
                    };
                }
                const filePath = input.file_path;
                const content = await readFileTool(filePath);
                return {
                    success: true,
                    content,
                    toolCallId: id,
                };
            }

            case "get_directory_tree": {
                // directory опциональное, но если присутствует — должно быть строкой
                if (input.directory !== undefined && typeof input.directory !== "string") {
                    return {
                        success: false,
                        content: "Ошибка валидации: поле 'directory' должно быть строкой",
                        toolCallId: id,
                    };
                }
                const directory = input.directory || process.cwd();
                const tree = await getTree(directory);
                return {
                    success: true,
                    content: tree,
                    toolCallId: id,
                };
            }

            case "search_files": {
                // Валидация обязательного поля query
                if (!input.query || typeof input.query !== "string") {
                    return {
                        success: false,
                        content: "Ошибка валидации: поле 'query' обязательно и должно быть строкой",
                        toolCallId: id,
                    };
                }
                const query = input.query;
                const results = await searchFiles(query);
                return {
                    success: true,
                    content: results,
                    toolCallId: id,
                };
            }

            case "write_file": {
                // Валидация обязательных полей file_path и content
                if (!input.file_path || typeof input.file_path !== "string") {
                    return {
                        success: false,
                        content: "Ошибка валидации: поле 'file_path' обязательно и должно быть строкой",
                        toolCallId: id,
                    };
                }
                if (input.content === undefined || typeof input.content !== "string") {
                    return {
                        success: false,
                        content: "Ошибка валидации: поле 'content' обязательно и должно быть строкой",
                        toolCallId: id,
                    };
                }
                const filePath = input.file_path;
                const content = input.content;
                const result = await writeFileTool(filePath, content);
                return {
                    success: true,
                    content: result,
                    toolCallId: id,
                };
            }

            case "run_command": {
                // Валидация обязательного поля command
                if (!input.command || typeof input.command !== "string") {
                    return {
                        success: false,
                        content: "Ошибка валидации: поле 'command' обязательно и должно быть строкой",
                        toolCallId: id,
                    };
                }
                const command = input.command;
                const result = await runCommand(command);
                return {
                    success: true,
                    content: result,
                    toolCallId: id,
                };
            }

            default:
                return {
                    success: false,
                    content: `Неизвестный инструмент: ${name}`,
                    toolCallId: id,
                };
        }
    } catch (error) {
        return {
            success: false,
            content: `Ошибка выполнения инструмента ${name}: ${error instanceof Error ? error.message : String(error)}`,
            toolCallId: id,
        };
    }
}

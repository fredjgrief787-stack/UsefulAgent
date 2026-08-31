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
                const filePath = input.file_path as string;
                const content = await readFileTool(filePath);
                return {
                    success: true,
                    content,
                    toolCallId: id,
                };
            }

            case "get_directory_tree": {
                const directory = (input.directory as string) || process.cwd();
                const tree = await getTree(directory);
                return {
                    success: true,
                    content: tree,
                    toolCallId: id,
                };
            }

            case "search_files": {
                const query = input.query as string;
                const results = await searchFiles(query);
                return {
                    success: true,
                    content: results,
                    toolCallId: id,
                };
            }

            case "write_file": {
                const filePath = input.file_path as string;
                const content = input.content as string;
                const result = await writeFileTool(filePath, content);
                return {
                    success: true,
                    content: result,
                    toolCallId: id,
                };
            }

            case "run_command": {
                const command = input.command as string;
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
            content: `Ошибка выполнения инструмента ${name}: ${error}`,
            toolCallId: id,
        };
    }
}

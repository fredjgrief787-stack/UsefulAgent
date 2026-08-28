import { readFileTool } from "./tools/readFile.js";
import { getTree } from "./tools/tree.js";
import { toolDefinitions } from "./tools/definitions.js";
import { executeTool } from "./tools/executor.js";
import { getSystemPrompt } from "./prompt.js";
import { getProjectContext } from "./projectContext.js";
import { ContextManager } from "./contextManager.js";
import { AgentStats } from "./agentStats.js";
import { runCommand, categorizeCommand } from "./tools/runCommand.js";
import path from "node:path";
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: "https://api.claudehub.fun",
});

const rl = readline.createInterface({
    input,
    output,
});

const contextManager = new ContextManager();

console.log("=================================");
console.log("       Anime Agent");
console.log("=================================");
console.log("Напиши сообщение или 'exit' для выхода.\n");

async function main() {
    // Получаем контекст проекта при старте
    console.log("Загрузка контекста проекта...");
    const projectContext = await getProjectContext(process.cwd());
    const systemPrompt = getSystemPrompt(projectContext);
    console.log("✓ Контекст загружен\n");
    while (true) {
        const userInput = await rl.question("> ");

        if (userInput.toLowerCase() === "exit") {
            break;
        }

        if (!userInput.trim()) {
            continue;
        }

        // Оставляем старые команды для обратной совместимости
        if (userInput === "/tree") {
            const tree = await getTree(process.cwd());
            console.log("\n" + tree);
            continue;
        }

        if (userInput.startsWith("/read ")) {
            const filePath = userInput.slice(6).trim();
            const content = await readFileTool(filePath);
            console.log("\n" + content + "\n");
            continue;
        }

        // Добавляем сообщение пользователя
        contextManager.addMessage({
            role: "user",
            content: userInput,
        });

        try {
            // Статистика для текущего запроса
            const requestStats = new AgentStats();
            
            // Основной цикл обработки с поддержкой tool use
            let continueLoop = true;
            let toolLoopCount = 0;
            const MAX_TOOL_LOOPS = 10;

            while (continueLoop) {
                // Диагностика контекста перед запросом
                const stats = contextManager.getStats();
                console.log(`[Context: ${stats.totalMessages} messages, ~${stats.totalSize} chars, ${stats.utilizationPercent}%]`);
                
                // Записываем статистику API-запроса
                requestStats.recordApiCall(stats.totalSize);
                
                const response = await client.messages.create({
                    model: "claude-sonnet-4-6",
                    max_tokens: 4096,
                    system: systemPrompt,
                    tools: toolDefinitions,
                    messages: contextManager.getContextForClaude(),
                });

                // Записываем размер ответа
                const responseSize = JSON.stringify(response.content).length;
                requestStats.recordResponse(responseSize);

                // Добавляем ответ ассистента в историю
                contextManager.addMessage({
                    role: "assistant",
                    content: response.content,
                });

                // Проверяем причину остановки
                if (response.stop_reason === "end_turn") {
                    // Обычный текстовый ответ
                    const textContent = response.content
                        .filter((block) => block.type === "text")
                        .map((block) => block.text)
                        .join("");

                    if (textContent) {
                        console.log(`\n${textContent}\n`);
                    }
                    continueLoop = false;
                } else if (response.stop_reason === "tool_use") {
                    // Проверка лимита итераций
                    toolLoopCount++;
                    requestStats.recordToolLoop();
                    
                    if (toolLoopCount > MAX_TOOL_LOOPS) {
                        console.log(`\n⚠️ Достигнут лимит итераций инструментов (${MAX_TOOL_LOOPS}). Прерываю выполнение.\n`);
                        continueLoop = false;
                        continue;
                    }
                    
                    // Claude хочет использовать инструменты
                    const toolUseBlocks = response.content.filter(
                        (block) => block.type === "tool_use"
                    );

                    if (toolUseBlocks.length === 0) {
                        continueLoop = false;
                        continue;
                    }

                    console.log(
                        `\n[Выполняю ${toolUseBlocks.length} инструмент(ов)...]\n`
                    );

                    // Выполняем все запрошенные инструменты
                    const toolResults: Anthropic.MessageParam = {
                        role: "user",
                        content: [],
                    };

                    for (const block of toolUseBlocks) {
                        if (block.type === "tool_use") {
                            console.log(`  - ${block.name}`);
                            requestStats.recordToolCall();

                            // Специальная обработка run_command с подтверждением
                            if (block.name === "run_command") {
                                const command = (block.input as Record<string, unknown>).command as string;
                                const category = categorizeCommand(command);

                                // Если требуется подтверждение
                                if (category === "confirm") {
                                    console.log(`\n⚠️  Команда требует подтверждения: ${command}`);
                                    const confirmation = await rl.question("Выполнить? [y/N]: ");
                                    
                                    if (confirmation.toLowerCase() === "y") {
                                        console.log("✓ Подтверждено, выполняю...\n");
                                        const result = await runCommand(command, true);
                                        const resultBlock: Anthropic.ToolResultBlockParam = {
                                            type: "tool_result" as const,
                                            tool_use_id: block.id,
                                            content: result,
                                            is_error: false,
                                        };
                                        (toolResults.content as Anthropic.ToolResultBlockParam[]).push(resultBlock);
                                        requestStats.recordToolResult(result.length);
                                    } else {
                                        console.log("✗ Отменено пользователем\n");
                                        const cancelMsg = "❌ Выполнение команды отменено пользователем";
                                        (toolResults.content as Anthropic.ToolResultBlockParam[]).push({
                                            type: "tool_result",
                                            tool_use_id: block.id,
                                            content: cancelMsg,
                                            is_error: false,
                                        });
                                        requestStats.recordToolResult(cancelMsg.length);
                                    }
                                    continue;
                                }
                            }

                            // Обычное выполнение инструмента
                            const result = await executeTool(
                                block.name,
                                block.input as Record<string, unknown>
                            );

                            const resultBlock: Anthropic.ToolResultBlockParam = {
                                type: "tool_result" as const,
                                tool_use_id: block.id,
                                content: result.content,
                                is_error: !result.success,
                            };
                            (toolResults.content as Anthropic.ToolResultBlockParam[]).push(resultBlock);
                            requestStats.recordToolResult(result.content.length);
                        }
                    }

                    console.log();

                    // Добавляем результаты инструментов в историю
                    contextManager.addMessage(toolResults);

                    // Продолжаем цикл, чтобы получить финальный ответ
                    continueLoop = true;
                } else {
                    // Другие причины остановки (max_tokens и т.д.)
                    const textContent = response.content
                        .filter((block) => block.type === "text")
                        .map((block) => block.text)
                        .join("");

                    if (textContent) {
                        console.log(`\n${textContent}\n`);
                    }
                    continueLoop = false;
                }
            }
            
            // Выводим статистику после завершения запроса
            console.log(requestStats.formatStats() + "\n");
        } catch (error) {
            console.error("\nОшибка при запросе к Claude:", error, "\n");
        }
    }

    rl.close();
}

main();

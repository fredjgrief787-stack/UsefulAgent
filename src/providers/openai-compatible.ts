/**
 * OpenAI-Compatible Provider
 * Реализация ModelProvider для OpenAI и совместимых API
 * 
 * ЗАВИСИМОСТИ: требует установки пакета 'openai'
 * Установка: pnpm add openai
 * 
 * ЛОКАЛЬНЫЕ МОДЕЛИ: Ollama, LM Studio и большинство локальных раннеров предоставляют
 * OpenAI-совместимый API. Используйте baseURL, указывающий на localhost (например,
 * http://localhost:11434/v1 для Ollama) для работы с локальными моделями.
 */

// @ts-ignore - openai пакет может быть не установлен
import OpenAI from "openai";
import type { ModelProvider, ModelResponse } from "./index.js";
import type { ToolCall } from "../core/types.js";
import { toolDefinitions } from "../tools/definitions.js";

/**
 * Провайдер для OpenAI-совместимых API
 */
export class OpenAICompatibleProvider implements ModelProvider {
    private client: any; // OpenAI client
    private model: string;

    constructor(apiKey: string, baseURL?: string, model?: string) {
        this.client = new OpenAI({
            apiKey,
            ...(baseURL && { baseURL }),
        });
        this.model = model || "gpt-4-turbo";
    }

    /**
     * Отправляет сообщение модели и возвращает ответ с tool calls
     */
    async sendMessage(
        systemPrompt: string,
        messages: any[]
    ): Promise<ModelResponse> {
        // Конвертация истории из Anthropic-формата в OpenAI-формат
        const openAIMessages = this.convertMessages(systemPrompt, messages);

        // Конвертация tool definitions из Anthropic-формата в OpenAI-формат
        const tools = this.convertTools();

        // Вызов OpenAI API
        const response = await this.client.chat.completions.create({
            model: this.model,
            messages: openAIMessages,
            tools,
        });

        const choice = response.choices[0];
        
        // Конвертация ответа в унифицированные ToolCall
        const toolCalls = this.convertResponse(choice);

        // rawResponse - сырой ответ OpenAI (unknown, не нужно приводить к Anthropic.Message)
        return {
            toolCalls,
            rawResponse: response, // Возвращаем нативный OpenAI response
        };
    }

    /**
     * Возвращает имя провайдера
     */
    getProviderName(): string {
        return "OpenAI-compatible";
    }

    /**
     * Возвращает возможности провайдера
     */
    getCapabilities() {
        return {
            supportsNativeToolUse: true,
            maxContextTokens: 128000, // GPT-4 Turbo (TODO: может отличаться для других моделей)
        };
    }

    /**
     * Конвертирует историю сообщений из Anthropic-формата в OpenAI-формат
     */
    private convertMessages(
        systemPrompt: string,
        messages: any[]
    ): any[] {
        const result: any[] = [
            { role: "system", content: systemPrompt },
        ];

        for (const msg of messages) {
            if (msg.role === "user") {
                // User message может содержать text и/или tool_result блоки
                if (typeof msg.content === "string") {
                    // Простой текст
                    result.push({ role: "user", content: msg.content });
                } else if (Array.isArray(msg.content)) {
                    // Массив блоков - разделяем tool_result и текст
                    const toolResultBlocks = msg.content.filter((block: any) => block.type === "tool_result");
                    const textBlocks = msg.content.filter((block: any) => block.type === "text");

                    // Сначала добавляем все tool results как отдельные role: "tool" сообщения
                    for (const block of toolResultBlocks) {
                        if (block.type === "tool_result") {
                            result.push({
                                role: "tool",
                                tool_call_id: block.tool_use_id,
                                content: typeof block.content === "string" 
                                    ? block.content 
                                    : JSON.stringify(block.content),
                            });
                        }
                    }

                    // Затем добавляем обычное user сообщение с текстом (если есть)
                    if (textBlocks.length > 0) {
                        const textContent = textBlocks
                            .map((block: any) => block.type === "text" ? block.text : "")
                            .join("\n");
                        
                        if (textContent.trim()) {
                            result.push({ role: "user", content: textContent });
                        }
                    }
                }
            } else if (msg.role === "assistant") {
                // Assistant message
                if (!Array.isArray(msg.content)) {
                    // Если content не массив - пропускаем (некорректный формат)
                    continue;
                }

                const textBlocks = msg.content.filter((block: any) => block.type === "text");
                const toolUseBlocks = msg.content.filter((block: any) => block.type === "tool_use");

                if (toolUseBlocks.length > 0) {
                    // Assistant с tool calls
                    const toolCalls: any[] = toolUseBlocks.map((block: any) => {
                        if (block.type === "tool_use") {
                            return {
                                id: block.id,
                                type: "function" as const,
                                function: {
                                    name: block.name,
                                    arguments: JSON.stringify(block.input),
                                },
                            };
                        }
                        throw new Error("Unexpected block type");
                    });

                    result.push({
                        role: "assistant",
                        content: textBlocks.length > 0 
                            ? textBlocks.map((b: any) => b.type === "text" ? b.text : "").join("") 
                            : null,
                        tool_calls: toolCalls,
                    });
                } else {
                    // Обычный текстовый ответ assistant
                    const content = textBlocks
                        .map((b: any) => b.type === "text" ? b.text : "")
                        .join("");
                    result.push({ role: "assistant", content });
                }
            }
        }

        return result;
    }

    /**
     * Конвертирует tool definitions из Anthropic-формата в OpenAI-формат
     */
    private convertTools(): any[] {
        return toolDefinitions.map((tool: any) => ({
            type: "function" as const,
            function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.input_schema,
            },
        }));
    }

    /**
     * Конвертирует ответ OpenAI в список ToolCall
     */
    private convertResponse(choice: any): ToolCall[] {
        if (!choice.message.tool_calls) {
            return [];
        }

        return choice.message.tool_calls.map((toolCall: any) => ({
            id: toolCall.id,
            name: toolCall.function.name,
            input: JSON.parse(toolCall.function.arguments),
        }));
    }
}

/**
 * Anthropic Provider
 * Реализация ModelProvider для Claude через Anthropic API
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ModelProvider, ModelResponse } from "./index.js";
import type { ToolCall } from "../core/types.js";
import { fromAnthropicToolUse } from "../core/converters.js";
import { toolDefinitions } from "../tools/definitions.js";

/**
 * Провайдер для Claude (Anthropic API)
 */
export class AnthropicProvider implements ModelProvider {
    private client: Anthropic;

    constructor(apiKey: string, baseURL?: string) {
        this.client = new Anthropic({
            apiKey,
            ...(baseURL && { baseURL }), // baseURL передаётся только если явно указан
        });
    }

    /**
     * Отправляет сообщение Claude и возвращает ответ с tool calls
     */
    async sendMessage(
        systemPrompt: string,
        messages: Anthropic.MessageParam[]
    ): Promise<ModelResponse> {
        // Вызов Anthropic API
        const response = await this.client.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            tools: toolDefinitions,
            messages,
        });

        // Конвертация ответа в унифицированные ToolCall
        const toolCalls = this.convertResponse(response);

        return {
            toolCalls,
            rawResponse: response,
        };
    }

    /**
     * Возвращает имя провайдера
     */
    getProviderName(): string {
        return "Anthropic";
    }

    /**
     * Возвращает возможности провайдера
     */
    getCapabilities() {
        return {
            supportsNativeToolUse: true,
            maxContextTokens: 200000, // Claude 3.5 Sonnet (TODO: сверить с актуальной документацией)
        };
    }

    /**
     * Конвертирует ответ Anthropic в список ToolCall
     */
    private convertResponse(response: Anthropic.Message): ToolCall[] {
        const toolUseBlocks = response.content.filter(
            (block) => block.type === "tool_use"
        );
        
        return toolUseBlocks.map((block) => {
            if (block.type === "tool_use") {
                return fromAnthropicToolUse({
                    type: "tool_use",
                    id: block.id,
                    name: block.name,
                    input: block.input as Record<string, unknown>,
                });
            }
            throw new Error("Unexpected block type");
        });
    }
}

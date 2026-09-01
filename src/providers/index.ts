/**
 * Model Provider Abstraction Layer
 * Единый интерфейс для вызова различных AI-моделей
 */

import type { ToolCall } from "../core/types.js";

/**
 * Возможности провайдера модели
 */
export interface ProviderCapabilities {
    /** Поддерживает ли провайдер нативный tool calling (function calling) */
    supportsNativeToolUse: boolean;
    /** Примерный размер контекстного окна в токенах */
    maxContextTokens: number;
}

/**
 * Результат вызова модели
 */
export interface ModelResponse {
    /** Унифицированные вызовы tools (пустой массив если модель просто ответила текстом) */
    toolCalls: ToolCall[];
    /** 
     * Сырой ответ от API провайдера (для добавления в историю сообщений)
     * Тип unknown - каждый провайдер возвращает свой нативный формат,
     * место использования должно привести к нужному типу (например, Anthropic.Message)
     */
    rawResponse: unknown;
}

/**
 * Интерфейс провайдера модели
 * Абстрагирует работу с конкретными AI API
 */
export interface ModelProvider {
    /**
     * Отправляет сообщение модели и возвращает ответ с tool calls
     * 
     * @param systemPrompt - Системный промпт
     * @param messages - История сообщений (пока в формате Anthropic)
     * @returns Результат с tool calls и сырым ответом
     */
    sendMessage(
        systemPrompt: string,
        messages: any[] // Пока Anthropic.MessageParam[], но интерфейс не зависит от конкретного SDK
    ): Promise<ModelResponse>;

    /**
     * Возвращает имя провайдера для логирования и отладки
     * @returns Название провайдера (например, "Anthropic", "OpenAI")
     */
    getProviderName(): string;

    /**
     * Возвращает возможности провайдера
     * @returns Объект с описанием возможностей (tool use, размер контекста)
     */
    getCapabilities(): ProviderCapabilities;
}

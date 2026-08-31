/**
 * Внутренний формат вызова инструмента (независимо от провайдера)
 */
export interface ToolCall {
    /** Имя инструмента */
    name: string;
    /** Параметры вызова */
    input: Record<string, unknown>;
    /** Уникальный ID вызова */
    id: string;
}

/**
 * Внутренний формат результата выполнения инструмента
 */
export interface ToolResult {
    /** Успешность выполнения */
    success: boolean;
    /** Текстовый результат или описание ошибки */
    content: string;
    /** ID вызова, к которому относится результат */
    toolCallId: string;
}

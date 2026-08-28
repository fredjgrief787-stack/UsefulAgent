import Anthropic from "@anthropic-ai/sdk";

/**
 * Максимальный размер контекста в символах (примерно ~40k токенов)
 */
const MAX_CONTEXT_SIZE = 100000;

/**
 * Минимальное количество последних сообщений для сохранения
 */
const MIN_MESSAGES_TO_KEEP = 6;

/**
 * Максимальный размер одного tool_result (20k символов)
 */
const MAX_TOOL_RESULT_SIZE = 20000;

/**
 * Оценивает размер сообщения в символах
 */
function estimateMessageSize(message: Anthropic.MessageParam): number {
    let size = 0;

    if (typeof message.content === "string") {
        size += message.content.length;
    } else if (Array.isArray(message.content)) {
        for (const block of message.content) {
            if (block.type === "text") {
                size += block.text.length;
            } else if (block.type === "tool_use") {
                size += JSON.stringify(block.input).length + 100; // +100 для метаданных
            } else if (block.type === "tool_result") {
                size += (block.content?.toString() || "").length;
            }
        }
    }

    return size;
}

/**
 * Оценивает общий размер массива сообщений
 */
function estimateTotalSize(messages: Anthropic.MessageParam[]): number {
    return messages.reduce((total, msg) => total + estimateMessageSize(msg), 0);
}

/**
 * Context Manager для управления историей сообщений
 */
export class ContextManager {
    private messages: Anthropic.MessageParam[] = [];
    private maxContextSize: number;
    private minMessagesToKeep: number;

    constructor(
        maxContextSize: number = MAX_CONTEXT_SIZE,
        minMessagesToKeep: number = MIN_MESSAGES_TO_KEEP
    ) {
        this.maxContextSize = maxContextSize;
        this.minMessagesToKeep = minMessagesToKeep;
    }

    /**
     * Добавляет сообщение в историю с ограничением размера tool_result
     */
    addMessage(message: Anthropic.MessageParam): void {
        // Ограничиваем размер tool_result при добавлении
        if (message.role === "user" && Array.isArray(message.content)) {
            const limitedContent: any[] = [];
            
            for (const block of message.content) {
                if (block.type === "tool_result") {
                    const content = block.content?.toString() || "";
                    if (content.length > MAX_TOOL_RESULT_SIZE) {
                        limitedContent.push({
                            type: "tool_result",
                            tool_use_id: block.tool_use_id,
                            content: content.substring(0, MAX_TOOL_RESULT_SIZE) + 
                                `\n\n... (обрезано ${content.length - MAX_TOOL_RESULT_SIZE} символов)`,
                            is_error: block.is_error,
                        });
                    } else {
                        limitedContent.push(block);
                    }
                } else {
                    limitedContent.push(block);
                }
            }
            
            message = {
                role: message.role,
                content: limitedContent,
            };
        }
        
        this.messages.push(message);
        this.trimIfNeeded();
    }

    /**
     * Получает все сообщения
     */
    getMessages(): Anthropic.MessageParam[] {
        return this.messages;
    }

    /**
     * Получает ограниченную версию истории для отправки Claude
     */
    getContextForClaude(): Anthropic.MessageParam[] {
        return this.messages;
    }

    /**
     * Очищает старые tool_result, если контекст слишком большой
     */
    private trimIfNeeded(): void {
        const currentSize = estimateTotalSize(this.messages);

        // Если размер в пределах нормы, ничего не делаем
        if (currentSize <= this.maxContextSize) {
            return;
        }

        console.log(`\n⚠️  Контекст превышает лимит (${currentSize} > ${this.maxContextSize}), очистка старых результатов...\n`);

        // Сохраняем последние N сообщений
        const recentMessages = this.messages.slice(-this.minMessagesToKeep);

        // Проходим по старым сообщениям и удаляем большие tool_result
        const trimmedMessages: Anthropic.MessageParam[] = [];

        for (let i = 0; i < this.messages.length - this.minMessagesToKeep; i++) {
            const msg = this.messages[i];

            // Если это пользовательское сообщение с tool_result
            if (msg.role === "user" && Array.isArray(msg.content)) {
                const trimmedContent: any[] = [];

                for (const block of msg.content) {
                    if (block.type === "tool_result") {
                        // Заменяем большие результаты на заглушку
                        const resultSize = (block.content?.toString() || "").length;
                        if (resultSize > 5000) {
                            trimmedContent.push({
                                type: "tool_result",
                                tool_use_id: block.tool_use_id,
                                content: `[Результат инструмента удалён для экономии контекста, размер: ${resultSize} символов]`,
                                is_error: block.is_error,
                            });
                        } else {
                            trimmedContent.push(block);
                        }
                    } else {
                        trimmedContent.push(block);
                    }
                }

                trimmedMessages.push({
                    role: msg.role,
                    content: trimmedContent,
                });
            } else {
                // Обычные сообщения сохраняем как есть
                trimmedMessages.push(msg);
            }
        }

        // Объединяем обрезанные старые сообщения с последними
        this.messages = [...trimmedMessages, ...recentMessages];

        const newSize = estimateTotalSize(this.messages);
        console.log(`✓ Контекст сокращён: ${currentSize} → ${newSize} символов\n`);
    }

    /**
     * Возвращает статистику контекста
     */
    getStats(): {
        totalMessages: number;
        totalSize: number;
        maxSize: number;
        utilizationPercent: number;
    } {
        const totalSize = estimateTotalSize(this.messages);
        return {
            totalMessages: this.messages.length,
            totalSize,
            maxSize: this.maxContextSize,
            utilizationPercent: Math.round((totalSize / this.maxContextSize) * 100),
        };
    }

    /**
     * Очищает всю историю
     */
    clear(): void {
        this.messages = [];
    }
}

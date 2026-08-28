/**
 * Локальная статистика работы агента
 */
export class AgentStats {
    private apiCallCount = 0;
    private toolLoopCount = 0;
    private toolCallCount = 0;
    private contextCharsSent = 0;
    private responseCharsReceived = 0;
    private toolResultCount = 0;

    /**
     * Регистрирует API-запрос
     */
    recordApiCall(contextSize: number): void {
        this.apiCallCount++;
        this.contextCharsSent += contextSize;
    }

    /**
     * Регистрирует ответ от API
     */
    recordResponse(responseSize: number): void {
        this.responseCharsReceived += responseSize;
    }

    /**
     * Регистрирует tool loop итерацию
     */
    recordToolLoop(): void {
        this.toolLoopCount++;
    }

    /**
     * Регистрирует вызов инструмента
     */
    recordToolCall(): void {
        this.toolCallCount++;
    }

    /**
     * Регистрирует отправку tool_result
     */
    recordToolResult(resultSize: number): void {
        this.toolResultCount++;
        this.contextCharsSent += resultSize;
    }

    /**
     * Форматирует статистику для вывода
     */
    formatStats(): string {
        const contextK = Math.round(this.contextCharsSent / 1000);
        const responseK = Math.round(this.responseCharsReceived / 1000);
        
        return `[Stats] API: ${this.apiCallCount} | Tools: ${this.toolCallCount} | Loops: ${this.toolLoopCount} | Context: ~${contextK}k chars | Results: ~${responseK}k chars`;
    }

    /**
     * Сбрасывает статистику
     */
    reset(): void {
        this.apiCallCount = 0;
        this.toolLoopCount = 0;
        this.toolCallCount = 0;
        this.contextCharsSent = 0;
        this.responseCharsReceived = 0;
        this.toolResultCount = 0;
    }
}

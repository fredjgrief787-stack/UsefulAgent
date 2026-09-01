# OpenAI-Compatible Provider

Провайдер для работы с OpenAI и совместимыми API (OpenAI, Azure OpenAI, локальные модели с совместимым API).

## Установка зависимостей

```bash
pnpm add openai
```

## Использование

```typescript
import { OpenAICompatibleProvider } from "./providers/openai-compatible.js";

const provider = new OpenAICompatibleProvider(
    process.env.OPENAI_API_KEY!,
    process.env.OPENAI_BASE_URL, // опционально
    process.env.OPENAI_MODEL      // опционально, по умолчанию "gpt-4-turbo"
);

const response = await provider.sendMessage(systemPrompt, messages);
```

## Конфигурация

Добавьте в `.env`:

```env
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1  # опционально
OPENAI_MODEL=gpt-4-turbo                   # опционально
```

## Конвертация форматов

Провайдер автоматически конвертирует:

1. **История сообщений**: Anthropic `MessageParam[]` → OpenAI `ChatCompletionMessageParam[]`
2. **Tool definitions**: Anthropic формат → OpenAI `function` формат
3. **Ответ модели**: OpenAI `ChatCompletion` → унифицированный `ToolCall[]` + Anthropic `Message`

### Поддерживаемые элементы истории

- ✅ User text messages
- ✅ Assistant text messages
- ✅ Assistant tool calls (Anthropic `tool_use` → OpenAI `function call`)
- ✅ Tool results (Anthropic `tool_result` → встроено в user message)

### Edge cases (пока не реализовано полностью)

- ⚠️ Сложные вложенные content блоки
- ⚠️ Image content blocks (не поддерживается в текущей версии)
- ⚠️ Tool results как отдельные tool messages (сейчас встроены в user messages как текст)

## Статус

- ✅ Интерфейс ModelProvider реализован
- ✅ Конвертация основных типов сообщений
- ✅ Tool calling support
- ⚠️ Требует установки пакета `openai`
- ⚠️ Не подключен в index.ts (используется только Anthropic провайдер)

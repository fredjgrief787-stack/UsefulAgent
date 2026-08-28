import Anthropic from "@anthropic-ai/sdk";

/**
 * Определения инструментов для Anthropic API
 */
export const toolDefinitions: Anthropic.Tool[] = [
    {
        name: "read_file",
        description:
            "Читает содержимое файла по указанному пути. Используй этот инструмент, когда нужно прочитать или проанализировать содержимое конкретного файла.",
        input_schema: {
            type: "object",
            properties: {
                file_path: {
                    type: "string",
                    description:
                        "Путь к файлу, который нужно прочитать (может быть относительным или абсолютным)",
                },
            },
            required: ["file_path"],
        },
    },
    {
        name: "get_directory_tree",
        description:
            "Показывает структуру директории в виде дерева. Используй этот инструмент, когда нужно понять структуру проекта, найти файлы или увидеть организацию папок.",
        input_schema: {
            type: "object",
            properties: {
                directory: {
                    type: "string",
                    description:
                        "Путь к директории для отображения (по умолчанию текущая директория)",
                },
            },
            required: [],
        },
    },
    {
        name: "search_files",
        description:
            "Ищет текст, символ, название функции, класса, переменной или другой шаблон внутри файлов проекта. Возвращает список файлов с номерами строк и содержимым найденных совпадений. Используй этот инструмент вместо чтения множества файлов, когда нужно найти, где что-то используется или определено.",
        input_schema: {
            type: "object",
            properties: {
                query: {
                    type: "string",
                    description:
                        "Текст для поиска (название функции, класса, переменной, строка кода или любой другой текст)",
                },
            },
            required: ["query"],
        },
    },
    {
        name: "write_file",
        description:
            "Создаёт новый файл или перезаписывает существующий файл указанным содержимым. Работает только внутри workspace проекта. Автоматически создаёт родительские директории при необходимости. Перед изменением существующего файла желательно сначала прочитать его с помощью read_file.",
        input_schema: {
            type: "object",
            properties: {
                file_path: {
                    type: "string",
                    description:
                        "Путь к файлу для записи (относительный от корня проекта или абсолютный внутри workspace)",
                },
                content: {
                    type: "string",
                    description: "Содержимое файла для записи",
                },
            },
            required: ["file_path", "content"],
        },
    },
    {
        name: "run_command",
        description:
            "Выполняет команду в терминале внутри workspace проекта. Используй для сборки проекта, запуска тестов, проверки git статуса, установки зависимостей, запуска локальных скриптов и диагностики ошибок. Команда выполняется с таймаутом 60 секунд. Возвращает exit code, stdout и stderr.",
        input_schema: {
            type: "object",
            properties: {
                command: {
                    type: "string",
                    description:
                        "Команда для выполнения (например: 'pnpm build', 'git status', 'node script.js')",
                },
            },
            required: ["command"],
        },
    },
];

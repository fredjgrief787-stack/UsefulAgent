// Тесты Platform Abstraction Layer
import { detectPlatform, getPlatformAdapter } from "../dist/platform/index.js";

console.log("=== Тесты Platform Abstraction Layer ===\n");

let passed = 0;
let failed = 0;

function test(name, fn) {
    try {
        fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`  ${error.message}\n`);
        failed++;
    }
}

async function testAsync(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        passed++;
    } catch (error) {
        console.error(`❌ ${name}`);
        console.error(`  ${error.message}\n`);
        failed++;
    }
}

// Тест 1: detectPlatform возвращает корректное значение
test("detectPlatform: возвращает 'windows' на Windows", () => {
    const platform = detectPlatform();
    // На Windows process.platform === 'win32'
    if (process.platform === 'win32' && platform !== 'windows') {
        throw new Error(`Expected 'windows', got '${platform}'`);
    }
    // Просто проверим, что функция возвращает что-то валидное
    if (!['windows', 'linux', 'unsupported'].includes(platform)) {
        throw new Error(`Invalid platform: ${platform}`);
    }
});

// Тест 2: getPlatformAdapter возвращает адаптер
await testAsync("getPlatformAdapter: возвращает адаптер", async () => {
    const adapter = await getPlatformAdapter();
    if (!adapter) {
        throw new Error("Adapter is null or undefined");
    }
    if (typeof adapter.getShellExecutable !== 'function') {
        throw new Error("Adapter missing getShellExecutable method");
    }
    if (typeof adapter.isCmdWrapper !== 'function') {
        throw new Error("Adapter missing isCmdWrapper method");
    }
});

// Тест 3: getShellExecutable возвращает корректный shell
await testAsync("getShellExecutable: возвращает корректный shell для платформы", async () => {
    const adapter = await getPlatformAdapter();
    const shell = adapter.getShellExecutable();
    
    const platform = detectPlatform();
    if (platform === 'windows' && shell !== 'pwsh') {
        throw new Error(`Expected 'pwsh' on Windows, got '${shell}'`);
    }
    if (platform === 'linux' && shell !== 'bash') {
        throw new Error(`Expected 'bash' on Linux, got '${shell}'`);
    }
    
    if (!shell || typeof shell !== 'string') {
        throw new Error(`Invalid shell: ${shell}`);
    }
});

// Тест 4: isCmdWrapper работает корректно на Windows
await testAsync("isCmdWrapper: корректно определяет .cmd обёртки", async () => {
    const adapter = await getPlatformAdapter();
    const platform = detectPlatform();
    
    if (platform === 'windows') {
        // На Windows pnpm, npm, tsc должны быть определены как cmd wrappers
        if (!adapter.isCmdWrapper('pnpm')) {
            throw new Error("pnpm should be recognized as cmd wrapper on Windows");
        }
        if (!adapter.isCmdWrapper('npm')) {
            throw new Error("npm should be recognized as cmd wrapper on Windows");
        }
        if (!adapter.isCmdWrapper('tsc')) {
            throw new Error("tsc should be recognized as cmd wrapper on Windows");
        }
        
        // git и node не должны быть cmd wrappers
        if (adapter.isCmdWrapper('git')) {
            throw new Error("git should not be recognized as cmd wrapper");
        }
        if (adapter.isCmdWrapper('node')) {
            throw new Error("node should not be recognized as cmd wrapper");
        }
    } else if (platform === 'linux') {
        // На Linux всё должно быть false
        if (adapter.isCmdWrapper('pnpm')) {
            throw new Error("isCmdWrapper should always return false on Linux");
        }
        if (adapter.isCmdWrapper('npm')) {
            throw new Error("isCmdWrapper should always return false on Linux");
        }
    }
});

// Тест 5: moveToTrash бросает "Not implemented"
await testAsync("moveToTrash: бросает ошибку 'Not implemented'", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        await adapter.moveToTrash('/tmp/test.txt');
        throw new Error("Expected moveToTrash to throw");
    } catch (error) {
        if (!error.message.includes('Not implemented')) {
            throw new Error(`Expected 'Not implemented', got: ${error.message}`);
        }
    }
});

// Тест 6: listInstalledPrograms бросает "Not implemented"
await testAsync("listInstalledPrograms: бросает ошибку 'Not implemented'", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        await adapter.listInstalledPrograms();
        throw new Error("Expected listInstalledPrograms to throw");
    } catch (error) {
        if (!error.message.includes('Not implemented')) {
            throw new Error(`Expected 'Not implemented', got: ${error.message}`);
        }
    }
});

// Тест 7: getSteamPath бросает "Not implemented"
await testAsync("getSteamPath: бросает ошибку 'Not implemented'", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        await adapter.getSteamPath();
        throw new Error("Expected getSteamPath to throw");
    } catch (error) {
        if (!error.message.includes('Not implemented')) {
            throw new Error(`Expected 'Not implemented', got: ${error.message}`);
        }
    }
});

// Тест 8: Проверка регистронезависимости для isCmdWrapper
await testAsync("isCmdWrapper: регистронезависимая проверка", async () => {
    const adapter = await getPlatformAdapter();
    const platform = detectPlatform();
    
    if (platform === 'windows') {
        // Должно работать с разными регистрами
        if (!adapter.isCmdWrapper('PNPM')) {
            throw new Error("isCmdWrapper should be case-insensitive");
        }
        if (!adapter.isCmdWrapper('Npm')) {
            throw new Error("isCmdWrapper should be case-insensitive");
        }
    }
});

// Тест 9: getPlatformAdapter бросает ошибку для неподдерживаемой ОС
await testAsync("getPlatformAdapter: бросает ошибку для неподдерживаемой ОС", async () => {
    // Сохраняем оригинальное значение
    const originalPlatform = process.platform;
    
    try {
        // Мокаем process.platform на darwin (macOS) - неподдерживаемая ОС
        Object.defineProperty(process, 'platform', {
            value: 'darwin',
            writable: true,
            configurable: true
        });
        
        try {
            await getPlatformAdapter();
            throw new Error("Expected getPlatformAdapter to throw for unsupported platform");
        } catch (error) {
            if (!error.message.includes('Unsupported platform')) {
                throw new Error(`Expected 'Unsupported platform' error, got: ${error.message}`);
            }
            if (!error.message.includes('darwin')) {
                throw new Error(`Expected error to mention 'darwin', got: ${error.message}`);
            }
        }
    } finally {
        // Восстанавливаем оригинальное значение
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            writable: true,
            configurable: true
        });
    }
});

console.log(`\n📊 Результаты: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.error(`\n❌ Провалено ${failed} тест(ов)`);
    process.exit(1);
} else {
    console.log("\n✅ Все тесты Platform Abstraction Layer пройдены!");
}

// Тесты реестра доступности фич (Feature Availability Registry)
import { getPlatformAdapter, assertFeatureAvailable } from "../dist/platform/index.js";

console.log("=== Тесты реестра доступности фич ===\n");

let passed = 0;
let failed = 0;

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

// Тест 1: isFeatureAvailable возвращает false для 'trash' (не реализована)
await testAsync("isFeatureAvailable: 'trash' недоступна (пока не реализована)", async () => {
    const adapter = await getPlatformAdapter();
    const available = adapter.isFeatureAvailable('trash');
    
    if (available !== false) {
        throw new Error(`Expected false for 'trash', got ${available}`);
    }
});

// Тест 2: isFeatureAvailable возвращает false для 'installed_programs'
await testAsync("isFeatureAvailable: 'installed_programs' недоступна (пока не реализована)", async () => {
    const adapter = await getPlatformAdapter();
    const available = adapter.isFeatureAvailable('installed_programs');
    
    if (available !== false) {
        throw new Error(`Expected false for 'installed_programs', got ${available}`);
    }
});

// Тест 3: isFeatureAvailable возвращает false для 'steam_path'
await testAsync("isFeatureAvailable: 'steam_path' недоступна (пока не реализована)", async () => {
    const adapter = await getPlatformAdapter();
    const available = adapter.isFeatureAvailable('steam_path');
    
    if (available !== false) {
        throw new Error(`Expected false for 'steam_path', got ${available}`);
    }
});

// Тест 4: assertFeatureAvailable бросает ошибку для 'trash'
await testAsync("assertFeatureAvailable: бросает ошибку для недоступной 'trash'", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        assertFeatureAvailable(adapter, 'trash');
        throw new Error("Expected assertFeatureAvailable to throw");
    } catch (error) {
        if (!error.message.includes('недоступна')) {
            throw new Error(`Expected error about unavailable feature, got: ${error.message}`);
        }
        if (!error.message.includes('Корзина')) {
            throw new Error(`Expected error to mention 'Корзина', got: ${error.message}`);
        }
    }
});

// Тест 5: assertFeatureAvailable бросает ошибку для 'installed_programs'
await testAsync("assertFeatureAvailable: бросает ошибку для недоступной 'installed_programs'", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        assertFeatureAvailable(adapter, 'installed_programs');
        throw new Error("Expected assertFeatureAvailable to throw");
    } catch (error) {
        if (!error.message.includes('недоступна')) {
            throw new Error(`Expected error about unavailable feature, got: ${error.message}`);
        }
        if (!error.message.includes('Список установленных программ')) {
            throw new Error(`Expected error to mention 'Список установленных программ', got: ${error.message}`);
        }
    }
});

// Тест 6: assertFeatureAvailable бросает ошибку для 'steam_path'
await testAsync("assertFeatureAvailable: бросает ошибку для недоступной 'steam_path'", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        assertFeatureAvailable(adapter, 'steam_path');
        throw new Error("Expected assertFeatureAvailable to throw");
    } catch (error) {
        if (!error.message.includes('недоступна')) {
            throw new Error(`Expected error about unavailable feature, got: ${error.message}`);
        }
        if (!error.message.includes('Steam')) {
            throw new Error(`Expected error to mention 'Steam', got: ${error.message}`);
        }
    }
});

// Тест 7: Ошибка содержит название платформы
await testAsync("assertFeatureAvailable: ошибка содержит название платформы", async () => {
    const adapter = await getPlatformAdapter();
    
    try {
        assertFeatureAvailable(adapter, 'trash');
        throw new Error("Expected assertFeatureAvailable to throw");
    } catch (error) {
        // Должно содержать либо 'windows', либо 'linux'
        if (!error.message.includes('windows') && !error.message.includes('linux')) {
            throw new Error(`Expected error to mention platform, got: ${error.message}`);
        }
    }
});

console.log(`\n📊 Результаты: ${passed} passed, ${failed} failed`);

if (failed > 0) {
    console.error(`\n❌ Провалено ${failed} тест(ов)`);
    process.exit(1);
} else {
    console.log("\n✅ Все тесты реестра доступности фич пройдены!");
}

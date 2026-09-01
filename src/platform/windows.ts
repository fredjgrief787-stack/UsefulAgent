import type { PlatformAdapter, FeatureName } from './index.js';

/**
 * Адаптер для Windows платформы
 */
export class WindowsAdapter implements PlatformAdapter {
    /**
     * Список известных .cmd/.bat обёрток на Windows
     * После CVE-2024-27980 эти команды требуют { shell: true } для корректной работы
     */
    private readonly CMD_WRAPPERS = ['pnpm', 'npm', 'npx', 'tsc', 'tsx'];

    /**
     * Возвращает shell для Windows
     */
    getShellExecutable(): string {
        return 'pwsh';
    }

    /**
     * Проверяет, является ли исполняемый файл .cmd/.bat обёрткой
     */
    isCmdWrapper(executable: string): boolean {
        return this.CMD_WRAPPERS.includes(executable.toLowerCase());
    }

    /**
     * Проверяет доступность фичи на Windows
     * Все три фичи пока не реализованы (вернутся true в будущих фазах)
     */
    isFeatureAvailable(feature: FeatureName): boolean {
        // Пока все фичи не реализованы
        return false;
    }

    /**
     * Перемещает файл в корзину Windows
     * @throws Error - не реализовано, планируется в будущей фазе
     */
    async moveToTrash(filePath: string): Promise<void> {
        throw new Error('Not implemented — планируется в будущей фазе (Filesystem)');
    }

    /**
     * Возвращает список установленных программ через Windows Registry
     * @throws Error - не реализовано, планируется в будущей фазе
     */
    async listInstalledPrograms(): Promise<string[]> {
        throw new Error('Not implemented — планируется в будущей фазе (Application Control)');
    }

    /**
     * Возвращает путь к Steam на Windows
     * @throws Error - не реализовано, планируется в будущей фазе
     */
    async getSteamPath(): Promise<string | null> {
        throw new Error('Not implemented — планируется в будущей фазе (Steam)');
    }
}

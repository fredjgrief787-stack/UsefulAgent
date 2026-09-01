import type { PlatformAdapter, FeatureName } from './index.js';

/**
 * Адаптер для Linux платформы
 */
export class LinuxAdapter implements PlatformAdapter {
    /**
     * Возвращает shell для Linux
     */
    getShellExecutable(): string {
        return 'bash';
    }

    /**
     * На Linux нет .cmd/.bat обёрток
     */
    isCmdWrapper(executable: string): boolean {
        return false;
    }

    /**
     * Проверяет доступность фичи на Linux
     * Все три фичи пока не реализованы (вернутся true в будущих фазах)
     */
    isFeatureAvailable(feature: FeatureName): boolean {
        // Пока все фичи не реализованы
        return false;
    }

    /**
     * Перемещает файл в корзину Linux (trash)
     * @throws Error - не реализовано, планируется в будущей фазе
     */
    async moveToTrash(filePath: string): Promise<void> {
        throw new Error('Not implemented — планируется в будущей фазе (Filesystem)');
    }

    /**
     * Возвращает список установленных программ (dpkg/rpm/flatpak)
     * @throws Error - не реализовано, планируется в будущей фазе
     */
    async listInstalledPrograms(): Promise<string[]> {
        throw new Error('Not implemented — планируется в будущей фазе (Application Control)');
    }

    /**
     * Возвращает путь к Steam на Linux
     * @throws Error - не реализовано, планируется в будущей фазе
     */
    async getSteamPath(): Promise<string | null> {
        throw new Error('Not implemented — планируется в будущей фазе (Steam)');
    }
}

/**
 * Platform Abstraction Layer (PAL)
 * Единый интерфейс для системных операций, различающихся по ОС
 */

/**
 * Имена фич, доступность которых зависит от платформы
 * Список будет расширяться по мере добавления новых фаз:
 * - Фаза "Filesystem": trash
 * - Фаза "Application Control": installed_programs
 * - Фаза "Steam": steam_path
 */
export type FeatureName = 'trash' | 'installed_programs' | 'steam_path';

/**
 * Интерфейс адаптера платформы
 */
export interface PlatformAdapter {
    /**
     * Возвращает имя shell-исполняемого файла для данной платформы
     * @returns "pwsh" для Windows, "bash" для Linux
     */
    getShellExecutable(): string;

    /**
     * Проверяет, является ли данный исполняемый файл .cmd/.bat обёрткой (только Windows)
     * @param executable - Имя исполняемого файла
     * @returns true если это .cmd/.bat обёртка на Windows, false иначе
     */
    isCmdWrapper(executable: string): boolean;

    /**
     * Проверяет, доступна ли данная фича на текущей платформе
     * @param feature - Имя фичи для проверки
     * @returns true если фича реализована и доступна, false иначе
     */
    isFeatureAvailable(feature: FeatureName): boolean;

    /**
     * Перемещает файл в корзину/trash
     * @param filePath - Путь к файлу
     * @throws Error("Not implemented") - будет реализовано в будущей фазе
     */
    moveToTrash(filePath: string): Promise<void>;

    /**
     * Возвращает список установленных программ
     * @returns Список названий программ
     * @throws Error("Not implemented") - будет реализовано в будущей фазе
     */
    listInstalledPrograms(): Promise<string[]>;

    /**
     * Возвращает путь к Steam, если установлен
     * @returns Путь к Steam или null если не найден
     * @throws Error("Not implemented") - будет реализовано в будущей фазе
     */
    getSteamPath(): Promise<string | null>;
}

/**
 * Определяет текущую платформу
 * @returns 'windows' | 'linux' | 'unsupported'
 */
export function detectPlatform(): 'windows' | 'linux' | 'unsupported' {
    switch (process.platform) {
        case 'win32':
            return 'windows';
        case 'linux':
            return 'linux';
        default:
            return 'unsupported';
    }
}

/**
 * Возвращает адаптер для текущей платформы
 * @returns Экземпляр PlatformAdapter
 * @throws Error если платформа не поддерживается
 */
export async function getPlatformAdapter(): Promise<PlatformAdapter> {
    const platform = detectPlatform();

    switch (platform) {
        case 'windows': {
            const { WindowsAdapter } = await import('./windows.js');
            return new WindowsAdapter();
        }
        case 'linux': {
            const { LinuxAdapter } = await import('./linux.js');
            return new LinuxAdapter();
        }
        case 'unsupported':
            throw new Error(
                `Unsupported platform: ${process.platform}. ` +
                `This application supports Windows and Linux only.`
            );
    }
}

/**
 * Проверяет доступность фичи и бросает понятную ошибку если недоступна
 * @param adapter - Адаптер платформы
 * @param feature - Имя фичи для проверки
 * @throws Error если фича недоступна на текущей платформе
 */
export function assertFeatureAvailable(adapter: PlatformAdapter, feature: FeatureName): void {
    if (!adapter.isFeatureAvailable(feature)) {
        const platform = detectPlatform();
        const featureNames: Record<FeatureName, string> = {
            'trash': 'Корзина (moveToTrash)',
            'installed_programs': 'Список установленных программ (listInstalledPrograms)',
            'steam_path': 'Путь к Steam (getSteamPath)',
        };
        
        throw new Error(
            `Функция "${featureNames[feature]}" недоступна на текущей платформе (${platform}). ` +
            `Эта фича ещё не реализована или не поддерживается на данной ОС.`
        );
    }
}

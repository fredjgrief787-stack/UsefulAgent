import path from "node:path";

/**
 * Корневая директория workspace проекта
 */
export const WORKSPACE_ROOT = process.env.WORKSPACE_ROOT || "C:\\dev\\anime-agent";

/**
 * Резолвит путь относительно workspace и проверяет его безопасность.
 * 
 * @param targetPath - Относительный или абсолютный путь для проверки
 * @returns Резолвленный абсолютный путь, если он находится внутри workspace
 * @throws Error если путь находится за пределами workspace
 */
export function resolveWorkspacePath(targetPath: string): string {
    // Резолвим workspace root в абсолютный путь
    const workspaceResolved = path.resolve(WORKSPACE_ROOT);
    
    // Резолвим целевой путь (относительно workspace, если не абсолютный)
    const resolved = path.isAbsolute(targetPath)
        ? path.resolve(targetPath)
        : path.resolve(workspaceResolved, targetPath);
    
    // Проверяем, находится ли resolved внутри workspace через relative
    const relativePath = path.relative(workspaceResolved, resolved);
    
    // Путь безопасен, если:
    // 1. relativePath не начинается с '..' (не выходит за пределы родителя)
    // 2. relativePath не является абсолютным (не на другом диске/корне)
    const isSafe = 
        !relativePath.startsWith('..') && 
        !path.isAbsolute(relativePath);
    
    if (!isSafe) {
        throw new Error(
            `Security error: path is outside workspace.\n` +
            `Attempted path: ${targetPath}\n` +
            `Resolved to: ${resolved}\n` +
            `Workspace: ${workspaceResolved}`
        );
    }
    
    return resolved;
}

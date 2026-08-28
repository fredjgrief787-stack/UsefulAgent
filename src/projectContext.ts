import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Интерфейс контекста проекта
 */
interface ProjectContext {
    workspacePath: string;
    projectType: string;
    hasPackageJson: boolean;
    packageManager: string | null;
    mainScripts: string[];
    directories: {
        src: boolean;
        tests: boolean;
        assets: boolean;
    };
    topLevelFiles: string[];
    git: {
        available: boolean;
        branch: string | null;
        status: string | null;
    };
}

/**
 * Определяет package manager по наличию lock-файлов
 */
async function detectPackageManager(workspaceRoot: string): Promise<string | null> {
    try {
        const files = await fs.readdir(workspaceRoot);
        
        if (files.includes("pnpm-lock.yaml")) return "pnpm";
        if (files.includes("yarn.lock")) return "yarn";
        if (files.includes("package-lock.json")) return "npm";
        if (files.includes("bun.lockb")) return "bun";
        
        return null;
    } catch {
        return null;
    }
}

/**
 * Читает основные скрипты из package.json
 */
async function getMainScripts(workspaceRoot: string): Promise<string[]> {
    try {
        const packageJsonPath = path.join(workspaceRoot, "package.json");
        const content = await fs.readFile(packageJsonPath, "utf8");
        const packageJson = JSON.parse(content);
        
        if (packageJson.scripts) {
            return Object.keys(packageJson.scripts).slice(0, 10); // Только первые 10
        }
        
        return [];
    } catch {
        return [];
    }
}

/**
 * Проверяет наличие директории
 */
async function directoryExists(dirPath: string): Promise<boolean> {
    try {
        const stat = await fs.stat(dirPath);
        return stat.isDirectory();
    } catch {
        return false;
    }
}

/**
 * Получает список файлов верхнего уровня
 */
async function getTopLevelFiles(workspaceRoot: string): Promise<string[]> {
    try {
        const entries = await fs.readdir(workspaceRoot, { withFileTypes: true });
        
        return entries
            .filter(entry => entry.isFile())
            .map(entry => entry.name)
            .filter(name => !name.startsWith(".")) // Исключаем скрытые файлы
            .slice(0, 20); // Максимум 20 файлов
    } catch {
        return [];
    }
}

/**
 * Получает информацию о git репозитории
 */
async function getGitInfo(workspaceRoot: string): Promise<{
    available: boolean;
    branch: string | null;
    status: string | null;
}> {
    try {
        // Проверяем наличие .git директории
        const gitDir = path.join(workspaceRoot, ".git");
        const hasGit = await directoryExists(gitDir);
        
        if (!hasGit) {
            return { available: false, branch: null, status: null };
        }

        let branch: string | null = null;
        let status: string | null = null;

        // Получаем текущую ветку
        try {
            const { stdout: branchOutput } = await execAsync("git branch --show-current", {
                cwd: workspaceRoot,
                timeout: 3000,
            });
            branch = branchOutput.trim() || null;
        } catch {
            // Игнорируем ошибки
        }

        // Получаем краткий статус
        try {
            const { stdout: statusOutput } = await execAsync("git status --short", {
                cwd: workspaceRoot,
                timeout: 3000,
            });
            const lines = statusOutput.trim().split("\n").filter(l => l);
            if (lines.length > 0) {
                status = `${lines.length} изменений`;
            } else {
                status = "чистый";
            }
        } catch {
            // Игнорируем ошибки
        }

        return { available: true, branch, status };
    } catch {
        return { available: false, branch: null, status: null };
    }
}

/**
 * Определяет тип проекта по содержимому
 */
async function detectProjectType(workspaceRoot: string): Promise<string> {
    try {
        const packageJsonPath = path.join(workspaceRoot, "package.json");
        const hasPackageJson = await fs.stat(packageJsonPath).then(() => true).catch(() => false);
        
        if (hasPackageJson) {
            const content = await fs.readFile(packageJsonPath, "utf8");
            const packageJson = JSON.parse(content);
            
            // Определяем по зависимостям
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            if (deps["@anthropic-ai/sdk"]) return "AI Agent (TypeScript/Node.js)";
            if (deps["react"]) return "React";
            if (deps["vue"]) return "Vue";
            if (deps["next"]) return "Next.js";
            if (deps["express"]) return "Express.js";
            if (deps["typescript"]) return "TypeScript/Node.js";
            
            return "Node.js";
        }
        
        return "Unknown";
    } catch {
        return "Unknown";
    }
}

/**
 * Собирает контекст проекта
 */
export async function getProjectContext(workspaceRoot: string): Promise<string> {
    try {
        // Собираем информацию
        const projectType = await detectProjectType(workspaceRoot);
        const packageJsonPath = path.join(workspaceRoot, "package.json");
        const hasPackageJson = await fs.stat(packageJsonPath).then(() => true).catch(() => false);
        const packageManager = await detectPackageManager(workspaceRoot);
        const mainScripts = hasPackageJson ? await getMainScripts(workspaceRoot) : [];
        
        const directories = {
            src: await directoryExists(path.join(workspaceRoot, "src")),
            tests: await directoryExists(path.join(workspaceRoot, "tests")) || 
                   await directoryExists(path.join(workspaceRoot, "test")),
            assets: await directoryExists(path.join(workspaceRoot, "assets")),
        };
        
        const topLevelFiles = await getTopLevelFiles(workspaceRoot);
        const git = await getGitInfo(workspaceRoot);

        // Формируем компактный контекст
        let context = `**Контекст проекта:**\n\n`;
        context += `- Workspace: ${workspaceRoot}\n`;
        context += `- Тип: ${projectType}\n`;
        
        if (packageManager) {
            context += `- Package Manager: ${packageManager}\n`;
        }
        
        if (mainScripts.length > 0) {
            context += `- Доступные скрипты: ${mainScripts.join(", ")}\n`;
        }
        
        const existingDirs = [];
        if (directories.src) existingDirs.push("src");
        if (directories.tests) existingDirs.push("tests");
        if (directories.assets) existingDirs.push("assets");
        
        if (existingDirs.length > 0) {
            context += `- Директории: ${existingDirs.join(", ")}\n`;
        }
        
        if (topLevelFiles.length > 0) {
            context += `- Файлы верхнего уровня: ${topLevelFiles.slice(0, 10).join(", ")}\n`;
        }
        
        if (git.available) {
            context += `- Git: ${git.branch ? `ветка ${git.branch}` : "доступен"}`;
            if (git.status) {
                context += `, ${git.status}`;
            }
            context += `\n`;
        }

        return context;
    } catch (error) {
        return `**Контекст проекта:**\n\n- Workspace: ${workspaceRoot}\n- Ошибка получения контекста: ${error}\n`;
    }
}

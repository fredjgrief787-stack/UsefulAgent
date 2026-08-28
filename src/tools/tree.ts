import fs from "node:fs/promises";
import path from "node:path";

const ignored = new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "out",
]);

export async function getTree(
    directory: string,
    prefix = ""
): Promise<string> {
    const allEntries = await fs.readdir(directory, {
        withFileTypes: true,
    });

    const entries = allEntries.filter(
        (entry) => !ignored.has(entry.name)
    );

    entries.sort((a, b) => {
        if (a.isDirectory() !== b.isDirectory()) {
            return a.isDirectory() ? -1 : 1;
        }

        return a.name.localeCompare(b.name);
    });

    let result = "";

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const isLast = i === entries.length - 1;

        result += prefix;
        result += isLast ? "└── " : "├── ";
        result += entry.name + "\n";

        if (entry.isDirectory()) {
            result += await getTree(
                path.join(directory, entry.name),
                prefix + (isLast ? "    " : "│   ")
            );
        }
    }

    return result;
}
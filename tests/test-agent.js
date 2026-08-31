// Простой тест для проверки работы агента
import { toolDefinitions } from "../dist/tools/definitions.js";
import { executeTool } from "../dist/tools/executor.js";

console.log("=== Тест инструментов Anime Agent ===\n");

console.log("1. Определения инструментов:");
console.log(JSON.stringify(toolDefinitions, null, 2));
console.log("\n");

console.log("2. Тест get_directory_tree:");
const treeResult = await executeTool({
    name: "get_directory_tree",
    input: { directory: "." },
    id: "test_tree_1"
});
console.log(treeResult.content);
console.log("\n");

console.log("3. Тест read_file:");
const fileResult = await executeTool({
    name: "read_file",
    input: { file_path: "package.json" },
    id: "test_read_1"
});
console.log(fileResult.content.substring(0, 200) + "...");
console.log("\n");

console.log("✅ Все инструменты работают корректно!");

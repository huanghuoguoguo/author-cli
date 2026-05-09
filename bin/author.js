#!/usr/bin/env node
import { spawn } from "child_process";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = resolve(__dirname, "../tools/src/cli.ts");

// Windows 需要 shell: true 来正确找到 npx
// 使用安全的方式传递参数
const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["tsx", cliPath, ...process.argv.slice(2)],
  {
    stdio: "inherit",
    shell: process.platform === "win32",
    windowsVerbatimArguments: process.platform === "win32",
  }
);

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
import { mkdirSync, existsSync, symlinkSync, lstatSync, realpathSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SKILLS = [
  "write-scenes",
  "suggest-canon",
  "continuity-check",
  "webnovel-style",
  "traditional-style",
  "screenplay-style",
  "import-manuscript",
];

// 获取 author-cli 的目录位置（skills 目录的父目录）
function getAuthorCliRoot(): string {
  // 通过当前模块路径定位 author-cli 目录
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // tools/src/commands/init.ts -> author-cli/
  return resolve(currentDir, "..", "..", "..");
}

// 在 Windows 上创建符号链接需要特殊处理
function createSymlink(target: string, linkPath: string): void {
  if (existsSync(linkPath)) {
    const stats = lstatSync(linkPath);
    if (stats.isSymbolicLink()) {
      const existingTarget = realpathSync(linkPath);
      if (existingTarget === target) {
        console.log(`  ✓ 已存在: ${basename(linkPath)}`);
        return;
      }
    }
    // 如果已存在但不是正确的符号链接，需要先删除
    // 但这里我们选择报错让用户处理
    console.log(`  ⚠ 已存在但不是符号链接: ${basename(linkPath)}`);
    return;
  }

  try {
    // Windows 目录符号链接需要 junction 类型（不需要管理员权限）
    if (process.platform === "win32") {
      symlinkSync(target, linkPath, "junction");
    } else {
      symlinkSync(target, linkPath, "dir");
    }
    console.log(`  ✓ 创建: ${basename(linkPath)} → ${target}`);
  } catch (err: any) {
    if (err.code === "EPERM") {
      console.log(`  ⚠ 权限不足，请以管理员身份运行或启用 Windows 开发者模式`);
      console.log(`    或者手动创建符号链接: mklink /D "${linkPath}" "${target}"`);
    } else {
      throw err;
    }
  }
}

export function registerInitCommand(program: any) {
  program
    .command("init")
    .description("在当前工作目录初始化 Claude Code skills（创建符号链接）")
    .option("--author-cli <path>", "author-cli 目录路径（默认自动检测）")
    .action((options: { authorCli?: string }) => {
      const workDir = process.cwd();
      const skillsDir = join(workDir, ".claude", "skills");

      // 定位 author-cli 的 skills 目录
      const authorCliRoot = options.authorCli ?? getAuthorCliRoot();
      const authorSkillsDir = join(authorCliRoot, "skills");

      console.log(`工作目录: ${workDir}`);
      console.log(`author-cli: ${authorCliRoot}`);
      console.log(`\n创建 .claude/skills 目录...`);

      // 创建 .claude/skills 目录
      if (!existsSync(skillsDir)) {
        mkdirSync(skillsDir, { recursive: true });
        console.log(`  ✓ 创建目录: ${skillsDir}`);
      } else {
        console.log(`  ✓ 目录已存在: ${skillsDir}`);
      }

      // 创建符号链接
      console.log(`\n创建 skills 符号链接...`);
      for (const skill of SKILLS) {
        const target = join(authorSkillsDir, skill);
        const linkPath = join(skillsDir, skill);

        if (!existsSync(target)) {
          console.log(`  ✗ 源目录不存在: ${skill}`);
          continue;
        }

        createSymlink(target, linkPath);
      }

      console.log(`\n完成! 现可以在 Claude Code 中使用 /write-scenes 等命令。`);
      console.log(`提示: 如果符号链接创建失败，请尝试:`);
      console.log(`  - Windows: 以管理员身份运行，或启用开发者模式`);
      console.log(`  - 或使用 --author-cli 参数指定 author-cli 目录`);
    });
}
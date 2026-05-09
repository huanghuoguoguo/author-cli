import { mkdirSync, existsSync, symlinkSync, lstatSync, realpathSync, cpSync, writeFileSync, readFileSync } from "node:fs";
import { resolve, join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const SKILLS = [
  "plan-chapter",
  "write-scenes",
  "suggest-canon",
  "continuity-check",
  "writing-style",
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
    console.log(`  ⚠ 已存在但不是符号链接: ${basename(linkPath)}`);
    return;
  }

  try {
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

// 复制模板文件，如果目标不存在则创建
function copyTemplateFile(src: string, dest: string): void {
  if (!existsSync(dest)) {
    writeFileSync(dest, readFileSync(src));
    console.log(`  ✓ 创建: ${basename(dest)}`);
  } else {
    console.log(`  ○ 已存在: ${basename(dest)}`);
  }
}

export function registerInitCommand(program: any) {
  program
    .command("init")
    .description("在指定工作目录初始化小说写作项目结构")
    .option("--work-dir <path>", "小说工作目录路径（默认当前目录）")
    .option("--author-cli <path>", "author-cli 目录路径（默认自动检测）")
    .option("--skip-templates", "跳过模板文件创建（只创建 skills 符号链接）")
    .action((options: { workDir?: string; authorCli?: string; skipTemplates?: boolean }) => {
      // 确定工作目录
      let workDir = options.workDir ? resolve(options.workDir) : process.cwd();

      // 定位 author-cli 的目录
      const authorCliRoot = options.authorCli ?? getAuthorCliRoot();

      // 检查：如果工作目录是 author-cli 本身，给出警告
      if (resolve(workDir) === resolve(authorCliRoot)) {
        console.log(`⚠ 警告: 工作目录 (${workDir}) 与 author-cli 目录相同。`);
        console.log(`  author-cli 是工具目录，不应作为小说工作目录。`);
        console.log(`  请指定正确的小说工作目录:`);
        console.log(`    author init --work-dir <小说目录>`);
        console.log(`  或切换到小说目录后运行:`);
        console.log(`    cd <小说目录> && author init`);
        process.exit(1);
      }

      const templatesDir = join(authorCliRoot, "templates");
      const skillsDir = join(workDir, ".claude", "skills");
      const authorSkillsDir = join(authorCliRoot, "skills");

      console.log(`工作目录: ${workDir}`);
      console.log(`author-cli: ${authorCliRoot}`);

      // ==================== 创建目录结构 ====================
      if (!options.skipTemplates) {
        console.log(`\n创建项目目录结构...`);

        // 创建 canon 目录（带 README）
        const canonDirs = ["characters", "locations", "world", "objects", "plot", "rules"];
        for (const dir of canonDirs) {
          const targetDir = join(workDir, "canon", dir);
          if (!existsSync(targetDir)) {
            mkdirSync(targetDir, { recursive: true });
            console.log(`  ✓ 创建目录: canon/${dir}/`);
          } else {
            console.log(`  ○ 已存在: canon/${dir}/`);
          }
          // 复制 README
          copyTemplateFile(
            join(templatesDir, "canon", dir, "README.md"),
            join(targetDir, "README.md")
          );
        }

        // 创建 manuscript/v01 目录
        const manuscriptDir = join(workDir, "manuscript", "v01");
        if (!existsSync(manuscriptDir)) {
          mkdirSync(manuscriptDir, { recursive: true });
          console.log(`  ✓ 创建目录: manuscript/v01/`);
        } else {
          console.log(`  ○ 已存在: manuscript/v01/`);
        }
        copyTemplateFile(
          join(templatesDir, "manuscript", "v01", "README.md"),
          join(manuscriptDir, "README.md")
        );

        // 创建 proposals 目录
        const proposalsDir = join(workDir, "proposals");
        if (!existsSync(proposalsDir)) {
          mkdirSync(proposalsDir, { recursive: true });
          console.log(`  ✓ 创建目录: proposals/`);
        } else {
          console.log(`  ○ 已存在: proposals/`);
        }
        copyTemplateFile(
          join(templatesDir, "proposals", "README.md"),
          join(proposalsDir, "README.md")
        );

        // 创建 generated 目录
        const generatedDir = join(workDir, "generated");
        if (!existsSync(generatedDir)) {
          mkdirSync(generatedDir, { recursive: true });
          console.log(`  ✓ 创建目录: generated/`);
        } else {
          console.log(`  ○ 已存在: generated/`);
        }
        copyTemplateFile(
          join(templatesDir, "generated", "README.md"),
          join(generatedDir, "README.md")
        );

        // 创建配置文件
        console.log(`\n创建配置文件...`);
        copyTemplateFile(
          join(templatesDir, "project.yaml"),
          join(workDir, "project.yaml")
        );
        copyTemplateFile(
          join(templatesDir, "canon", "book.yaml"),
          join(workDir, "canon", "book.yaml")
        );
        copyTemplateFile(
          join(templatesDir, "canon", "timeline.yaml"),
          join(workDir, "canon", "timeline.yaml")
        );
      }

      // ==================== 创建 skills 符号链接 ====================
      console.log(`\n创建 .claude/skills 符号链接...`);

      // 创建 .claude/skills 目录
      if (!existsSync(skillsDir)) {
        mkdirSync(skillsDir, { recursive: true });
        console.log(`  ✓ 创建目录: .claude/skills/`);
      } else {
        console.log(`  ○ 已存在: .claude/skills/`);
      }

      // 创建符号链接
      for (const skill of SKILLS) {
        const target = join(authorSkillsDir, skill);
        const linkPath = join(skillsDir, skill);

        if (!existsSync(target)) {
          console.log(`  ✗ 源目录不存在: ${skill}`);
          continue;
        }

        createSymlink(target, linkPath);
      }

      // ==================== 完成提示 ====================
      console.log(`\n========================================`);
      console.log(`✓ 项目初始化完成!`);
      console.log(`========================================`);
      console.log(`\n项目结构:`);
      console.log(`  ${workDir}/`);
      console.log(`  ├── canon/              # 设定数据`);
      console.log(`  │   ├── book.yaml       # 作品信息`);
      console.log(`  │   ├── timeline.yaml   # 时间线`);
      console.log(`  │   ├── characters/     # 角色`);
      console.log(`  │   ├── locations/      # 地点`);
      console.log(`  │   ├── world/          # 世界观`);
      console.log(`  │   ├── plot/           # 大纲`);
      console.log(`  │   └── rules/          # 写作规则`);
      console.log(`  ├── manuscript/v01/     # 章节正文`);
      console.log(`  ├── proposals/          # AI 建议`);
      console.log(`  ├── generated/          # 生成输出`);
      console.log(`  ├── project.yaml        # 项目配置`);
      console.log(`  └── .claude/skills/     # Claude Code skills`);
      console.log(`\n下一步:`);
      console.log(`  1. 编辑 canon/book.yaml 设置作品信息`);
      console.log(`  2. 使用 /import-manuscript 从现有章节导入设定`);
      console.log(`  3. 或手动创建角色: author character add --id <id> --name <名称>`);
      console.log(`  4. 创建章节: author chapter add --id ch001 --title "第一章"`);
      console.log(`  5. 开始写作: /write-scenes`);
      console.log(`\n提示: 使用 --skip-templates 可跳过模板创建`);
    });
}
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, rmSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";

const TEST_DIR = join(process.cwd(), "test-workspace");
const PROJECT_ROOT = process.cwd();
const AUTHOR_CMD = `npx tsx ${join(PROJECT_ROOT, "tools/src/cli.ts")}`;

function runAuthor(args: string): string {
  return execSync(`${AUTHOR_CMD} ${args}`, { cwd: TEST_DIR, encoding: "utf-8" });
}

describe("author-cli core commands", () => {
  beforeAll(() => {
    // 创建测试工作区
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
    mkdirSync(TEST_DIR, { recursive: true });

    // 创建基础结构
    mkdirSync(join(TEST_DIR, "canon/characters"), { recursive: true });
    mkdirSync(join(TEST_DIR, "canon/locations"), { recursive: true });
    mkdirSync(join(TEST_DIR, "canon/world"), { recursive: true });
    mkdirSync(join(TEST_DIR, "canon/objects"), { recursive: true });
    mkdirSync(join(TEST_DIR, "canon/plot"), { recursive: true });
    mkdirSync(join(TEST_DIR, "canon/rules"), { recursive: true });
    mkdirSync(join(TEST_DIR, "manuscript/v01"), { recursive: true });
    mkdirSync(join(TEST_DIR, "generated"), { recursive: true });
    mkdirSync(join(TEST_DIR, "proposals/canon-suggestions"), { recursive: true });

    // 创建 project.yaml
    writeFileSync(join(TEST_DIR, "project.yaml"), `id: test-novel
title: 测试小说
language: zh-CN
writingMode: traditional
currentChapter: ch001
manuscriptDir: manuscript
canonDir: canon
generatedDir: generated
defaultContext:
  previousChapterCount: 2
  includeFullCurrentChapter: false
  currentChapterWindowChars: 5000
`);

    // 创建 book.yaml
    writeFileSync(join(TEST_DIR, "canon/book.yaml"), `id: test-novel
title: 测试小说
genre: mystery
synopsis: ""
style: ""
tone: ""
targetAudience: ""
pov: ""
themes: []
writingMode: traditional
`);

    // 创建空的 plot/mainline.yaml
    writeFileSync(join(TEST_DIR, "canon/plot/mainline.yaml"), `id: mainline
name: 主线
type: mainline
status: active
mainConflict: ""
currentArc: ""
chapters: []
foreshadowing: []
`);

    // 创建空的 timeline.yaml
    writeFileSync(join(TEST_DIR, "canon/timeline.yaml"), `events: []
`);

    // 创建空的 rules/style-guide.yaml
    writeFileSync(join(TEST_DIR, "canon/rules/style-guide.yaml"), `id: style-guide
name: 文风规范
priority: high
rules: []
mustDo: []
mustNotDo: []
voice: ""
dialogueRules: []
revisionRules: []
`);
  });

  afterAll(() => {
    // 清理测试工作区
    if (existsSync(TEST_DIR)) rmSync(TEST_DIR, { recursive: true });
  });

  describe("validate", () => {
    it("should pass on valid empty project", () => {
      const output = runAuthor("validate");
      expect(output).toContain("✓");
    });
  });

  describe("character", () => {
    it("should add a character", () => {
      const output = runAuthor("character add --id test-char --name 测试角色 --role protagonist");
      expect(output).toContain("✓ 角色已创建");
      expect(existsSync(join(TEST_DIR, "canon/characters/test-char.yaml"))).toBe(true);
    });

    it("should list characters", () => {
      const output = runAuthor("character list");
      expect(output).toContain("test-char");
      expect(output).toContain("测试角色");
    });

    it("should show character details", () => {
      const output = runAuthor("character show test-char");
      expect(output).toContain("test-char");
      expect(output).toContain("测试角色");
    });

    it("should update character", () => {
      runAuthor("character update test-char --field motivation --value 寻找真相");
      const output = runAuthor("character show test-char");
      expect(output).toContain("寻找真相");
    });

    it("should add character note", () => {
      const output = runAuthor("character note test-char --chapter ch001 --text 测试备注");
      expect(output).toContain("✓ 已为角色");
    });

    it("should delete character", () => {
      // 先创建一个临时角色
      runAuthor("character add --id temp-char --name 临时角色 --role minor");
      expect(existsSync(join(TEST_DIR, "canon/characters/temp-char.yaml"))).toBe(true);

      // 删除
      const output = runAuthor("character delete temp-char");
      expect(output).toContain("✓ 角色已删除");
      expect(existsSync(join(TEST_DIR, "canon/characters/temp-char.yaml"))).toBe(false);
    });
  });

  describe("location", () => {
    it("should add and list location", () => {
      runAuthor("location add --id test-loc --name 测试地点");
      const output = runAuthor("location list");
      expect(output).toContain("test-loc");
      expect(output).toContain("测试地点");
    });

    it("should delete location", () => {
      runAuthor("location add --id temp-loc --name 临时地点");
      runAuthor("location delete temp-loc");
      expect(existsSync(join(TEST_DIR, "canon/locations/temp-loc.yaml"))).toBe(false);
    });
  });

  describe("world", () => {
    it("should add and list world", () => {
      runAuthor("world add --id test-world --name 测试世界观 --category society");
      const output = runAuthor("world list");
      expect(output).toContain("test-world");
    });
  });

  describe("object", () => {
    it("should add and list object", () => {
      runAuthor("object add --id test-obj --name 测试物品 --type clue");
      const output = runAuthor("object list");
      expect(output).toContain("test-obj");
    });
  });

  describe("timeline", () => {
    it("should add and list timeline event", () => {
      runAuthor("timeline add --id evt-001 --title 测试事件 --chapter ch001");
      const output = runAuthor("timeline list");
      expect(output).toContain("evt-001");
      expect(output).toContain("测试事件");
    });

    it("should show timeline event", () => {
      const output = runAuthor("timeline show evt-001");
      expect(output).toContain("evt-001");
    });
  });

  describe("chapter", () => {
    it("should add chapter", () => {
      const output = runAuthor("chapter add --id ch001 --title 第一章");
      expect(output).toContain("✓ 章节已创建");
      expect(existsSync(join(TEST_DIR, "manuscript/v01/ch001.md"))).toBe(true);
    });

    it("should list chapters", () => {
      const output = runAuthor("chapter list");
      expect(output).toContain("ch001");
      expect(output).toContain("第一章");
    });

    it("should import chapter from existing file", () => {
      // 创建源文件
      const sourceFile = join(TEST_DIR, "source-chapter.md");
      writeFileSync(sourceFile, "# 源章节\n\n这是从外部导入的正文内容。\n", "utf-8");

      const output = runAuthor(`chapter import --id ch-import --title "导入章节" --from "${sourceFile}" --summary "导入测试"`);
      expect(output).toContain("✓ 章节已导入");
      expect(output).toContain("状态: imported");
      expect(existsSync(join(TEST_DIR, "manuscript/v01/ch-import.md"))).toBe(true);

      // 验证内容被复制
      const content = readFileSync(join(TEST_DIR, "manuscript/v01/ch-import.md"), "utf-8");
      expect(content).toContain("导入的正文内容");
    });

    it("should delete chapter", () => {
      runAuthor("chapter add --id ch-temp --title 临时章节");
      runAuthor("chapter delete ch-temp");
      expect(existsSync(join(TEST_DIR, "manuscript/v01/ch-temp.md"))).toBe(false);
    });
  });

  describe("render", () => {
    it("should render context", () => {
      const output = runAuthor("render context --chapter ch001");
      expect(output).toContain("✓ 已生成");
      expect(existsSync(join(TEST_DIR, "generated/context/ch001.md"))).toBe(true);
    });

    it("should render canon", () => {
      const output = runAuthor("render canon");
      expect(output).toContain("✓ 已生成");
      expect(existsSync(join(TEST_DIR, "generated/canon.md"))).toBe(true);
    });
  });

  describe("index", () => {
    it("should rebuild index", () => {
      const output = runAuthor("index rebuild");
      expect(output).toContain("✓ 索引重建完成");
    });

    it("should show index status", () => {
      const output = runAuthor("index status");
      expect(output).toContain("总 chunks");
    });

    it("should search index", () => {
      const output = runAuthor("index search --query 测试 --limit 5");
      expect(output).toContain("找到");
    });
  });

  describe("check", () => {
    it("should check continuity", () => {
      const output = runAuthor("check continuity --chapter ch001 --severity info");
      // 应该能运行，可能返回无问题或有 info 级别的提示
      expect(output.length).toBeGreaterThan(0);
    });

    it("should check global", () => {
      const output = runAuthor("check global --severity info");
      expect(output.length).toBeGreaterThan(0);
    });
  });

  describe("rules", () => {
    it("should add and list rules", () => {
      runAuthor("rules add --id test-rule --name 测试规则 --priority high");
      const output = runAuthor("rules list");
      expect(output).toContain("test-rule");
    });
  });

  describe("outline", () => {
    it("should add chapter to outline", () => {
      const output = runAuthor("outline add-chapter --id ch-outline --title 大纲章节");
      expect(output).toContain("✓ 章节已添加");
    });

    it("should update chapter summary", () => {
      const output = runAuthor("outline update-chapter ch-outline --field summary --value 测试摘要");
      expect(output).toContain("✓ 章节 ch-outline 已更新");
    });

    it("should update chapter status to imported", () => {
      const output = runAuthor("outline update-chapter ch-outline --field status --value imported");
      expect(output).toContain("✓ 章节 ch-outline 已更新");
    });

    it("should reject invalid status value", () => {
      expect(() => {
        runAuthor("outline update-chapter ch-outline --field status --value invalid-status");
      }).toThrow();
    });

    it("should list outline", () => {
      const output = runAuthor("outline list");
      expect(output).toContain("ch-outline");
      expect(output).toContain("大纲章节");
    });

    it("should add foreshadowing", () => {
      const output = runAuthor("outline foreshadowing-add --id foreshadow-001 --setup ch001 --note 测试伏笔");
      expect(output).toContain("✓ 伏笔已添加");
    });

    it("should list foreshadowing", () => {
      const output = runAuthor("outline foreshadowing-list");
      expect(output).toContain("foreshadow-001");
    });

    it("should update foreshadowing", () => {
      const output = runAuthor("outline foreshadowing-update foreshadow-001 --field status --value planted");
      expect(output).toContain("✓ 伏笔 foreshadow-001 已更新");
    });

    it("should reject invalid foreshadowing status", () => {
      expect(() => {
        runAuthor("outline foreshadowing-update foreshadow-001 --field status --value bad-status");
      }).toThrow();
    });
  });
});
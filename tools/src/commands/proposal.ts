import { join } from "node:path";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { ProposalSchema } from "../schemas/proposal.js";
import type { Proposal } from "../schemas/proposal.js";
import { CharacterSchema, createDefaultCharacter } from "../schemas/character.js";
import { LocationSchema, createDefaultLocation } from "../schemas/location.js";
import { WorldSchema, createDefaultWorld } from "../schemas/world.js";
import { ObjectSchema, createDefaultObject } from "../schemas/object.js";
import { PlotSchema, createDefaultPlot, createDefaultChapterOutline } from "../schemas/plot.js";
import { TimelineSchema, createDefaultTimeline, createDefaultTimelineEvent } from "../schemas/timeline.js";
import { RulesSchema, createDefaultRules } from "../schemas/rules.js";

function getProposalDir(): string {
  const paths = getProjectPaths();
  return join(paths.proposalsDir, "canon-suggestions");
}

function listProposalFiles(): string[] {
  const dir = getProposalDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".yaml")).map((f) => join(dir, f));
}

function readProposal(id: string): Proposal {
  const dir = getProposalDir();
  const filePath = join(dir, `${id}.yaml`);
  const raw = readYaml(filePath);
  if (!raw) {
    console.error(`提案不存在: ${id}`);
    process.exit(1);
  }
  return ProposalSchema.parse(raw);
}

/**
 * 将单个 suggestion 应用到 canon。
 */
function applySuggestion(suggestion: Proposal["suggestions"][number]): string {
  const paths = getProjectPaths();

  switch (suggestion.entityType) {
    case "character": {
      const filePath = join(paths.charactersDir, `${suggestion.entityId}.yaml`);
      if (suggestion.action === "create") {
        if (existsSync(filePath)) {
          return `  跳过: 角色 ${suggestion.entityId} 已存在`;
        }
        const char = createDefaultCharacter(
          suggestion.entityId,
          suggestion.value?.name ?? suggestion.entityId,
          suggestion.value?.role ?? "mentioned"
        );
        writeYaml(filePath, char);
        return `  ✓ 创建角色: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) {
        return `  跳过: 角色 ${suggestion.entityId} 不存在`;
      }
      const raw = readYaml(filePath);
      const char = CharacterSchema.parse(raw);
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (char as any)[suggestion.field];
        if (Array.isArray(arr)) {
          arr.push(suggestion.value);
        } else {
          return `  跳过: ${suggestion.entityId}.${suggestion.field} 不是数组`;
        }
      } else if (suggestion.action === "update" && suggestion.field) {
        (char as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, char);
      return `  ✓ 更新角色: ${suggestion.entityId}`;
    }
    case "location": {
      const filePath = join(paths.locationsDir, `${suggestion.entityId}.yaml`);
      if (suggestion.action === "create") {
        if (existsSync(filePath)) return `  跳过: 地点 ${suggestion.entityId} 已存在`;
        const loc = createDefaultLocation(suggestion.entityId, suggestion.value?.name ?? suggestion.entityId);
        writeYaml(filePath, loc);
        return `  ✓ 创建地点: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) return `  跳过: 地点 ${suggestion.entityId} 不存在`;
      const raw = readYaml(filePath);
      const loc = LocationSchema.parse(raw);
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (loc as any)[suggestion.field];
        if (Array.isArray(arr)) arr.push(suggestion.value);
      } else if (suggestion.action === "update" && suggestion.field) {
        (loc as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, loc);
      return `  ✓ 更新地点: ${suggestion.entityId}`;
    }
    case "world": {
      const filePath = join(paths.worldDir, `${suggestion.entityId}.yaml`);
      if (suggestion.action === "create") {
        if (existsSync(filePath)) return `  跳过: 世界观 ${suggestion.entityId} 已存在`;
        const world = createDefaultWorld(suggestion.entityId, suggestion.value?.name ?? suggestion.entityId);
        writeYaml(filePath, world);
        return `  ✓ 创建世界观: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) return `  跳过: 世界观 ${suggestion.entityId} 不存在`;
      const raw = readYaml(filePath);
      const world = WorldSchema.parse(raw);
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (world as any)[suggestion.field];
        if (Array.isArray(arr)) arr.push(suggestion.value);
      } else if (suggestion.action === "update" && suggestion.field) {
        (world as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, world);
      return `  ✓ 更新世界观: ${suggestion.entityId}`;
    }
    case "object": {
      const filePath = join(paths.objectsDir, `${suggestion.entityId}.yaml`);
      if (suggestion.action === "create") {
        if (existsSync(filePath)) return `  跳过: 物品 ${suggestion.entityId} 已存在`;
        const obj = createDefaultObject(suggestion.entityId, suggestion.value?.name ?? suggestion.entityId);
        writeYaml(filePath, obj);
        return `  ✓ 创建物品: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) return `  跳过: 物品 ${suggestion.entityId} 不存在`;
      const raw = readYaml(filePath);
      const obj = ObjectSchema.parse(raw);
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (obj as any)[suggestion.field];
        if (Array.isArray(arr)) arr.push(suggestion.value);
      } else if (suggestion.action === "update" && suggestion.field) {
        (obj as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, obj);
      return `  ✓ 更新物品: ${suggestion.entityId}`;
    }
    case "plot": {
      const filePath = join(paths.plotDir, `${suggestion.entityId}.yaml`);
      if (suggestion.action === "create") {
        if (existsSync(filePath)) return `  跳过: 大纲 ${suggestion.entityId} 已存在`;
        const plot = createDefaultPlot(suggestion.entityId, suggestion.value?.name ?? suggestion.entityId);
        writeYaml(filePath, plot);
        return `  ✓ 创建大纲: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) return `  跳过: 大纲 ${suggestion.entityId} 不存在`;
      const raw = readYaml(filePath);
      const plot = PlotSchema.parse(raw);
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (plot as any)[suggestion.field];
        if (Array.isArray(arr)) arr.push(suggestion.value);
      } else if (suggestion.action === "update" && suggestion.field) {
        (plot as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, plot);
      return `  ✓ 更新大纲: ${suggestion.entityId}`;
    }
    case "timeline": {
      const filePath = paths.timelineYaml;
      if (suggestion.action === "create") {
        // timeline 是单一文件，create 意味着添加事件
        let timeline = createDefaultTimeline();
        if (existsSync(filePath)) {
          const raw = readYaml(filePath);
          if (raw) timeline = TimelineSchema.parse(raw);
        }
        timeline.events.push(createDefaultTimelineEvent(
          suggestion.entityId,
          suggestion.value?.title ?? suggestion.entityId
        ));
        writeYaml(filePath, timeline);
        return `  ✓ 创建时间线事件: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) return `  跳过: 时间线不存在`;
      const raw = readYaml(filePath);
      const timeline = TimelineSchema.parse(raw);
      const evt = timeline.events.find((e) => e.id === suggestion.entityId);
      if (!evt) return `  跳过: 时间线事件 ${suggestion.entityId} 不存在`;
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (evt as any)[suggestion.field];
        if (Array.isArray(arr)) arr.push(suggestion.value);
      } else if (suggestion.action === "update" && suggestion.field) {
        (evt as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, timeline);
      return `  ✓ 更新时间线事件: ${suggestion.entityId}`;
    }
    case "rules": {
      const filePath = join(paths.rulesDir, `${suggestion.entityId}.yaml`);
      if (suggestion.action === "create") {
        if (existsSync(filePath)) return `  跳过: 规则 ${suggestion.entityId} 已存在`;
        const rules = createDefaultRules(suggestion.entityId, suggestion.value?.name ?? suggestion.entityId);
        writeYaml(filePath, rules);
        return `  ✓ 创建规则: ${suggestion.entityId}`;
      }
      if (!existsSync(filePath)) return `  跳过: 规则 ${suggestion.entityId} 不存在`;
      const raw = readYaml(filePath);
      const rules = RulesSchema.parse(raw);
      if (suggestion.action === "append" && suggestion.field) {
        const arr = (rules as any)[suggestion.field];
        if (Array.isArray(arr)) arr.push(suggestion.value);
      } else if (suggestion.action === "update" && suggestion.field) {
        (rules as any)[suggestion.field] = suggestion.value;
      }
      writeYaml(filePath, rules);
      return `  ✓ 更新规则: ${suggestion.entityId}`;
    }
    default:
      return `  跳过: 不支持的实体类型 ${suggestion.entityType}`;
  }
}

export function registerProposalCommand(program: any) {
  const proposal = program
    .command("proposal")
    .description("管理 canon 变更提案");

  // proposal list
  proposal
    .command("list")
    .description("列出所有提案")
    .option("--status <status>", "按状态筛选 (pending/applied/rejected)")
    .action((opts: { status?: string }) => {
      const files = listProposalFiles();
      if (files.length === 0) {
        console.log("暂无提案");
        return;
      }

      const proposals: Proposal[] = [];
      for (const file of files) {
        const raw = readYaml(file);
        if (!raw) continue;
        try {
          proposals.push(ProposalSchema.parse(raw));
        } catch {
          continue;
        }
      }

      const filtered = opts.status
        ? proposals.filter((p) => p.status === opts.status)
        : proposals;

      if (filtered.length === 0) {
        console.log(`暂无 ${opts.status ?? ""} 提案`);
        return;
      }

      console.log(`共 ${filtered.length} 个提案:\n`);
      for (const p of filtered) {
        console.log(`  ${p.id}  [${p.status}]  章节: ${p.sourceChapter}  建议: ${p.suggestions.length} 条`);
      }
    });

  // proposal show
  proposal
    .command("show <id>")
    .description("显示提案详情")
    .action((id: string) => {
      const p = readProposal(id);
      console.log(JSON.stringify(p, null, 2));
    });

  // proposal apply
  proposal
    .command("apply <id>")
    .description("应用提案到 canon")
    .action((id: string) => {
      const p = readProposal(id);
      const dir = getProposalDir();
      const filePath = join(dir, `${id}.yaml`);

      if (p.status !== "pending") {
        console.error(`提案状态不是 pending: ${p.status}`);
        process.exit(1);
      }

      console.log(`应用提案 ${id} (${p.suggestions.length} 条建议):\n`);
      for (const suggestion of p.suggestions) {
        const result = applySuggestion(suggestion);
        console.log(result);
      }

      p.status = "applied";
      writeYaml(filePath, p);
      console.log(`\n✓ 提案已标记为 applied`);
    });

  // proposal reject
  proposal
    .command("reject <id>")
    .description("拒绝提案")
    .action((id: string) => {
      const p = readProposal(id);
      const dir = getProposalDir();
      const filePath = join(dir, `${id}.yaml`);

      p.status = "rejected";
      writeYaml(filePath, p);
      console.log(`✓ 提案已拒绝: ${id}`);
    });
}

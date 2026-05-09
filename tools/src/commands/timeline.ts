import { join } from "node:path";
import { existsSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { TimelineSchema, createDefaultTimeline, createDefaultTimelineEvent } from "../schemas/timeline.js";
import type { Timeline, TimelineEvent } from "../schemas/timeline.js";

function getTimelinePath(): string {
  const paths = getProjectPaths();
  return paths.timelineYaml;
}

function readOrCreateTimeline(): { timeline: Timeline; filePath: string } {
  const filePath = getTimelinePath();
  const raw = readYaml(filePath);
  if (raw) {
    return { timeline: TimelineSchema.parse(raw), filePath };
  }
  const timeline = createDefaultTimeline();
  writeYaml(filePath, timeline);
  return { timeline, filePath };
}

export function registerTimelineCommand(program: any) {
  const timeline = program
    .command("timeline")
    .description("管理时间线");

  timeline
    .command("add")
    .description("添加时间线事件")
    .requiredOption("--id <id>", "事件 ID")
    .requiredOption("--title <title>", "事件标题")
    .option("--chapter <chapter>", "关联章节")
    .option("--date <date>", "故事内日期")
    .option("--description <description>", "事件描述")
    .option("--characters <characters>", "相关角色 (逗号分隔)")
    .option("--locations <locations>", "相关地点 (逗号分隔)")
    .action((opts: {
      id: string;
      title: string;
      chapter?: string;
      date?: string;
      description?: string;
      characters?: string;
      locations?: string;
    }) => {
      const { timeline, filePath } = readOrCreateTimeline();

      if (timeline.events.some((e) => e.id === opts.id)) {
        console.error(`事件已存在: ${opts.id}`);
        process.exit(1);
      }

      const event: TimelineEvent = {
        id: opts.id,
        title: opts.title,
        chapter: opts.chapter ?? "",
        date: opts.date ?? "",
        order: timeline.events.length + 1,
        description: opts.description ?? "",
        characters: opts.characters ? opts.characters.split(",").map((s) => s.trim()) : [],
        locations: opts.locations ? opts.locations.split(",").map((s) => s.trim()) : [],
        consequences: [],
      };

      timeline.events.push(event);
      writeYaml(filePath, timeline);
      console.log(`✓ 时间线事件已添加: ${opts.id} - ${opts.title}`);
    });

  timeline
    .command("update <id>")
    .description("更新时间线事件")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const { timeline, filePath } = readOrCreateTimeline();
      const event = timeline.events.find((e) => e.id === id);

      if (!event) {
        console.error(`事件不存在: ${id}`);
        process.exit(1);
      }

      if (opts.field === "characters" || opts.field === "locations" || opts.field === "consequences") {
        (event as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field === "order") {
        (event as any)[opts.field] = parseInt(opts.value, 10);
      } else if (opts.field in event) {
        (event as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(filePath, timeline);
      console.log(`✓ 事件 ${id} 已更新: ${opts.field}`);
    });

  timeline
    .command("list")
    .description("列出时间线事件")
    .action(() => {
      const { timeline } = readOrCreateTimeline();

      if (timeline.events.length === 0) {
        console.log("时间线暂无事件");
        return;
      }

      // 按 order 排序
      const sorted = [...timeline.events].sort((a, b) => a.order - b.order);
      console.log(`共 ${sorted.length} 个事件:\n`);
      for (const evt of sorted) {
        const ch = evt.chapter ? ` [${evt.chapter}]` : "";
        const date = evt.date ? ` (${evt.date})` : "";
        console.log(`  ${evt.order}. ${evt.id}  ${evt.title}${ch}${date}`);
      }
    });

  // timeline show
  timeline
    .command("show <id>")
    .description("显示事件详情")
    .action((id: string) => {
      const { timeline } = readOrCreateTimeline();
      const event = timeline.events.find((e) => e.id === id);
      if (!event) {
        console.error(`事件不存在: ${id}`);
        process.exit(1);
      }
      console.log(JSON.stringify(event, null, 2));
    });

  // timeline delete
  timeline
    .command("delete <id>")
    .description("删除时间线事件")
    .action((id: string) => {
      const { timeline, filePath } = readOrCreateTimeline();
      const index = timeline.events.findIndex((e) => e.id === id);
      if (index === -1) {
        console.error(`事件不存在: ${id}`);
        process.exit(1);
      }
      timeline.events.splice(index, 1);
      writeYaml(filePath, timeline);
      console.log(`✓ 事件已删除: ${id}`);
    });
}

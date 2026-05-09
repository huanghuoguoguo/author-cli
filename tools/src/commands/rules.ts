import { join } from "node:path";
import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { RulesSchema, createDefaultRules } from "../schemas/rules.js";
import type { Rules } from "../schemas/rules.js";

function getRulesPath(id: string): string {
  const paths = getProjectPaths();
  return join(paths.rulesDir, `${id}.yaml`);
}

function readRules(id: string): Rules {
  const filePath = getRulesPath(id);
  const raw = readYaml(filePath);
  if (!raw) {
    console.error(`规则不存在: ${id}`);
    process.exit(1);
  }
  return RulesSchema.parse(raw);
}

export function registerRulesCommand(program: any) {
  const rules = program
    .command("rules")
    .description("管理写作规则");

  // rules add
  rules
    .command("add")
    .description("添加新写作规则")
    .requiredOption("--id <id>", "规则 ID")
    .requiredOption("--name <name>", "规则名称")
    .option("--priority <priority>", "优先级", "high")
    .action((opts: { id: string; name: string; priority: string }) => {
      const paths = getProjectPaths();
      const filePath = join(paths.rulesDir, `${opts.id}.yaml`);

      if (existsSync(filePath)) {
        console.error(`规则已存在: ${opts.id}`);
        process.exit(1);
      }

      const r = createDefaultRules(opts.id, opts.name);
      r.priority = opts.priority as any;
      writeYaml(filePath, r);
      console.log(`✓ 规则已创建: ${opts.id} (${opts.name})`);
    });

  // rules update
  rules
    .command("update <id>")
    .description("更新规则字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((id: string, opts: { field: string; value: string }) => {
      const r = readRules(id);
      const filePath = getRulesPath(id);

      if (opts.field === "rules" || opts.field === "mustDo" || opts.field === "mustNotDo" || opts.field === "dialogueRules" || opts.field === "revisionRules") {
        (r as any)[opts.field] = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in r) {
        (r as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(filePath, r);
      console.log(`✓ 规则 ${id} 已更新: ${opts.field}`);
    });

  // rules show
  rules
    .command("show <id>")
    .description("显示规则详情")
    .action((id: string) => {
      const r = readRules(id);
      console.log(JSON.stringify(r, null, 2));
    });

  // rules list
  rules
    .command("list")
    .description("列出所有规则")
    .action(() => {
      const paths = getProjectPaths();
      if (!existsSync(paths.rulesDir)) {
        console.log("暂无规则");
        return;
      }

      const files = readdirSync(paths.rulesDir).filter((f) => f.endsWith(".yaml"));
      if (files.length === 0) {
        console.log("暂无规则");
        return;
      }

      console.log(`共 ${files.length} 个规则:\n`);
      for (const file of files) {
        const raw = readYaml(join(paths.rulesDir, file));
        if (!raw) continue;
        try {
          const r = RulesSchema.parse(raw);
          console.log(`  ${r.id}  ${r.name}  [${r.priority}]`);
        } catch {
          console.log(`  ${file}  (schema 错误)`);
        }
      }
    });

  // rules delete
  rules
    .command("delete <id>")
    .description("删除规则")
    .action((id: string) => {
      const filePath = getRulesPath(id);
      if (!existsSync(filePath)) {
        console.error(`规则不存在: ${id}`);
        process.exit(1);
      }
      unlinkSync(filePath);
      console.log(`✓ 规则已删除: ${id}`);
    });
}
import { join } from "node:path";
import { existsSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml, writeYaml } from "../utils/yaml.js";
import { BookSchema } from "../schemas/book.js";
import type { Book } from "../schemas/book.js";

function readBook(): Book {
  const paths = getProjectPaths();
  const filePath = paths.bookYaml;
  const raw = readYaml(filePath);
  if (!raw) {
    console.error("book.yaml 不存在");
    process.exit(1);
  }
  return BookSchema.parse(raw);
}

export function registerBookCommand(program: any) {
  const book = program
    .command("book")
    .description("管理作品信息");

  // book show
  book
    .command("show")
    .description("显示作品信息")
    .action(() => {
      const b = readBook();
      console.log(JSON.stringify(b, null, 2));
    });

  // book update
  book
    .command("update")
    .description("更新作品信息字段")
    .requiredOption("--field <field>", "字段名")
    .requiredOption("--value <value>", "新值")
    .action((opts: { field: string; value: string }) => {
      const b = readBook();
      const paths = getProjectPaths();

      if (opts.field === "themes") {
        b.themes = opts.value.split(",").map((s) => s.trim());
      } else if (opts.field in b) {
        (b as any)[opts.field] = opts.value;
      } else {
        console.error(`未知字段: ${opts.field}`);
        process.exit(1);
      }

      writeYaml(paths.bookYaml, b);
      console.log(`✓ 作品信息已更新: ${opts.field}`);
    });
}
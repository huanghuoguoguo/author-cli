import { rebuildIndex, getIndexStatus, searchChunks } from "../utils/rag.js";
import { join } from "node:path";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { getProjectPaths } from "../utils/paths.js";

export function registerIndexCommand(program: any) {
  const index = program
    .command("index")
    .description("管理 RAG 索引");

  // index rebuild
  index
    .command("rebuild")
    .description("重建索引（增量：只更新变化的 chunks）")
    .action(() => {
      const result = rebuildIndex();
      console.log(`✓ 索引重建完成:`);
      console.log(`  总 chunks: ${result.total}`);
      console.log(`  新增/更新: ${result.added}`);
      console.log(`  未变化: ${result.skipped}`);
    });

  // index status
  index
    .command("status")
    .description("显示索引状态")
    .action(() => {
      const status = getIndexStatus();
      if (status.total === 0) {
        console.log("索引尚未建立，使用 npm run author -- index rebuild 创建");
        return;
      }

      console.log(`索引状态:\n`);
      console.log(`  总 chunks: ${status.total}`);
      console.log(`  最后重建: ${status.lastRebuilt}`);
      console.log(`\n按来源类型:`);
      for (const [type, count] of Object.entries(status.byType)) {
        console.log(`  ${type}: ${count}`);
      }
    });

  // index search
  index
    .command("search")
    .description("搜索索引（关键词匹配）")
    .requiredOption("--query <query>", "搜索关键词")
    .option("--limit <limit>", "结果数量", "10")
    .option("--output <format>", "输出格式 (text/json)", "text")
    .action((opts: { query: string; limit: string; output: string }) => {
      const results = searchChunks(opts.query, parseInt(opts.limit, 10));

      if (results.length === 0) {
        console.log("未找到匹配结果");
        return;
      }

      if (opts.output === "json") {
        console.log(JSON.stringify(results, null, 2));
        return;
      }

      console.log(`找到 ${results.length} 个结果:\n`);
      for (const chunk of results) {
        console.log(`---`);
        console.log(`[${chunk.sourceType}/${chunk.sourceId}] ${chunk.title}`);
        console.log(`tokens: ${chunk.tokenCount} | hash: ${chunk.contentHash}`);
        console.log(`\n${chunk.text.slice(0, 300)}${chunk.text.length > 300 ? "..." : ""}\n`);
      }
    });
}
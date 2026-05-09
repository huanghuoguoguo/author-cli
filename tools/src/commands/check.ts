import { checkContinuity, checkGlobalContinuity, ContinuityIssue } from "../utils/continuity.js";

export function registerCheckCommand(program: any) {
  const check = program
    .command("check")
    .description("检查故事连续性问题");

  // check continuity
  check
    .command("continuity")
    .description("检查指定章节的连续性问题")
    .requiredOption("--chapter <chapter>", "章节 ID")
    .option("--severity <level>", "最低严重级别 (error/warning/info)", "warning")
    .action((opts: { chapter: string; severity: string }) => {
      const issues = checkContinuity(opts.chapter);
      const minSeverity = opts.severity;

      const severityOrder = { error: 0, warning: 1, info: 2 };
      const filtered = issues.filter(
        (i) => severityOrder[i.severity] <= severityOrder[minSeverity as keyof typeof severityOrder]
      );

      if (filtered.length === 0) {
        console.log(`✓ 章节 ${opts.chapter} 无连续性问题 (>= ${minSeverity})`);
        return;
      }

      console.log(`章节 ${opts.chapter} 发现 ${filtered.length} 个问题:\n`);

      for (const issue of filtered) {
        const severityIcon = issue.severity === "error" ? "✗" : issue.severity === "warning" ? "⚠" : "ℹ";
        const location = issue.entity ? `${issue.category}/${issue.entity}` : issue.category;
        console.log(`  ${severityIcon} [${issue.severity}] ${location}`);
        console.log(`    ${issue.message}`);
        if (issue.suggestion) {
          console.log(`    建议: ${issue.suggestion}`);
        }
        console.log("");
      }

      // 统计
      const errors = filtered.filter((i) => i.severity === "error").length;
      const warnings = filtered.filter((i) => i.severity === "warning").length;
      const infos = filtered.filter((i) => i.severity === "info").length;

      console.log(`统计: ${errors} 错误, ${warnings} 警告, ${infos} 信息`);

      if (errors > 0) {
        process.exit(1);
      }
    });

  // check global
  check
    .command("global")
    .description("检查全局连续性问题（伏笔、时间线等）")
    .option("--severity <level>", "最低严重级别 (error/warning/info)", "info")
    .action((opts: { severity: string }) => {
      const issues = checkGlobalContinuity();
      const minSeverity = opts.severity;

      const severityOrder = { error: 0, warning: 1, info: 2 };
      const filtered = issues.filter(
        (i) => severityOrder[i.severity] <= severityOrder[minSeverity as keyof typeof severityOrder]
      );

      if (filtered.length === 0) {
        console.log(`✓ 全局无连续性问题 (>= ${minSeverity})`);
        return;
      }

      console.log(`发现 ${filtered.length} 个全局问题:\n`);

      for (const issue of filtered) {
        const severityIcon = issue.severity === "error" ? "✗" : issue.severity === "warning" ? "⚠" : "ℹ";
        const location = issue.entity ? `${issue.category}/${issue.entity}` : issue.category;
        console.log(`  ${severityIcon} [${issue.severity}] ${location}`);
        console.log(`    ${issue.message}`);
        if (issue.suggestion) {
          console.log(`    建议: ${issue.suggestion}`);
        }
        console.log("");
      }

      const errors = filtered.filter((i) => i.severity === "error").length;
      if (errors > 0) {
        process.exit(1);
      }
    });
}
import { validateProject, ValidationError } from "../utils/validate.js";

export function registerValidateCommand(program: any) {
  program
    .command("validate")
    .description("校验整个项目的 canon 数据完整性")
    .action(() => {
      const errors = validateProject();

      if (errors.length === 0) {
        console.log("✓ 项目校验通过");
        return;
      }

      console.error(`发现 ${errors.length} 个问题:\n`);
      for (const err of errors) {
        const location = err.field ? `${err.file}:${err.field}` : err.file;
        console.error(`  ✗ ${location}`);
        console.error(`    ${err.message}\n`);
      }

      process.exit(1);
    });
}

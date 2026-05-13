import { Command } from "commander";
import { registerValidateCommand } from "./commands/validate.js";
import { registerBookCommand } from "./commands/book.js";
import { registerCharacterCommand } from "./commands/character.js";
import { registerLocationCommand } from "./commands/location.js";
import { registerWorldCommand } from "./commands/world.js";
import { registerObjectCommand } from "./commands/object.js";
import { registerTimelineCommand } from "./commands/timeline.js";
import { registerChapterCommand } from "./commands/chapter.js";
import { registerRenderCommand } from "./commands/render.js";
import { registerOutlineCommand } from "./commands/outline.js";
import { registerRulesCommand } from "./commands/rules.js";
import { registerSuggestCommand } from "./commands/suggest.js";
import { registerProposalCommand } from "./commands/proposal.js";
import { registerCheckCommand } from "./commands/check.js";
import { registerIndexCommand } from "./commands/index.js";
import { registerInitCommand } from "./commands/init.js";
import { registerAICommand } from "./commands/ai-pi.js";

const program = new Command();

program
  .name("author")
  .description("小说写作工作区 CLI 工具")
  .version("0.1.0");

// 注册命令
registerValidateCommand(program);
registerBookCommand(program);
registerCharacterCommand(program);
registerLocationCommand(program);
registerWorldCommand(program);
registerObjectCommand(program);
registerTimelineCommand(program);
registerChapterCommand(program);
registerRenderCommand(program);
registerOutlineCommand(program);
registerRulesCommand(program);
registerSuggestCommand(program);
registerProposalCommand(program);
registerCheckCommand(program);
registerIndexCommand(program);
registerInitCommand(program);
registerAICommand(program);

program.parse();

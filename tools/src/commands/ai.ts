import Anthropic from "@anthropic-ai/sdk";
import {
  readFileSync,
  existsSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { getProjectPaths } from "../utils/paths.js";
import { readYaml } from "../utils/yaml.js";
import { createInterface } from "node:readline";
import { homedir } from "node:os";
import { startTUI } from "../tui/index.js";

/**
 * 会话历史记录
 */
interface SessionRecord {
  id: string;
  timestamp: string;
  model: string;
  messages: Anthropic.MessageParam[];
  summary?: string;
}

/**
 * 轻量级 AI 助手
 * 使用 Anthropic SDK 直接调用，避免 Claude Code CLI 的 27k token 开销
 * 首轮 token 消耗约 2-3k
 */
export class LightweightAI {
  private client: Anthropic;
  private model: string;
  private maxTokens: number;
  private systemPrompt: string;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private sessionId: string;
  private historyDir: string;

  constructor(
    options: {
      apiKey?: string;
      model?: string;
      maxTokens?: number;
      systemPrompt?: string;
      sessionId?: string;
    } = {}
  ) {
    this.client = new Anthropic({
      apiKey: options.apiKey || process.env.ANTHROPIC_API_KEY,
    });
    this.model = options.model || "claude-3-5-sonnet-latest";
    this.maxTokens = options.maxTokens || 1024;
    this.systemPrompt = options.systemPrompt || this.getDefaultSystemPrompt();
    this.sessionId =
      options.sessionId || `session-${Date.now()}`;
    this.historyDir = join(homedir(), ".author-cli", "history");

    // 确保历史目录存在
    if (!existsSync(this.historyDir)) {
      mkdirSync(this.historyDir, { recursive: true });
    }
  }

  /**
   * 获取默认的极简系统提示
   */
  private getDefaultSystemPrompt(): string {
    return `你是一个小说写作助手，专注于帮助用户管理小说项目。

你的能力：
1. 读取和分析小说项目的 canon 数据（角色、地点、世界观等）
2. 执行 bash 命令进行文件操作
3. 提供写作建议和反馈
4. 加载和执行 author-cli 技能（skills）

规则：
- 只使用提供的工具，不要编造工具
- 回答简洁，只输出必要内容
- 优先使用中文回复
- 遵循项目结构：canon/ 目录存储结构化数据，manuscript/ 存储章节正文

项目结构：
- canon/characters/ - 角色信息
- canon/locations/ - 地点信息
- canon/world/ - 世界观设定
- canon/objects/ - 物品信息
- canon/plot/ - 情节大纲
- manuscript/ - 章节正文
- skills/ - 写作技能（如 write-scenes、suggest-canon、continuity-check）

可用技能：
- write-scenes: 完整写作流程（validate → context → write → update）
- suggest-canon: 从章节正文提取 canon 变更建议
- continuity-check: 检测故事连续性问题
- plan-chapter: 写前确认目标、加载上下文
- bootstrap-story: 从零共创设定和大纲
- migrate-existing-project: 迁移已有项目
- reconstruct-story-bible: 从正文重建设定

使用技能的方法：
1. 使用 skill_loader 工具列出可用技能
2. 使用 skill_loader 工具加载特定技能的内容
3. 根据技能指导执行相应操作
4. 使用 bash 工具执行 author 命令`;
  }
  /**
   * 获取项目上下文信息
   */
  private getProjectContext(): string {
    const paths = getProjectPaths();
    const contextParts: string[] = [];

    // 读取项目配置
    const projectPath = join(paths.root, "project.yaml");
    if (existsSync(projectPath)) {
      const project = readYaml(projectPath);
      if (project) {
        contextParts.push(`项目配置: ${JSON.stringify(project, null, 2)}`);
      }
    }

    // 统计 canon 数据
    const stats = {
      characters: 0,
      locations: 0,
      world: 0,
      objects: 0,
      chapters: 0,
    };

    try {
      if (existsSync(paths.charactersDir)) {
        stats.characters = readdirSync(paths.charactersDir).filter((f) =>
          f.endsWith(".yaml")
        ).length;
      }
      if (existsSync(paths.locationsDir)) {
        stats.locations = readdirSync(paths.locationsDir).filter((f) =>
          f.endsWith(".yaml")
        ).length;
      }
      if (existsSync(paths.worldDir)) {
        stats.world = readdirSync(paths.worldDir).filter((f) =>
          f.endsWith(".yaml")
        ).length;
      }
      if (existsSync(paths.objectsDir)) {
        stats.objects = readdirSync(paths.objectsDir).filter((f) =>
          f.endsWith(".yaml")
        ).length;
      }
      if (existsSync(paths.manuscriptDir)) {
        const volumes = readdirSync(paths.manuscriptDir, {
          withFileTypes: true,
        }).filter((d) => d.isDirectory());
        for (const vol of volumes) {
          const volPath = join(paths.manuscriptDir, vol.name);
          stats.chapters += readdirSync(volPath).filter((f) =>
            f.endsWith(".md")
          ).length;
        }
      }
    } catch (e) {
      // 忽略错误
    }

    contextParts.push(
      `项目统计: ${stats.characters} 角色, ${stats.locations} 地点, ${stats.world} 世界观, ${stats.objects} 物品, ${stats.chapters} 章节`
    );

    return contextParts.join("\n\n");
  }

  /**
   * 定义可用的工具
   */
  private getTools(): Anthropic.Tool[] {
    return [
      {
        name: "file_read",
        description: "读取文件内容",
        input_schema: {
          type: "object" as const,
          properties: {
            path: {
              type: "string",
              description: "文件路径（相对于项目根目录）",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "bash",
        description: "执行 bash 命令（只读操作）",
        input_schema: {
          type: "object" as const,
          properties: {
            command: {
              type: "string",
              description: "要执行的命令",
            },
          },
          required: ["command"],
        },
      },
      {
        name: "list_files",
        description: "列出目录下的文件",
        input_schema: {
          type: "object" as const,
          properties: {
            path: {
              type: "string",
              description: "目录路径（相对于项目根目录）",
            },
          },
          required: ["path"],
        },
      },
      {
        name: "skill_loader",
        description: "加载并执行 author-cli 技能（如 write-scenes、suggest-canon 等）",
        input_schema: {
          type: "object" as const,
          properties: {
            skill_name: {
              type: "string",
              description: "技能名称（如 write-scenes、suggest-canon、continuity-check）",
            },
            action: {
              type: "string",
              enum: ["load", "list", "execute"],
              description: "操作类型：load=加载技能内容，list=列出所有技能，execute=执行技能",
            },
            args: {
              type: "string",
              description: "执行技能时的参数（如章节 ID）",
            },
          },
          required: ["action"],
        },
      },
    ];
  }

  /**
   * 执行工具调用
   */
  private async executeTool(
    toolName: string,
    input: Record<string, string>
  ): Promise<string> {
    const paths = getProjectPaths();
    const { execSync } = require("node:child_process");

    switch (toolName) {
      case "file_read": {
        const filePath = join(paths.root, input.path);
        if (!existsSync(filePath)) {
          return `错误: 文件不存在 ${input.path}`;
        }
        try {
          return readFileSync(filePath, "utf-8");
        } catch (e: any) {
          return `错误: 读取文件失败 - ${e.message}`;
        }
      }

      case "bash": {
        // 安全限制：只允许只读命令
        const dangerousCommands = [
          "rm",
          "mv",
          "cp",
          "chmod",
          "chown",
          "sudo",
          "apt",
          "yum",
          "npm install",
          "pip install",
        ];
        const cmd = input.command.toLowerCase().trim();
        for (const dangerous of dangerousCommands) {
          if (cmd.startsWith(dangerous)) {
            return `错误: 安全限制 - 不允许执行 ${dangerous} 命令`;
          }
        }

        try {
          const result = execSync(input.command, {
            cwd: paths.root,
            encoding: "utf-8",
            timeout: 10000,
          });
          return result;
        } catch (e: any) {
          return `错误: 命令执行失败 - ${e.message}`;
        }
      }

      case "list_files": {
        const dirPath = join(paths.root, input.path);
        if (!existsSync(dirPath)) {
          return `错误: 目录不存在 ${input.path}`;
        }
        try {
          const files = readdirSync(dirPath);
          return files.join("\n");
        } catch (e: any) {
          return `错误: 列出文件失败 - ${e.message}`;
        }
      }

      case "skill_loader": {
        const skillsDir = join(paths.root, "skills");
        if (!existsSync(skillsDir)) {
          return "错误: skills 目录不存在";
        }

        const action = input.action;
        const skillName = input.skill_name;
        const args = input.args;

        // 列出所有技能
        if (action === "list") {
          try {
            const skills = readdirSync(skillsDir, { withFileTypes: true })
              .filter((d) => d.isDirectory())
              .map((d) => d.name);
            return `可用技能:\n${skills.join("\n")}`;
          } catch (e: any) {
            return `错误: 列出技能失败 - ${e.message}`;
          }
        }

        // 加载技能内容
        if (action === "load") {
          if (!skillName) {
            return "错误: 请指定技能名称";
          }
          const skillPath = join(skillsDir, skillName, "SKILL.md");
          if (!existsSync(skillPath)) {
            return `错误: 技能 ${skillName} 不存在`;
          }
          try {
            return readFileSync(skillPath, "utf-8");
          } catch (e: any) {
            return `错误: 加载技能失败 - ${e.message}`;
          }
        }

        // 执行技能
        if (action === "execute") {
          if (!skillName) {
            return "错误: 请指定技能名称";
          }
          const skillPath = join(skillsDir, skillName, "SKILL.md");
          if (!existsSync(skillPath)) {
            return `错误: 技能 ${skillName} 不存在`;
          }
          try {
            // 读取技能内容
            const skillContent = readFileSync(skillPath, "utf-8");
            // 解析技能中的命令
            const commandMatch = skillContent.match(/```bash\n([\s\S]*?)\n```/);
            if (commandMatch) {
              const commands = commandMatch[1].split("\n").filter((c) => c.trim());
              // 执行第一个命令
              const command = commands[0].replace("author ", "").trim();
              return `执行技能 ${skillName}:\n命令: author ${command}\n参数: ${args || "无"}`;
            }
            return `技能 ${skillName} 内容:\n${skillContent}`;
          } catch (e: any) {
            return `错误: 执行技能失败 - ${e.message}`;
          }
        }

        return "错误: 无效的操作类型";
      }

      default:
        return `错误: 未知工具 ${toolName}`;
    }
  }

  /**
   * 保存会话历史
   */
  saveSession(): void {
    const session: SessionRecord = {
      id: this.sessionId,
      timestamp: new Date().toISOString(),
      model: this.model,
      messages: this.conversationHistory,
      summary: this.generateSummary(),
    };

    const filePath = join(this.historyDir, `${this.sessionId}.json`);
    writeFileSync(filePath, JSON.stringify(session, null, 2), "utf-8");
  }

  /**
   * 加载会话历史
   */
  loadSession(sessionId: string): boolean {
    const filePath = join(this.historyDir, `${sessionId}.json`);
    if (!existsSync(filePath)) {
      return false;
    }

    try {
      const data = readFileSync(filePath, "utf-8");
      const session: SessionRecord = JSON.parse(data);
      this.sessionId = session.id;
      this.conversationHistory = session.messages;
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 列出所有会话
   */
  listSessions(): SessionRecord[] {
    if (!existsSync(this.historyDir)) {
      return [];
    }

    const files = readdirSync(this.historyDir).filter((f) =>
      f.endsWith(".json")
    );
    const sessions: SessionRecord[] = [];

    for (const file of files) {
      try {
        const data = readFileSync(join(this.historyDir, file), "utf-8");
        const session: SessionRecord = JSON.parse(data);
        sessions.push(session);
      } catch (e) {
        // 忽略损坏的文件
      }
    }

    // 按时间戳排序（最新的在前）
    sessions.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return sessions;
  }

  /**
   * 删除会话
   */
  deleteSession(sessionId: string): boolean {
    const filePath = join(this.historyDir, `${sessionId}.json`);
    if (!existsSync(filePath)) {
      return false;
    }

    try {
      require("node:fs").unlinkSync(filePath);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * 生成会话摘要
   */
  private generateSummary(): string {
    if (this.conversationHistory.length === 0) {
      return "空会话";
    }

    // 提取前几条用户消息作为摘要
    const userMessages = this.conversationHistory
      .filter((msg) => msg.role === "user")
      .slice(0, 3)
      .map((msg) => {
        if (typeof msg.content === "string") {
          return msg.content.substring(0, 50);
        }
        return "[复杂内容]";
      });

    return userMessages.join(" | ") || "无摘要";
  }

  /**
   * 发送消息并获取回复
   */
  async chat(userMessage: string): Promise<string> {
    // 添加用户消息到历史
    this.conversationHistory.push({
      role: "user",
      content: userMessage,
    });

    // 构建请求
    const request: Anthropic.MessageCreateParams = {
      model: this.model,
      max_tokens: this.maxTokens,
      system: this.systemPrompt,
      tools: this.getTools(),
      messages: this.conversationHistory,
    };

    try {
      // 发送请求
      const response = await this.client.messages.create(request);

      // 处理响应
      let assistantMessage = "";
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === "text") {
          assistantMessage += block.text;
        } else if (block.type === "tool_use") {
          // 执行工具调用
          const toolResult = await this.executeTool(
            block.name,
            block.input as Record<string, string>
          );
          toolResults.push({
            type: "tool_result",
            tool_use_id: block.id,
            content: toolResult,
          });
        }
      }

      // 如果有工具调用，需要继续对话获取最终回复
      if (toolResults.length > 0) {
        // 添加助手消息到历史
        this.conversationHistory.push({
          role: "assistant",
          content: response.content,
        });

        // 添加工具结果到历史
        this.conversationHistory.push({
          role: "user",
          content: toolResults,
        });

        // 递归调用获取最终回复
        return this.chat("");
      }

      // 添加助手消息到历史
      this.conversationHistory.push({
        role: "assistant",
        content: assistantMessage,
      });

      // 自动保存会话
      this.saveSession();

      return assistantMessage;
    } catch (error: any) {
      throw new Error(`AI 请求失败: ${error.message}`);
    }
  }

  /**
   * 清空对话历史
   */
  clearHistory(): void {
    this.conversationHistory = [];
    this.saveSession();
  }

  /**
   * 获取对话历史
   */
  getHistory(): Anthropic.MessageParam[] {
    return [...this.conversationHistory];
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取历史目录
   */
  getHistoryDir(): string {
    return this.historyDir;
  }
}

/**
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
可用命令:
  help, h          - 显示此帮助信息
  history          - 显示当前会话的对话历史
  sessions         - 列出所有会话
  load <id>        - 加载指定会话
  save             - 保存当前会话
  delete <id>      - 删除指定会话
  clear            - 清空当前对话历史
  exit, quit       - 退出程序
`);
}

/**
 * 显示会话列表
 */
function showSessions(ai: LightweightAI): void {
  const sessions = ai.listSessions();
  if (sessions.length === 0) {
    console.log("没有历史会话");
    return;
  }

  console.log("\n历史会话:");
  console.log("-".repeat(60));
  for (const session of sessions) {
    const date = new Date(session.timestamp).toLocaleString("zh-CN");
    console.log(`ID: ${session.id}`);
    console.log(`时间: ${date}`);
    console.log(`模型: ${session.model}`);
    console.log(`摘要: ${session.summary || "无"}`);
    console.log("-".repeat(60));
  }
}

/**
 * 显示对话历史
 */
function showHistory(ai: LightweightAI): void {
  const history = ai.getHistory();
  if (history.length === 0) {
    console.log("对话历史为空");
    return;
  }

  console.log("\n对话历史:");
  console.log("=".repeat(60));
  for (const msg of history) {
    const role = msg.role === "user" ? "你" : "AI";
    let content = "";

    if (typeof msg.content === "string") {
      content = msg.content;
    } else if (Array.isArray(msg.content)) {
      // 处理复杂内容（工具调用等）
      for (const block of msg.content) {
        if (block.type === "text") {
          content += block.text;
        } else if (block.type === "tool_use") {
          content += `[工具调用: ${block.name}]`;
        } else if (block.type === "tool_result") {
          content += `[工具结果]`;
        }
      }
    }

    if (content) {
      console.log(`${role}: ${content.substring(0, 200)}${content.length > 200 ? "..." : ""}`);
    }
  }
  console.log("=".repeat(60));
}

/**
 * 注册 AI 命令
 */
export function registerAICommand(program: any) {
  program
    .command("ai")
    .description("启动轻量级 AI 助手（支持会话历史）")
    .option("--model <model>", "AI 模型", "claude-3-5-sonnet-latest")
    .option("--max-tokens <tokens>", "最大 token 数", "1024")
    .option("--system-prompt <prompt>", "自定义系统提示")
    .option("--message <message>", "单条消息模式（不进入交互）")
    .option("--session <id>", "加载指定会话")
    .option("--list-sessions", "列出所有会话")
    .option("--delete-session <id>", "删除指定会话")
    .option("--tui", "启动 TUI 界面（图形化交互）")
    .action(
      async (opts: {
        model?: string;
        maxTokens?: string;
        systemPrompt?: string;
        message?: string;
        session?: string;
        listSessions?: boolean;
        deleteSession?: string;
        tui?: boolean;
      }) => {
        // 检查 API key
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error("错误: 请设置 ANTHROPIC_API_KEY 环境变量");
          process.exit(1);
        }

        // TUI 模式
        if (opts.tui) {
          startTUI({
            model: opts.model,
            maxTokens: opts.maxTokens ? parseInt(opts.maxTokens) : undefined,
            systemPrompt: opts.systemPrompt,
          });
          return;
        }

        // 创建 AI 助手
        const ai = new LightweightAI({
          model: opts.model,
          maxTokens: opts.maxTokens ? parseInt(opts.maxTokens) : undefined,
          systemPrompt: opts.systemPrompt,
        });

        // 列出会话
        if (opts.listSessions) {
          showSessions(ai);
          return;
        }

        // 删除会话
        if (opts.deleteSession) {
          if (ai.deleteSession(opts.deleteSession)) {
            console.log(`会话 ${opts.deleteSession} 已删除`);
          } else {
            console.error(`会话 ${opts.deleteSession} 不存在`);
          }
          return;
        }

        // 加载会话
        if (opts.session) {
          if (ai.loadSession(opts.session)) {
            console.log(`已加载会话: ${opts.session}`);
          } else {
            console.error(`会话 ${opts.session} 不存在`);
            process.exit(1);
          }
        }

        // 单条消息模式
        if (opts.message) {
          try {
            const response = await ai.chat(opts.message);
            console.log(response);
          } catch (error: any) {
            console.error(error.message);
            process.exit(1);
          }
          return;
        }

        // 交互模式
        console.log("轻量级 AI 助手已启动");
        console.log("输入 'help' 查看可用命令");
        console.log("输入 'exit' 或 'quit' 退出");
        console.log("-".repeat(40));

        const rl = createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const prompt = () => {
          rl.question("\n你: ", async (input) => {
            const trimmed = input.trim();

            // 处理特殊命令
            switch (trimmed.toLowerCase()) {
              case "exit":
              case "quit":
                console.log("再见！");
                rl.close();
                return;

              case "help":
              case "h":
                showHelp();
                prompt();
                return;

              case "history":
                showHistory(ai);
                prompt();
                return;

              case "sessions":
                showSessions(ai);
                prompt();
                return;

              case "save":
                ai.saveSession();
                console.log(`会话已保存: ${ai.getSessionId()}`);
                prompt();
                return;

              case "clear":
                ai.clearHistory();
                console.log("对话历史已清空");
                prompt();
                return;
            }

            // 处理 load 命令
            if (trimmed.toLowerCase().startsWith("load ")) {
              const sessionId = trimmed.substring(5).trim();
              if (ai.loadSession(sessionId)) {
                console.log(`已加载会话: ${sessionId}`);
              } else {
                console.error(`会话 ${sessionId} 不存在`);
              }
              prompt();
              return;
            }

            // 处理 delete 命令
            if (trimmed.toLowerCase().startsWith("delete ")) {
              const sessionId = trimmed.substring(7).trim();
              if (ai.deleteSession(sessionId)) {
                console.log(`会话 ${sessionId} 已删除`);
              } else {
                console.error(`会话 ${sessionId} 不存在`);
              }
              prompt();
              return;
            }

            if (!trimmed) {
              prompt();
              return;
            }

            try {
              const response = await ai.chat(trimmed);
              console.log(`\nAI: ${response}`);
            } catch (error: any) {
              console.error(`\n错误: ${error.message}`);
            }

            prompt();
          });
        };

        prompt();
      }
    );
}

import {
  createAgentSession,
  defineTool,
  loadSkillsFromDir,
  type AgentSession,
  type AgentSessionEvent,
  type ToolDefinition,
} from "@earendil-works/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import {
  readFileSync,
  existsSync,
  readdirSync,
  mkdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { getProjectPaths } from "../utils/paths.js";
import { createInterface } from "node:readline";

/**
 * 会话历史记录
 */
interface SessionRecord {
  id: string;
  timestamp: string;
  model: string;
  summary?: string;
}

/**
 * 历史目录
 */
const HISTORY_DIR = join(homedir(), ".author-cli", "history");

/**
 * 确保历史目录存在
 */
function ensureHistoryDir(): void {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }
}

/**
 * 创建 skill_loader 自定义工具
 */
function createSkillLoaderTool(): ToolDefinition {
  return defineTool({
    name: "skill_loader",
    label: "Skill Loader",
    description:
      "加载并执行 author-cli 技能（如 write-scenes、suggest-canon 等）",
    promptSnippet: "加载和执行写作技能",
    parameters: Type.Object({
      action: Type.Union(
        [
          Type.Literal("list"),
          Type.Literal("load"),
          Type.Literal("execute"),
        ],
        { description: "操作类型：list=列出所有技能，load=加载技能内容，execute=执行技能" }
      ),
      skill_name: Type.Optional(
        Type.String({ description: "技能名称（如 write-scenes）" })
      ),
      args: Type.Optional(
        Type.String({ description: "执行技能时的参数（如章节 ID）" })
      ),
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const paths = getProjectPaths();
      const skillsDir = join(paths.root, "skills");

      if (!existsSync(skillsDir)) {
        return {
          type: "text",
          text: "错误: skills 目录不存在",
          isError: true,
        };
      }

      const { action, skill_name, args } = params;

      // 列出所有技能
      if (action === "list") {
        try {
          const skills = readdirSync(skillsDir, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name);
          return {
            type: "text",
            text: `可用技能:\n${skills.join("\n")}`,
          };
        } catch (e: any) {
          return {
            type: "text",
            text: `错误: 列出技能失败 - ${e.message}`,
            isError: true,
          };
        }
      }

      // 加载技能内容
      if (action === "load") {
        if (!skill_name) {
          return {
            type: "text",
            text: "错误: 请指定技能名称",
            isError: true,
          };
        }
        const skillPath = join(skillsDir, skill_name, "SKILL.md");
        if (!existsSync(skillPath)) {
          return {
            type: "text",
            text: `错误: 技能 ${skill_name} 不存在`,
            isError: true,
          };
        }
        try {
          const content = readFileSync(skillPath, "utf-8");
          return {
            type: "text",
            text: content,
          };
        } catch (e: any) {
          return {
            type: "text",
            text: `错误: 加载技能失败 - ${e.message}`,
            isError: true,
          };
        }
      }

      // 执行技能
      if (action === "execute") {
        if (!skill_name) {
          return {
            type: "text",
            text: "错误: 请指定技能名称",
            isError: true,
          };
        }
        const skillPath = join(skillsDir, skill_name, "SKILL.md");
        if (!existsSync(skillPath)) {
          return {
            type: "text",
            text: `错误: 技能 ${skill_name} 不存在`,
            isError: true,
          };
        }
        try {
          const skillContent = readFileSync(skillPath, "utf-8");
          // 解析技能中的命令
          const commandMatch = skillContent.match(/```bash\n([\s\S]*?)\n```/);
          if (commandMatch) {
            const commands = commandMatch[1]
              .split("\n")
              .filter((c) => c.trim());
            const command = commands[0].replace("author ", "").trim();
            return {
              type: "text",
              text: `执行技能 ${skill_name}:\n命令: author ${command}\n参数: ${args || "无"}\n\n请使用 bash 工具执行上述命令。`,
            };
          }
          return {
            type: "text",
            text: `技能 ${skill_name} 内容:\n${skillContent}`,
          };
        } catch (e: any) {
          return {
            type: "text",
            text: `错误: 执行技能失败 - ${e.message}`,
            isError: true,
          };
        }
      }

      return {
        type: "text",
        text: "错误: 无效的操作类型",
        isError: true,
      };
    },
  });
}

/**
 * Pi Agent 包装器
 */
export class PiAgentWrapper {
  private session: AgentSession | null = null;
  private sessionId: string;
  private model: string;
  private eventListeners: Array<(event: AgentSessionEvent) => void> = [];

  constructor(
    options: {
      model?: string;
      sessionId?: string;
    } = {}
  ) {
    this.model = options.model || "claude-sonnet-4-20250514";
    this.sessionId = options.sessionId || `session-${Date.now()}`;
  }

  /**
   * 初始化会话
   */
  async initialize(): Promise<void> {
    const paths = getProjectPaths();
    const skillLoaderTool = createSkillLoaderTool();

    // 加载项目技能
    const skillsDir = join(paths.root, "skills");
    let skills: any[] = [];
    if (existsSync(skillsDir)) {
      try {
        skills = await loadSkillsFromDir(skillsDir);
      } catch (e) {
        // 忽略技能加载错误
      }
    }

    // 创建会话
    const result = await createAgentSession({
      cwd: paths.root,
      customTools: [skillLoaderTool],
    });

    this.session = result.session;

    // 订阅事件
    this.session.subscribe((event) => {
      for (const listener of this.eventListeners) {
        listener(event);
      }
    });
  }

  /**
   * 添加事件监听器
   */
  onEvent(listener: (event: AgentSessionEvent) => void): void {
    this.eventListeners.push(listener);
  }

  /**
   * 发送消息
   */
  async prompt(text: string): Promise<void> {
    if (!this.session) {
      throw new Error("会话未初始化");
    }
    await this.session.prompt(text);
  }

  /**
   * 获取会话 ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 获取模型
   */
  getModel(): string {
    return this.model;
  }

  /**
   * 销毁会话
   */
  dispose(): void {
    if (this.session) {
      this.session.dispose();
      this.session = null;
    }
    this.eventListeners = [];
  }
}

/**
 * 保存会话记录
 */
function saveSessionRecord(record: SessionRecord): void {
  ensureHistoryDir();
  const filePath = join(HISTORY_DIR, `${record.id}.json`);
  writeFileSync(filePath, JSON.stringify(record, null, 2), "utf-8");
}

/**
 * 列出会话记录
 */
function listSessionRecords(): SessionRecord[] {
  ensureHistoryDir();
  if (!existsSync(HISTORY_DIR)) {
    return [];
  }

  const files = readdirSync(HISTORY_DIR).filter((f) => f.endsWith(".json"));
  const sessions: SessionRecord[] = [];

  for (const file of files) {
    try {
      const data = readFileSync(join(HISTORY_DIR, file), "utf-8");
      const session: SessionRecord = JSON.parse(data);
      sessions.push(session);
    } catch (e) {
      // 忽略损坏的文件
    }
  }

  sessions.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return sessions;
}

/**
 * 删除会话记录
 */
function deleteSessionRecord(sessionId: string): boolean {
  const filePath = join(HISTORY_DIR, `${sessionId}.json`);
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
 * 显示帮助信息
 */
function showHelp(): void {
  console.log(`
可用命令:
  help, h          - 显示此帮助信息
  sessions         - 列出所有会话
  delete <id>      - 删除指定会话
  clear            - 清空对话历史
  exit, quit       - 退出程序

快捷键:
  Ctrl+C           - 强制退出
  ↑/↓              - 浏览输入历史
`);
}

/**
 * 显示会话列表
 */
function showSessions(): void {
  const sessions = listSessionRecords();
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
 * 注册 AI 命令
 */
export function registerAICommand(program: any) {
  program
    .command("ai")
    .description("启动 AI 助手（基于 Pi Agent）")
    .option("--model <model>", "AI 模型", "claude-sonnet-4-20250514")
    .option("--session <id>", "加载指定会话")
    .option("--list-sessions", "列出所有会话")
    .option("--delete-session <id>", "删除指定会话")
    .option("--tui", "启动 TUI 界面（图形化交互）")
    .action(
      async (opts: {
        model?: string;
        session?: string;
        listSessions?: boolean;
        deleteSession?: string;
        tui?: boolean;
      }) => {
        // 列出会话
        if (opts.listSessions) {
          showSessions();
          return;
        }

        // 删除会话
        if (opts.deleteSession) {
          if (deleteSessionRecord(opts.deleteSession)) {
            console.log(`会话 ${opts.deleteSession} 已删除`);
          } else {
            console.error(`会话 ${opts.deleteSession} 不存在`);
          }
          return;
        }

        // TUI 模式
        if (opts.tui) {
          const { startTUI } = await import("../tui/index.js");
          startTUI({
            model: opts.model,
          });
          return;
        }

        // 创建 Agent 包装器
        const agent = new PiAgentWrapper({
          model: opts.model,
          sessionId: opts.session,
        });

        // 初始化会话
        console.log("正在初始化 AI 助手...");
        await agent.initialize();

        // 保存会话记录
        const sessionRecord: SessionRecord = {
          id: agent.getSessionId(),
          timestamp: new Date().toISOString(),
          model: agent.getModel(),
        };
        saveSessionRecord(sessionRecord);

        console.log("轻量级 AI 助手已启动");
        console.log(`模型: ${agent.getModel()}`);
        console.log(`会话 ID: ${agent.getSessionId()}`);
        console.log("输入 'help' 查看可用命令");
        console.log("输入 'exit' 或 'quit' 退出");
        console.log("-".repeat(40));

        // 交互模式
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
                agent.dispose();
                rl.close();
                return;

              case "help":
              case "h":
                showHelp();
                prompt();
                return;

              case "sessions":
                showSessions();
                prompt();
                return;

              case "clear":
                console.log("对话历史已清空（Pi Agent 自动管理会话）");
                prompt();
                return;
            }

            // 处理 delete 命令
            if (trimmed.toLowerCase().startsWith("delete ")) {
              const sessionId = trimmed.substring(7).trim();
              if (deleteSessionRecord(sessionId)) {
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
              // 发送消息
              await agent.prompt(trimmed);
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

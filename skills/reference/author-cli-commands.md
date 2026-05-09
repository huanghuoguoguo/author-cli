# author-cli 命令速查

## 命令入口

**重要**：所有命令必须在小说项目根目录（包含 `project.yaml` 的目录）运行，不能在 author-cli 工具目录运行。

| 方式 | 命令格式 | 使用场景 |
|------|----------|----------|
| 全局安装 | `author <command>` | 已执行 `npm link`，在小说项目根目录运行 |
| 开发模式 | `npx tsx <author-cli-path>/tools/src/cli.ts <command>` | 未 link，在小说项目根目录运行 |

**示例**：
```bash
# 全局安装后（在小说项目根目录，如 E:\code\lu\my-novel）
cd E:\code\lu\my-novel
author validate

# 开发模式（在小说项目根目录）
cd E:\code\lu\my-novel
npx tsx E:\code\lu\author-cli\tools\src\cli.ts validate
```

**错误示例**（不要这样做）：
```bash
# ❌ 在 author-cli 目录运行会把工具目录当项目目录
cd E:\code\lu\author-cli
npm run author -- validate  # 会写到 author-cli/canon/，而非小说项目
```

以下表格使用简写 `author`，实际使用时需确保 cwd 是小说项目根目录。

## 核心命令

| 命令 | 用途 |
|------|------|
| `author validate` | 校验项目 canon 数据完整性 |
| `author render context --chapter <id>` | 生成章节写作上下文 |
| `author chapter add --id <id> --title <title>` | 创建新章节（空正文） |
| `author chapter import --id <id> --title <title> --from <file>` | 导入已有正文 |
| `author chapter delete <id>` | 删除章节 |

## Canon 管理

| 命令 | 用途 |
|------|------|
| `author character add --id <id> --name <name> --role <role>` | 创建角色 |
| `author character update <id> --field <field> --value <value>` | 更新角色字段 |
| `author character note <id> --chapter <ch> --text <text>` | 添加角色章节备注 |
| `author location add --id <id> --name <name>` | 创建地点 |
| `author world add --id <id> --name <name> --category <cat>` | 创建世界观设定 |
| `author object add --id <id> --name <name> --type <type>` | 创建物品 |
| `author timeline add --id <id> --title <title> --chapter <ch>` | 创建时间线事件 |
| `author rules add --id <id> --name <name>` | 创建写作规则 |
| `author rules update <id> --field <field> --value <value>` | 更新写作规则 |
| `author book update --field <field> --value <value>` | 更新作品信息 |

## 大纲与章节状态

| 命令 | 用途 |
|------|------|
| `author outline add-chapter --id <id> --title <title>` | 添加章节到大纲 |
| `author outline update-chapter <id> --field <field> --value <value>` | 更新章节字段 |
| `author outline list` | 列出大纲 |
| `author outline foreshadowing-add --id <id> --setup <ch>` | 添加伏笔 |
| `author outline foreshadowing-update <id> --field <field> --value <value>` | 更新伏笔 |
| `author outline foreshadowing-list` | 列出伏笔 |

## 提案流程

| 命令 | 用途 |
|------|------|
| `author suggest --chapter <id>` | 从章节提取设定建议 |
| `author proposal list` | 列出提案 |
| `author proposal show <id>` | 查看提案详情 |
| `author proposal apply <id>` | 应用提案 |
| `author proposal reject <id>` | 拒绝提案 |

## 检查

| 命令 | 用途 |
|------|------|
| `author check continuity --chapter <id>` | 检查章节连续性 |
| `author check global` | 全局检查 |

## 章节状态枚举

| 状态 | 用途 |
|------|------|
| `planned` | 已计划，未开始 |
| `outlined` | 大纲已完成 |
| `drafted` | 初稿完成 |
| `revised` | 已修订 |
| `final` | 最终定稿 |
| `imported` | 从已有正文导入 |

## 章节字段

| 字段 | 用途 |
|------|------|
| `title` | 章节标题 |
| `summary` | 章节摘要（迁移/重建场景） |
| `status` | 状态 |
| `purpose` | 章节目的 |
| `beats` | 节拍（逗号分隔） |

## 重要原则

- **canon 目录的所有 YAML 文件必须通过 CLI 修改**，禁止直接编辑
- **manuscript 目录的正文可以直接编辑**
- 提案先审核再 apply，避免 AI 误判
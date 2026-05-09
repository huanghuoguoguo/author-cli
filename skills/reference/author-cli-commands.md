# author-cli 命令速查

## 命令入口

**推荐**：使用 `npm run author -- <command>`（在 author-cli 目录下）
**全局可用时**：直接用 `author <command>`（需先 `npm link`）

## 核心命令

| 命令 | 用途 |
|------|------|
| `author validate` | 校验项目 canon 数据完整性 |
| `author render context --chapter <id>` | 生成章节写作上下文 |
| `author chapter add --id <id> --title <title>` | 创建章节（大纲+正文） |
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

## 大纲与状态

| 命令 | 用途 |
|------|------|
| `author outline update-chapter <id> --field status --value <value>` | 更新章节状态 |
| `author outline list` | 列出大纲 |

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

## 重要原则

- **canon 目录的所有 YAML 文件必须通过 CLI 修改**，禁止直接编辑
- **manuscript 目录的正文可以直接编辑**
- 提案先审核再 apply，避免 AI 误判
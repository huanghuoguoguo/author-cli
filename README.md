# author-cli

小说写作工作区 CLI 工具，通过结构化的 canon 数据管理角色、地点、世界观、大纲等设定，确保 AI 辅助写作的一致性和可追溯性。

## 特性

### CLI 命令

| 命令组 | 功能 |
|--------|------|
| `init` | 在工作目录初始化 Claude Code skills（创建符号链接） |
| `validate` | 校验所有 canon YAML 文件的 schema 和跨引用 |
| `character` | 角色 CRUD + 章节备注 |
| `location` | 地点 CRUD |
| `world` | 世界观设定 CRUD |
| `object` | 物品/道具 CRUD |
| `timeline` | 时间线事件管理 |
| `chapter` | 章节创建/删除（同时管理大纲和文稿文件） |
| `outline` | 大纲章节更新 |
| `rules` | 写作规则管理 |
| `render` | 生成 context pack / canon overview |
| `suggest` | 从章节正文提取 canon 变更建议 |
| `proposal` | 提案管理（apply/reject） |
| `check` | 连续性检查（角色引用、地点引用、伏笔状态、时间线顺序） |
| `index` | RAG 索引（重建、状态、关键词搜索） |

### Skills（Claude Code 工作流）

**三种入口场景**：

| 场景 | Skill | 适用情况 |
|------|-------|----------|
| 新项目 | `bootstrap-story` | 从零共创设定和大纲 |
| 迁移 | `migrate-existing-project` | 有正文+大纲/设定，迁移进来 |
| 重建 | `reconstruct-story-bible` | 只有正文，反向重建设定 |
| 总入口 | `import-manuscript` | 判断场景后转交对应流程 |

**写作阶段**：

| 阶段 | Skill | 用途 |
|------|-------|------|
| 准备 | `plan-chapter` | 写前确认目标、加载上下文 |
| 创作 | `writing-style` | 风格指南（网文/文学/剧本） |
| 创作 | `write-scenes` | 完整写作流程 |
| 审核 | `suggest-canon` | 从正文提取设定变更建议 |
| 审核 | `continuity-check` | 检测连续性问题 |

**共享参考**：
- `reference/author-cli-commands.md` - 命令速查

### 设计亮点

- **CLI 作为写入边界**：所有 canon 变更必须通过 CLI，确保 schema 校验和 ID 一致性
- **零依赖 RAG**：关键词搜索 + 内容 hash 增量更新，无需向量 API
- **Git-diffable**：YAML 文件字段顺序稳定，适合版本控制
- **跨引用校验**：关系目标存在、章节引用有效、时间线顺序正确

## 安装

```bash
npm install
npm link  # 注册全局 author 命令
```

## 使用

```bash
# 在工作目录初始化 skills（创建符号链接到 .claude/skills）
author init --author-cli <author-cli目录>

# 校验项目
npm run author -- validate

# 创建章节
npm run author -- chapter add --id ch001 --title 第一章

# 创建角色
npm run author -- character add --id mc --name 主角 --role protagonist

# 生成写作上下文
npm run author -- render context --chapter ch001

# 从章节提取建议
npm run author -- suggest --chapter ch001

# 连续性检查
npm run author -- check continuity --chapter ch001

# 搜索 canon
npm run author -- index search --query 主角
```

## 项目结构

```
author-cli/
├── canon/               # 设定数据（YAML，通过 CLI 管理）
│   ├── book.yaml
│   ├── characters/
│   ├── locations/
│   ├── world/
│   ├── objects/
│   ├── plot/
│   ├── rules/
│   └── timeline.yaml
├── manuscript/          # 章节正文（可直接编辑）
│   └── v01/
├── generated/           # 生成输出（可删除重建）
├── proposals/           # 待审批的建议
├── skills/              # Claude Code skills
└── tools/
    └── src/
        ├── cli.ts       # Commander 入口
        ├── schemas/     # Zod schemas
        ├── commands/    # 命令实现
        ├── render/      # Context/canon 生成
        └── utils/       # YAML/paths/RAG/校验
```

## 开发进度

### Phase 0-1（已完成）

- [x] 项目骨架 + Zod schemas
- [x] CLI 入口 + validate 命令
- [x] character/location/world/object/timeline 命令组
- [x] chapter/outline 命令（章节生命周期管理）
- [x] render 命令（context pack 生成）
- [x] rules 命令（写作规则）
- [x] 24 个集成测试（覆盖所有命令）

### Phase 2（已完成）

- [x] suggest 命令（从正文提取 canon 建议）
- [x] proposal 流程（apply/reject）
- [x] check 命令（连续性检查）
- [x] index 命令（RAG 索引）
- [x] Skills 重构（YAML frontmatter + 目录结构）

### Phase 3-6（待开发）

- [ ] 导出功能（PDF/DOCX/EPUB）
- [ ] 外部系统集成（可选）
- [ ] 高级 RAG（可选向量搜索）

## 测试

```bash
npm test
```

24 个集成测试覆盖所有核心命令流程。

## License

MIT
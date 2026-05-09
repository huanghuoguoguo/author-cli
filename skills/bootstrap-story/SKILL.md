---
name: bootstrap-story
description: "Use when starting a new novel from scratch; co-creating story bible with user; establishing genre, theme, protagonist, and world-building before writing; or building foundation before any prose exists. Triggers on '从零开始写', '新小说', '构思大纲', '创建设定', '设定故事', '写个新故事'."
---

# Bootstrap Story

从零开始共创小说设定和大纲，在写正文前建立完整结构。

## 流程

### 第一阶段：故事核心

与用户沟通，确认：

1. **故事类型**：网文/文学/剧本？玄幻/都市/历史？
2. **主题**：想表达什么？情感内核是什么？
3. **主角**：姓名、性格、动机、目标
4. **核心冲突**：主角面临什么挑战？障碍是什么？
5. **世界观边界**：设定范围、限制条件、禁忌

### 第二阶段：故事圣经草案

产出草案，不急着写入 canon：

- 主角 + 主要配角（性格、动机、说话风格）
- 世界观核心设定
- 故事主线大纲（开端 → 发展 → 高潮 → 结局）
- 关键地点
- 时间跨度

**向用户展示草案，确认或调整。**

### 第三阶段：写入 canon

确认后使用 CLI 创建：

```bash
author character add --id protagonist --name <姓名> --role protagonist
author character update protagonist --field personality --value <性格>
author character update protagonist --field motivation --value <动机>

author world add --id core-setting --name <设定名> --category background
author location add --id main-loc --name <主地点>

author rules add --id writing-style --name "写作风格"
```

### 第四阶段：创建大纲

按章节规划：

```bash
author chapter add --id ch001 --title "第一章"
author outline update-chapter ch001 --field summary --value <情节概要>
author outline update-chapter ch001 --field status --value planned

# 继续创建后续章节...
```

### 第五阶段：进入写作流程

确认结构后：
- 使用 `/plan-chapter` 准备写第一章
- 使用 `/write-scenes` 开始创作

## 输出清单

- [ ] `canon/book.yaml` 作品信息
- [ ] `canon/characters/` 主角和主要配角
- [ ] `canon/world/` 世界观核心
- [ ] `canon/locations/` 关键地点
- [ ] `canon/rules/writing-style.yaml` 风格规则
- [ ] `canon/plot/outline.yaml` 章节大纲
- [ ] `project.yaml` writingMode 已设置

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)

本流程常用：
- `author character add --id <id> --name <name> --role <role>`
- `author chapter add --id <id> --title <title>`
- `author outline update-chapter <id> --field summary --value <value>`
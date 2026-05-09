---
name: suggest-canon
description: "Use when extracting canon suggestions from chapter prose; managing AI-generated proposals; reviewing new character/location suggestions; or updating canon after drafting. Triggers on '提取建议', '分析章节', '生成提案', '应用提案', '审核建议', '这章有什么新角色'."
---

# Suggest Canon

从章节正文提取设定变更建议。

## 流程

### 1. 生成建议

```bash
npm run author -- suggest --chapter <chapter-id>
```

分析章节正文，提取：
- 大纲引用但未登记的角色
- 对话说话者（可能新角色）
- 已存在角色的出场备注建议

保存到 `proposals/canon-suggestions/proposal-YYYYMMDD-<chapter-id>.yaml`

### 2. 审核

```bash
npm run author -- proposal list
npm run author -- proposal show <proposal-id>
```

**重要**：建议人工审核，中文对话识别可能误判。

### 3. 执行

```bash
npm run author -- proposal apply <proposal-id>   # 写入 canon
npm run author -- proposal reject <proposal-id>  # 删除提案
```

apply 后自动触发 schema 校验。

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)

本流程常用：
- `npm run author -- suggest --chapter <id>`
- `npm run author -- proposal list`
- `npm run author -- proposal apply <id>`
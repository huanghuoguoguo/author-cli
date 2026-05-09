---
name: suggest-canon
description: "从章节正文提取 canon 变更建议并管理提案。TRIGGER when: 用户说'提取建议'、'分析章节'、'suggest'、'proposal'、'生成提案'、'应用提案'、'审核建议'，或写完后需要更新设定。即使用户只是说'检查一下这章有什么新角色'，也应触发此 skill。"
---

# Suggest Canon

从章节正文中提取可能的 canon 变更，生成提案供用户审核。

## 流程

### 1. 生成建议

```bash
npm run author -- suggest --chapter <chapter-id>
```

此命令会分析章节正文，提取：
- 大纲中引用但未登记的角色
- 正文中的对话说话者（可能是新角色）
- 已存在角色的章节出场备注建议

建议保存到 `proposals/canon-suggestions/proposal-YYYYMMDD-<chapter-id>.yaml`。

### 2. 查看提案

```bash
npm run author -- proposal list
npm run author -- proposal show <proposal-id>
```

### 3. 应用或拒绝

```bash
# 应用提案（所有建议写入 canon）
npm run author -- proposal apply <proposal-id>

# 拒绝提案
npm run author -- proposal reject <proposal-id>
```

## 注意事项

- **suggest 是基础实现**：中文对话识别可能存在误识别，建议人工审核后再 apply。
- **提案状态**：pending → applied / rejected
- **apply 后自动校验**：应用后会触发 schema 校验

## 命令速查

| 操作 | 命令 |
|------|------|
| 生成建议 | `npm run author -- suggest --chapter <id>` |
| 列出提案 | `npm run author -- proposal list` |
| 查看提案 | `npm run author -- proposal show <id>` |
| 应用提案 | `npm run author -- proposal apply <id>` |
| 拒绝提案 | `npm run author -- proposal reject <id>` |
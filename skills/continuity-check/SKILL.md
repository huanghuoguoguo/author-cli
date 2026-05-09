---
name: continuity-check
description: "检查故事连续性问题（角色状态、地点引用、伏笔回收等）。TRIGGER when: 用户说'检查连续性'、'检查一致性'、'check'、'校验故事'、'发现冲突'、'检查设定是否一致'，或需要发现设定与正文之间的矛盾。即使用户只是说'这章有没有问题'，也应触发此 skill。"
---

# Continuity Check

检查章节和全局的连续性问题，发现设定与正文之间的矛盾。

## 章节级检查

```bash
npm run author -- check continuity --chapter <chapter-id> [--severity <level>]
```

**检查项**：
- 大纲引用的角色是否存在
- 大纲引用的地点是否存在
- 已死亡/失踪的角色在大纲中标记出场（警告）
- 正文中的角色未在大纲中标记（信息）

**严重级别**：
- `error` — 只显示错误
- `warning` — 显示错误和警告
- `info` — 显示所有（默认）

## 全局检查

```bash
npm run author -- check global [--severity <level>]
```

**检查项**：
- 伏笔 setupChapter 不存在
- 伏笔 payoffChapter 不存在或顺序错误
- 未指定回收章节的开放伏笔（信息）
- 时间线事件 order 重复

## 输出格式

```
章节 ch002 发现 2 个问题:

  ✗ [error] character/unknown-char
    大纲引用的角色不存在: unknown-char
    建议: 使用 npm run author -- character add --id unknown-char 创建角色

  ⚠ [warning] character/dead-char
    角色 已死角色 (dead-char) 状态为 dead，但仍在大纲中标记为本章出场
    建议: 检查是否是回忆/幻觉场景，或更新角色状态

统计: 1 错误, 1 警告, 0 信息
```

## 命令速查

| 操作 | 命令 |
|------|------|
| 检查章节 | `npm run author -- check continuity --chapter <id>` |
| 检查全局 | `npm run author -- check global` |
| 指定级别 | `--severity error/warning/info` |
---
name: continuity-check
description: "Use when detecting story continuity issues; checking character state consistency; verifying location references; validating foreshadowing payoff; or finding contradictions between canon and prose. Triggers on '检查连续性', '检查一致性', '校验故事', '发现冲突', '这章有没有问题'."
---

# Continuity Check

检查章节和全局的连续性问题。

## 章节级检查

```bash
author check continuity --chapter <chapter-id> [--severity <level>]
```

检查项：
- 大纲引用的角色/地点是否存在
- 已死亡角色标记出场（警告）
- 正文角色未在大纲标记（信息）

## 全局检查

```bash
author check global [--severity <level>]
```

检查项：
- 伏笔 setupChapter/payoffChapter 存在性和顺序
- 开放伏笔未指定回收章节
- 时间线 order 重复

## 严重级别

- `error` — 只显示错误
- `warning` — 错误 + 警告
- `info` — 全部（默认）

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)

本流程常用：
- `author check continuity --chapter <id>`
- `author check global`
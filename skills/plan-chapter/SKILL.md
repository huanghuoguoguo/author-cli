---
name: plan-chapter
description: "Use when preparing to write a new chapter; reviewing outline beats before drafting; setting chapter objectives; or generating writing context before creative work. Triggers on '准备写', '规划章节', '生成上下文', '看下这章要写什么', '写之前准备'."
---

# Plan Chapter

写作前的准备阶段：确认目标、加载上下文、列出节拍。

## 流程

### 1. 校验项目

```bash
author validate
```

### 2. 查看大纲

```bash
author outline list
# 或查看特定章节大纲
```

确认当前章节的目的和节拍。

### 3. 加载写作风格

根据 `project.yaml` 的 `writingMode` 加载对应风格：

- `webnovel` → 参考 [writing-style/webnovel.md](../writing-style/webnovel.md)
- `traditional` → 参考 [writing-style/traditional.md](../writing-style/traditional.md)
- `screenplay` → 参考 [writing-style/screenplay.md](../writing-style/screenplay.md)

### 4. 生成上下文

```bash
author render context --chapter <chapter-id>
```

### 5. 阅读上下文

读取 `generated/context/<chapter-id>.md`：
- 写作规则
- 章节目的和节拍
- 相关角色
- 大纲和伏笔状态
- 前文摘要

### 6. 确认写作目标

向用户确认：
- 本章核心目的是什么？
- 需要推进哪些节拍？
- 涉及哪些角色？
- 有无伏笔要埋/收？

## 输出

确认后进入写作：
```
准备完成，本章目标：
1. [节拍1]
2. [节拍2]
3. [节拍3]

涉及角色：[角色列表]
伏笔：[如有]

可以开始写作，使用 /write-scenes
```

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)

本流程常用：
- `author validate`
- `author outline list`
- `author render context --chapter <id>`
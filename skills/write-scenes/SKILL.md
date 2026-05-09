---
name: write-scenes
description: "Use when drafting, continuing, or revising novel manuscript scenes; writing chapter prose; converting outline beats into chapter content; or responding to any creative writing request. Triggers on '写章节', '写场景', '开始写作', '续写', '写 chXXX', '帮我写', '继续写'."
---

# Write Scenes

使用 author-cli 写小说场景的完整流程。

## 前置准备

### 1. 校验项目

```bash
author validate
# 或全局安装后: author validate
```

有错误先修复。

### 2. 加载写作风格

根据 `project.yaml` 的 `writingMode` 加载对应风格：

- `webnovel` → 参考 [writing-style/webnovel.md](../writing-style/webnovel.md)
- `traditional` → 参考 [writing-style/traditional.md](../writing-style/traditional.md)
- `screenplay` → 参考 [writing-style/screenplay.md](../writing-style/screenplay.md)

### 3. 生成上下文

```bash
author render context --chapter <chapter-id>
```

### 4. 阅读上下文

读取 `generated/context/<chapter-id>.md`：
- 写作规则
- 章节目的和节拍
- 相关角色设定
- 大纲和伏笔
- 前文摘要

## 写作执行

### 5. 编辑正文

直接编辑 `manuscript/v01/<chapter-id>.md`

遵守：
- 上下文中的写作规则
- 角色声音一致
- 大纲节拍推进

### 6. 新增设定

**必须通过 CLI**，禁止直接编辑 canon YAML：

```bash
author character add --id <id> --name <name> --role <role>
author location add --id <id> --name <name>
author world add --id <id> --name <name> --category <cat>
```

## 后置收尾

### 7. 更新状态

```bash
author outline update-chapter <chapter-id> --field status --value drafted
```

### 8. 再次校验

```bash
author validate
```

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)

本流程常用命令：
- `author validate`
- `author render context --chapter <id>`
- `author outline update-chapter <id> --field status --value drafted`
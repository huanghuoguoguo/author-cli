---
name: migrate-existing-project
description: "Use when user has existing manuscript with outline/setting documents; migrating structured project into author-cli; importing when user already has canon data elsewhere. Triggers on '迁移项目', '导入已有大纲', '我的设定都在另一个文档里', '把现成的小说迁移进来'."
---

# Migrate Existing Project

用户已有正文和大纲/设定文档，将其迁移到 author-cli 结构。

**关键原则：尊重用户已有材料，不覆盖或推断已有设定。**

## 流程

### 第一阶段：盘点材料

询问用户：
- 正文在哪？（目录路径、文件格式）
- 大纲在哪？（文档、脑内、其他地方）
- 设定文档在哪？（角色表、世界观、单独文档）
- 章节编号如何映射？（现有编号 → chXXX）

### 第二阶段：建立结构

```bash
author init --work-dir <目标目录>
```

确认 `project.yaml` 的 `writingMode` 设置。

### 第三阶段：导入章节

使用 `chapter import` 命令导入已有正文：

```bash
author chapter import --id ch001 --title "第一章" --from <源文件路径>
author chapter import --id ch002 --title "第二章" --from <源文件路径>
# ...
```

导入命令会：
1. 创建大纲条目（状态为 `imported`）
2. 复制正文文件到 `manuscript/v01/`

**可选**：使用 `--summary` 直接添加章节摘要。

### 第四阶段：迁移设定

从用户已有设定文档创建 canon：

```bash
author character add --id <id> --name <name> --role <role>
author location add --id <id> --name <name>
author world add --id <id> --name <name> --category <cat>
```

**只迁移用户明确提供的设定，不推断缺失内容。**

### 第五阶段：填充大纲

将用户大纲内容写入：

```bash
author outline update-chapter ch001 --field summary --value <情节概要>
# 状态保持 imported（迁移的旧正文），不改 drafted
```

### 第六阶段：验证和补缺

```bash
author validate
author render context --chapter ch001
author check continuity --chapter ch001
```

对缺失信息（如角色说话风格未设定）标记但不自动填充，让用户决定是否补充。

## 输出清单

- [ ] 正文已迁移到 `manuscript/v01/`
- [ ] 大纲已写入 `canon/plot/outline.yaml`
- [ ] 用户已有角色设定已迁移
- [ ] 用户已有世界观已迁移
- [ ] validate 通过
- [ ] 缺失信息已标记，等待用户补充

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)

本流程常用：
- `author chapter import --id <id> --title <title> --from <file>`
- `author character add --id <id> --name <name> --role <role>`
- `author outline update-chapter <id> --field summary --value <value>`
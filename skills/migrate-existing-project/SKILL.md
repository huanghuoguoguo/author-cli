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
npm run author -- init --work-dir <目标目录>
```

确认 `project.yaml` 的 `writingMode` 设置。

### 第三阶段：创建章节条目

按用户原大纲创建章节：

```bash
npm run author -- chapter add --id ch001 --title "第一章"
# 不创建正文文件（用户已有），只创建大纲条目
```

**注意**：如果正文文件已存在，CLI 需支持跳过正文创建。
当前可用方案：先创建章节条目，再手动复制正文文件。

### 第四阶段：迁移正文

将用户正文文件复制到 `manuscript/v01/`：

```
用户原文件 → manuscript/v01/chXXX.md
```

文件命名统一为 `ch001.md`, `ch002.md`...

### 第五阶段：迁移设定

从用户已有设定文档创建 canon：

```bash
npm run author -- character add --id <id> --name <name> --role <role>
npm run author -- location add --id <id> --name <name>
npm run author -- world add --id <id> --name <name> --category <cat>
```

**只迁移用户明确提供的设定，不推断缺失内容。**

### 第六阶段：填充大纲

将用户大纲内容写入：

```bash
npm run author -- outline update-chapter ch001 --field summary --value <情节概要>
npm run author -- outline update-chapter ch001 --field status --value drafted
```

### 第七阶段：验证和补缺

```bash
npm run author -- validate
npm run author -- render context --chapter ch001
npm run author -- check continuity --chapter ch001
```

对缺失信息（如角色说话风格未设定）标记但不自动填充，让用户决定是否补充。

## 输出清单

- [ ] 正文已迁移到 `manuscript/v01/`
- [ ] 大纲已写入 `canon/plot/outline.yaml`
- [ ] 用户已有角色设定已迁移
- [ ] 用户已有世界观已迁移
- [ ] validate 通过
- [ ] 缺失信息已标记，等待用户补充

## CLI 能力缺口

当前 `chapter add` 会创建空正文文件。迁移场景需要：

```bash
# 建议新增 CLI 能力
npm run author -- chapter import --id ch001 --title "第一章" --from <源文件>
# 或
npm run author -- chapter add --id ch001 --title "第一章" --keep-existing
```

在此之前，迁移时先创建章节条目，再手动处理正文文件。

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)
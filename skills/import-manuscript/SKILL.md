---
name: import-manuscript
description: "Use when importing settings from existing chapters; extracting characters and world-building from prose; preparing to continue an unfinished novel; or establishing baseline canon before writing. Triggers on '导入', '提取设定', '续写准备', '从现有内容提取', '导入烂尾小说'."
---

# Import Manuscript

从现有章节提取设定、大纲和写作风格。

## 流程

### 1. 阅读现有章节

阅读 `manuscript/v01/` 下所有章节文件。

### 2. 提取角色

分析文本，提取每个角色：
- 姓名、昵称、绰号
- 角类型
- 外貌、性格、说话风格
- 关系、出场章节

### 3. 提取世界观/背景

- 时代背景（年份、社会环境）
- 地点设定
- 职业环境

### 4. 提取大纲

按章节概括情节（每章 50-100 字）。

### 5. 提取风格样本

摘录典型段落保存到 `generated/style-sample.md`：
- 叙事风格
- 句式特点
- 用词特点

### 6. 使用 CLI 创建设定

**必须通过 CLI**，禁止直接编辑 canon YAML：

```bash
npm run author -- character add --id <id> --name <name> --role <role>
npm run author -- character update <id> --field personality --value <value>
npm run author -- location add --id <id> --name <name>
npm run author -- world add --id <id> --name <name> --category <cat>
```

### 7. 创建风格规则

通过 CLI 创建（如 CLI 支持规则命令）：

```bash
npm run author -- rules add --id writing-style --name "写作风格"
npm run author -- rules update writing-style --field description --value <风格描述>
```

**注意**：如果 CLI 暂不支持 rules 命令，风格规则需等待 CLI 补齐后再写入。当前可将风格样本保存到 `generated/style-sample.md` 作为参考。

### 8. 创建大纲

```bash
npm run author -- chapter add --id ch001 --title "第一章"
# 然后更新大纲内容
npm run author -- outline update-chapter ch001 --field summary --value <情节概要>
```

## 输出清单

- [ ] `canon/characters/` 有角色文件
- [ ] `canon/world/` 有世界观文件
- [ ] `generated/style-sample.md` 风格样本
- [ ] 大纲已创建

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)
---
name: write-scenes
description: "写小说场景的完整流程。TRIGGER when: 用户说'写章节'、'写场景'、'开始写作'、'写 chXXX'、'续写'，或任何与创作正文内容相关的请求。即使用户只是说'帮我写'或'继续写'，也应触发此 skill。"
---

# Write Scenes

指导 Claude Code 使用 author-cli 写小说场景的完整流程。

## 写作前

### 1. 校验项目

```bash
npm run author -- validate
```

如果有错误，先修复再继续。

### 2. 生成上下文

```bash
npm run author -- render context --chapter <chapter-id>
```

### 3. 阅读上下文

读取 `generated/context/<chapter-id>.md`，了解：
- 写作规则（必须做、禁止做）
- 当前章节信息（目的、节拍）
- 相关角色（性格、动机、说话风格）
- 大纲和伏笔状态
- 前文摘要
- 当前章节正文窗口

### 4. 确认写作目标

根据上下文中的章节目的和节拍，明确本次写作的目标。

## 写作中

### 5. 编辑正文

直接编辑 `manuscript/v01/<chapter-id>.md`。

写作时注意：
- 遵守上下文中的写作规则
- 保持角色声音一致
- 参考角色的说话风格和性格
- 按照大纲节拍推进情节
- 注意伏笔的埋设和回收

### 6. 新增角色/设定

如果正文中出现了新的角色、地点、物品等，通过 CLI 添加：

```bash
# 新角色
npm run author -- character add --id <id> --name <name> --role <role>
npm run author -- character note <id> --chapter <chapter-id> --text <note>

# 新地点
npm run author -- location add --id <id> --name <name>
npm run author -- location note <id> --chapter <chapter-id> --text <note>

# 新世界观设定
npm run author -- world add --id <id> --name <name> --category <cat>
npm run author -- world note <id> --chapter <chapter-id> --text <note>

# 新物品/道具
npm run author -- object add --id <id> --name <name> --type <type>
npm run author -- object note <id> --chapter <chapter-id> --text <note>

# 时间线事件
npm run author -- timeline add --id <id> --title <title> --chapter <chapter-id>
```

**不要直接编辑 canon YAML 文件。**

## 写作后

### 7. 更新大纲状态

```bash
npm run author -- outline update-chapter <chapter-id> --field status --value drafted
```

### 8. 再次校验

```bash
npm run author -- validate
```

### 9. 重新渲染（可选）

如果修改了设定，重新生成 context：

```bash
npm run author -- render context --chapter <chapter-id>
```

## 命令速查

| 操作 | 命令 |
|------|------|
| 校验项目 | `npm run author -- validate` |
| 生成 context | `npm run author -- render context --chapter <id>` |
| 创建章节 | `npm run author -- chapter add --id <id> --title <title>` |
| 删除章节 | `npm run author -- chapter delete <id>` |
| 添加角色 | `npm run author -- character add --id <id> --name <name>` |
| 角色备注 | `npm run author -- character note <id> --chapter <ch> --text <text>` |
| 添加地点 | `npm run author -- location add --id <id> --name <name>` |
| 添加事件 | `npm run author -- timeline add --id <id> --title <title>` |
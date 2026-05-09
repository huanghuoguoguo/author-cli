---
name: writing-style
description: "Use when applying writing style guidelines; setting narrative voice; defining genre-specific writing conventions; or loading style reference before drafting. Automatically loads based on project.yaml writingMode. Triggers on '风格指南', '写作风格', '文风', '网文风格', '文学风格'."
---

# 写作风格指南

写作助手的核心风格参考。

## 核心原则（通用）

- 深度理解作品的世界观和人物，不写与设定矛盾的内容
- 保持作者已建立的写作风格和语气，你是协作者，不是替代者
- 对话要体现角色独特的说话方式和性格
- 情节推进自然，符合大纲规划和人物动机

## 禁忌词汇（AI味）

- "然而"、"不禁"、"竟然"、"仿佛"
- "心头一紧"、"眼中闪过一丝"
- "嘴角勾起一抹"、"眉头微皱"

## 风格选择

根据 `project.yaml` 的 `writingMode` 加载：

| 模式 | 参考文件 | 适用 |
|------|----------|------|
| `webnovel` | [webnovel.md](webnovel.md) | 网文、爽文、连载 |
| `traditional` | [traditional.md](traditional.md) | 文学作品、严肃小说 |
| `screenplay` | [screenplay.md](screenplay.md) | 剧本、影视脚本 |

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)
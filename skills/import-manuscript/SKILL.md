---
name: import-manuscript
description: "Use when importing existing manuscript into author-cli; entry point for bootstrap, migrate, or reconstruct scenarios. Triggers on '导入', '迁移', '续写', '开始写小说'. First determines which scenario applies, then delegates to appropriate skill."
---

# Import Manuscript

导入入口：判断用户属于哪种场景，转交对应流程。

## 场景判断

询问用户：

1. **是否已有正文？**
   - 没有 → 使用 [bootstrap-story](../bootstrap-story/SKILL.md)
   - 有 → 继续

2. **是否有大纲/设定文档？**
   - 有 → 使用 [migrate-existing-project](../migrate-existing-project/SKILL.md)
   - 没有 → 使用 [reconstruct-story-bible](../reconstruct-story-bible/SKILL.md)

## 三种场景

### 场景一：全新项目（bootstrap-story）

用户从零开始，先共创设定和大纲，再写正文。

**触发条件**：
- "我想写个新小说"
- "从零开始构思"
- 没有任何现有材料

**流程**：
- [bootstrap-story](../bootstrap-story/SKILL.md) → [plan-chapter](../plan-chapter/SKILL.md) → [write-scenes](../write-scenes/SKILL.md)

### 场景二：有正文+有设定（migrate-existing-project）

用户已有正文和大纲/设定文档，迁移进 author-cli。

**触发条件**：
- "我写了10章，大纲在另一个文档"
- "我的角色设定都在 Excel 里"
- 有明确的设定材料

**流程**：
- [migrate-existing-project](../migrate-existing-project/SKILL.md)

**关键**：尊重用户已有材料，不覆盖或推断。

### 场景三：有正文+无设定（reconstruct-story-bible）

用户只有正文，需要反向重建设定和大纲。

**触发条件**：
- "这个小说烂尾了，想续写但没设定"
- "想写续集，但原作设定都忘了"
- 只有小说文件，没有设定文档

**流程**：
- [reconstruct-story-bible](../reconstruct-story-bible/SKILL.md)

**关键**：保守推断，两轮流程（先报告后写入）。

## 快速决策树

```
用户请求导入/迁移/续写
        ↓
    有正文吗？
        ↓
   没有 → bootstrap-story（从零共创）
        ↓
   有 → 有大纲/设定吗？
        ↓
   有 → migrate-existing-project（迁移，尊重已有）
        ↓
   没有 → reconstruct-story-bible（反向重建，保守推断）
```

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)
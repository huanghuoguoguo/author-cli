---
name: reconstruct-story-bible
description: "Use when user has existing manuscript without outline or setting; reconstructing story bible from prose only; continuing an abandoned novel; or writing sequel with no canon data. Triggers on '烂尾小说续写', '没有大纲怎么办', '从正文提取设定', '想写续集但没设定', '重建故事圣经'."
---

# Reconstruct Story Bible

只有小说正文，没有大纲和设定，需要反向重建。

**关键原则：保守推断，明确区分事实、推断、待确认。**

---

## 两轮流程

### 第一轮：只读，不写 canon

#### 1. 阅读全部正文

阅读 `manuscript/v01/` 或用户提供的所有章节文件。

#### 2. 建立章节摘要

每章概括 50-100 字，记录关键情节。

#### 3. 抽取内容

| 类型 | 抽取内容 |
|------|----------|
| 人物 | 姓名、昵称、外貌、性格、说话风格、关系 |
| 地点 | 名称、描述、氛围 |
| 物品 | 名称、持有者、象征意义 |
| 时间线 | 事件顺序、时间跨度 |
| 伏笔 | 已埋设、已回收、未解决 |

#### 4. 提取风格样本

摘录典型段落到 `generated/style-sample.md`：
- 叙事风格（人称、语气）
- 句式特点
- 用词习惯
- 对话风格

#### 5. 标记不确定项

- 年龄矛盾
- 时间顺序不明
- 设定前后冲突
- 未明确说明的信息

#### 6. 输出重建报告

写入 `generated/reconstruction-report.md`：

```markdown
# 重建报告

## 明确事实（原文写出）
- 主角：XXX，[原文描述]
- 地点：YYY，[原文描述]

## 合理推断（从上下文推断）
- 角色年龄约 XX 岁（从第 N 章对话推断）

## 待确认（矛盾或空白）
- 第 3 章说 A 在 B 城市，第 7 章说 A 在 C 城市
- 主角职业未明确

## 伏笔状态
- 已埋设未回收：[列表]
- 已回收：[列表]

## 风格特点
- [摘要]

## 续写目标建议
- 从第 X 章续写，还是写续集？
```

**向用户展示报告，等待确认。**

---

### 第二轮：用户确认后写入 canon

#### 7. 确认续写目标

询问用户：
- 继续写下一章？（接着烂尾点）
- 写续集？（时间跳跃）
- 重写某部分？

#### 8. 写入设定

只写入确认过的内容：

```bash
author character add --id protagonist --name <姓名> --role protagonist
author character update protagonist --field personality --value <性格>
author character update protagonist --field speechStyle --value <说话风格>

author location add --id <id> --name <名称>
author world add --id <id> --name <名称> --category background
```

**不确定项保持空白或标记，不自动填充。**

#### 9. 写入大纲

对于已有正文，使用 `chapter import` 导入：

```bash
author chapter import --id ch001 --title "第一章" --from manuscript/v01/ch001.md --summary <摘要>
# 导入命令自动设置 status 为 imported
```

如果正文已放在 `manuscript/v01/`，使用 `outline add-chapter` 只建大纲：

```bash
author outline add-chapter --id ch001 --title "第一章"
author outline update-chapter ch001 --field summary --value <摘要>
author outline update-chapter ch001 --field status --value imported
```

**不要用 `chapter add`**，它会创建空正文文件，与已有正文冲突。

#### 10. 写入伏笔和未解决问题

将未回收伏笔写入 `canon/plot/`，标记状态为 `open`。

#### 11. 写入风格规则

```bash
author rules add --id writing-style --name "写作风格"
author rules update writing-style --field voice --value <风格描述>
```

风格描述写入 `voice` 字段。也可用 `rules` 数组添加具体规则。

---

## 进入续写流程

确认后：
- `/plan-chapter` 准备写新章节
- `/write-scenes` 开始续写

---

## 输出清单

第一轮完成后：
- [ ] `generated/reconstruction-report.md` 重建报告
- [ ] `generated/style-sample.md` 风格样本
- [ ] 用户已确认事实和推断

第二轮完成后：
- [ ] `canon/characters/` 确认的角色
- [ ] `canon/world/` 确认的世界观
- [ ] `canon/locations/` 确认的地点
- [ ] `canon/plot/outline.yaml` 大纲 + 伏笔
- [ ] `canon/rules/` 风格规则（或 generated/style-sample.md）
- [ ] 续写目标已确认

---

## 命令速查

详见 [reference/author-cli-commands.md](../reference/author-cli-commands.md)
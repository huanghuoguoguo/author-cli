---
name: import-manuscript
description: "从现有章节提取设定和风格。TRIGGER when: 用户说'导入'、'提取设定'、'分析章节'、'续写准备'、'从现有内容提取'，或首次导入烂尾小说时。"
---

# Import Manuscript

从现有章节中提取设定、大纲和写作风格，为续写做准备。

## 工作流程

### 1. 阅读现有章节

先阅读 manuscript/v01/ 下的所有章节文件，从 ch01.md 到最新章节。

```bash
# 查看章节列表
author chapter list

# 或直接阅读文件
```

### 2. 提取角色设定

分析文本中的角色，提取以下信息：
- **姓名**：文中如何称呼（全名、昵称、绰号）
- **角色**：主角/配角/反派
- **外貌**：身材、年龄、特征
- **性格**：通过言行展现的性格特点
- **说话风格**：用词习惯、句式、语气
- **关系**：与其他角色的关系
- **出场章节**：哪些章节有出场

示例格式：
```
刘赋罡（刘胖子）
- 角色：主要配角/潜在恋爱对象
- 外貌：胖、年龄不详（可能40左右）、官场老成
- 性格：话多、关心人、有点唠叨、会照顾人
- 说话风格：口语化、用"嘿"、"你小子"等、爱调侃
- 关系：小梁的同事、室友
- 出场：ch01-ch10 全部
```

### 3. 提取世界观/背景

- **时代背景**：年份、社会环境
- **地点**：城市、单位、居住地
- **职业环境**：工作内容、职场文化

### 4. 提取剧情大纲

按章节概括主要情节：
```
ch01: 小梁入职乡政府，在办公室遇见刘赋罡（买黄瓜砍价的胖子）
ch02: 办公室日常，两人逐渐熟悉
ch03: 某事件...
...
ch10: 流鼻血事件，刘赋罡照顾小梁
```

### 5. 提取写作风格样本

选择一段典型的文字作为风格参考：
- 叙事风格：第一人称、口语化、自嘲幽默
- 句式特点：短句、反问、感叹
- 用词特点：日常用语、俚语、调侃
- 情感表达：含蓄、幽默掩饰

**风格样本**（摘录典型段落）：
> 保存到 `generated/style-sample.md`

### 6. 使用 CLI 创建设定

根据提取的内容，使用 CLI 创建角色：

```bash
# 创建角色
author character add --id liuhonggan --name "刘赋罡" --role supporting --notes "刘胖子，小梁的同事和室友"
author character add --id xiaoliang --name "小梁" --role protagonist --notes "第一人称叙述者，公务员"

# 添加角色详细信息
author character update liuhonggan --field personality --value "话多、关心人、有点唠叨"
author character update liuhonggan --field speechStyle --value "口语化、用'嘿''你小子'等、爱调侃"
author character update xiaoliang --field personality --value "自嘲、幽默、有点内向"

# 创建地点
author location add --id office --name "乡政府办公室"
author location add --id rental --name "新海路租的房子"

# 创建世界观设定
author world add --id era --name "时代背景" --category background
author world update era --field description --value "2001年左右，公务员系统，基层单位"
```

### 7. 创建风格规则

将风格特点写入 `canon/rules/writing-style.yaml`：

```yaml
id: writing-style
name: 写作风格
description: |
  第一人称叙事，口语化幽默风格
  
  叙事特点：
  - 第一人称"我"视角
  - 自嘲式幽默，调侃自己和他人
  - 短句为主，节奏轻快
  - 多用反问、感叹
  
  禁忌：
  - 不用"然而""不禁""竟然""仿佛"
  - 不用过长的心理描写
  - 不用文言化表达
  
  角色对话：
  - 刘胖子：口语化、爱调侃、用"嘿""你小子"
  - 小梁：自嘲、含蓄、内心戏多但不直说
```

## 输出清单

完成导入后，检查以下文件是否存在：
- [ ] `canon/characters/` 下有角色文件
- [ ] `canon/world/` 下有世界观文件
- [ ] `canon/rules/writing-style.yaml` 风格规则
- [ ] `generated/style-sample.md` 风格样本摘录
- [ ] 大纲概括（可写在 `canon/plot/outline.yaml`）

## 续写准备

导入完成后，可以开始续写：
```bash
# 校验设定
author validate

# 查看上下文
author render context --chapter ch11

# 开始写作
```
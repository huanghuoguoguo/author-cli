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
张三（老张）
- 角色：主要配角
- 外貌：中年、身材中等、戴眼镜
- 性格：沉稳、话少、关键时刻可靠
- 说话风格：简短、直接、偶尔幽默
- 关系：主角的同事、好友
- 出场：ch01-ch05
```

### 3. 提取世界观/背景

- **时代背景**：年份、社会环境
- **地点**：城市、单位、居住地
- **职业环境**：工作内容、职场文化

### 4. 提取剧情大纲

按章节概括主要情节：
```
ch01: 主角入职新单位，遇见关键人物
ch02: 日常工作相处，两人逐渐熟悉
ch03: 某事件发生，关系有所突破
...
ch10: 某关键情节，两人关系变化
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
author character add --id zhangsan --name "张三" --role supporting --notes "主角的同事"
author character add --id protagonist --name "主角" --role protagonist --notes "第一人称叙述者"

# 添加角色详细信息
author character update zhangsan --field personality --value "沉稳、话少、关键时刻可靠"
author character update zhangsan --field speechStyle --value "简短、直接、偶尔幽默"
author character update protagonist --field personality --value "乐观、有点冲动"

# 创建地点
author location add --id office --name "办公室"
author location add --id home --name "主角住所"

# 创建世界观设定
author world add --id era --name "时代背景" --category background
author world update era --field description --value "现代都市，职场环境"
```

### 7. 创建风格规则

将风格特点写入 `canon/rules/writing-style.yaml`：

```yaml
id: writing-style
name: 写作风格
description: |
  第一人称叙事，口语化风格
  
  叙事特点：
  - 第一人称"我"视角
  - 口语化表达，贴近日常说话
  - 短句为主，节奏轻快
  
  禁忌：
  - 不用"然而""不禁""竟然""仿佛"
  - 不用过长的心理描写
  
  角色对话：
  - 张三：简短、直接、偶尔幽默
  - 主角：口语化、有自我意识
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
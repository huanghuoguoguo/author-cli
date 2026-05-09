# 世界观设定目录

存放世界观/背景设定的 YAML 文件。

## 文件命名

使用设定 ID 作为文件名：`<设定id>.yaml`

示例：
- `era.yaml` - 时代背景
- `magic-system.yaml` - 魔法体系（玄幻）
- `social-structure.yaml` - 社会结构

## YAML 格式

```yaml
name: 设定名称
category: 设定分类（background, magic, technology, culture, history）

description: 详细描述

rules:
  - 规则1
  - 规则2

limitations: 限制/禁忌

relatedLocations:
  - 地点id

notes: 备注
```

## 创建世界观设定

```bash
author world add --id <id> --name <名称> --category <分类>
author world update <id> --field <字段> --value <值>
author world note <id> --chapter <章节> --text <备注>
```
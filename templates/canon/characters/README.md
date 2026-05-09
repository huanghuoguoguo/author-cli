# 角色设定目录

存放角色的 YAML 设定文件。每个角色一个文件。

## 文件命名

使用角色 ID 作为文件名：`<角色id>.yaml`

示例：
- `protagonist.yaml` - 主角
- `supporting-01.yaml` - 配角
- `antagonist.yaml` - 反派

## YAML 格式

```yaml
name: 角色姓名
nickname: 昵称/绰号
role: protagonist | supporting | antagonist | minor
type: 角色类型（如：主角、配角、反派）

gender: 性别
age: 年龄
appearance:
  body_type: 身材
  face: 面部特征
  other: 其他特征

personality:
  - 性格特点1
  - 性格特点2

speech_style: |
 说话风格描述
 常用词汇
 句式特点

background: 背景故事
motivation: 动机/目标

relationships:
  其他角色名: 关系描述

chapters:
  - ch01
  - ch02

notes: 备注
```

## 创建角色

使用 CLI 命令创建角色，不要直接编辑 YAML：

```bash
author character add --id <id> --name <姓名> --role <角色类型>
author character update <id> --field <字段> --value <值>
author character note <id> --chapter <章节> --text <备注>
```
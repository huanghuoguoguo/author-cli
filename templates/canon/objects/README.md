# 物品设定目录

存放物品/道具的 YAML 设定文件。

## 文件命名

使用物品 ID 作为文件名：`<物品id>.yaml`

## YAML 格式

```yaml
name: 物品名称
type: 物品类型（道具、武器、信物、日常用品）

description: 物品描述
currentHolder: 当前持有者（角色id）

rank: 品阶/等级（玄幻）
numericStats: 数值属性
symbolism: 象征意义

firstAppearance: ch01
chapters:
  - ch01
  - ch02

notes: 备注
```

## 创建物品

```bash
author object add --id <id> --name <名称> --type <类型>
author object update <id> --field <字段> --value <值>
```
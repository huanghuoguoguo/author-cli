# 地点设定目录

存放地点/空间的 YAML 设定文件。

## 文件命名

使用地点 ID 作为文件名：`<地点id>.yaml`

示例：
- `office.yaml` - 办公室
- `home.yaml` - 主角住所
- `city.yaml` - 城市

## YAML 格式

```yaml
name: 地点名称
type: 地点类型（建筑、自然、区域）

description: 地点描述
slugline: 场景标题（剧本模式）

sensoryVisual: 视觉描写
sensoryAudio: 听觉描写
sensorySmell: 嗅觉/触觉描写
mood: 氛围
dangerLevel: 危险等级（可选）

chapters:
  - ch01
  - ch02

notes: 备注
```

## 创建地点

```bash
author location add --id <id> --name <名称>
author location update <id> --field <字段> --value <值>
author location note <id> --chapter <章节> --text <备注>
```
# 剧情大纲目录

存放剧情大纲的 YAML 文件。

## 文件命名

- `outline.yaml` - 主大纲文件

## YAML 格式

```yaml
title: 作品标题
genre: 类型
time_span: 时间跨度

chapters:
  ch01:
    title: 章节标题
    summary: 情节概要（50-100字）
    word_count: 目标字数
    status: planned | drafted | revised | final

  ch02:
    title: ...
    ...

foreshadowing:
  - id: foreshadow-01
    description: 伏笔描述
    setupChapter: ch01
    payoffChapter: ch05
    status: open | resolved
```

## 大纲操作

```bash
author outline add-chapter --id <id> --title <标题>
author outline update-chapter <id> --field <字段> --value <值>
author chapter add --id <id> --title <标题>  # 推荐，同时创建大纲和正文文件
```
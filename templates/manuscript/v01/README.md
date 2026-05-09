# 章节正文目录

存放章节正文 Markdown 文件。

## 文件命名

格式：`ch<章节号>.md`

示例：
- `ch01.md` - 第一章
- `ch02.md` - 第二章
- `ch10.md` - 第十章

## Markdown 格式

章节正文直接写内容，不需要标题行（标题在大纲中定义）：

```markdown
正文内容从这里开始...

对话用自然格式：
"你好，"他说。

场景描写、心理活动、动作等...

段落之间空一行。
```

## 管理章节

```bash
# 创建章节（同时创建大纲条目和正文文件）
author chapter add --id ch011 --title "第十一章"

# 删除章节
author chapter delete ch011

# 查看章节列表
author chapter list
```

## 直接编辑

章节正文可以直接编辑（不同于 canon 设定需要通过 CLI）。
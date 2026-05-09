# 生成输出目录

存放 CLI 生成的上下文文件。此目录可删除重建。

## 目录结构

```
generated/
├ context/
│   ch001.md    # 章节写作上下文
│   ch002.md
│   ...
├ canon-overview.md  # canon 总览
└ style-sample.md    # 写作风格样本（导入时生成）
```

## 生成命令

```bash
# 生成章节上下文
author render context --chapter ch001

# 生成 canon 总览
author render canon

# 生成角色详情
author render character <角色id>
```

## 注意

此目录内容是自动生成的，可以随时删除并重新生成。
不要直接编辑此目录下的文件。
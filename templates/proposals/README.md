# 提案目录

存放 AI 从章节正文提取的 canon 变更建议。

## 目录结构

```
proposals/
├ canon-suggestions/
│   proposal-YYYYMMDD-chXXX.yaml  # 从章节提取的建议
└ README.md
```

## 工作流程

1. **生成建议**
   ```bash
   author suggest --chapter ch011
   ```
   分析章节正文，提取可能的新角色、新地点、设定变更等，生成提案文件。

2. **审核提案**
   ```bash
   author proposal list
   author proposal show <proposal-id>
   ```
   查看提案内容，判断是否合理。

3. **应用或拒绝**
   ```bash
   author proposal apply <proposal-id>   # 写入 canon
   author proposal reject <proposal-id>  # 删除提案
   ```

## 提案状态

- `pending` - 待审核
- `applied` - 已应用
- `rejected` - 已拒绝

## 注意

建议审核后再 apply，避免 AI 误判导致 canon 数据混乱。
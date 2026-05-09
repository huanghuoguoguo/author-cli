# 写作规则目录

存放写作规则的 YAML 文件。规则会在写作时注入上下文，指导 AI 遵守。

## 文件命名

- `writing-style.yaml` - 写作风格规则
- `restrictions.yaml` - 禁止事项
- 其他自定义规则

## YAML 格式

```yaml
id: writing-style
name: 写作风格
description: |
  写作风格描述
  
  叙事特点：
  - 第一人称/第三人称
  - 口语化/书面语
  - 简洁/华丽
  
  禁忌：
  - 不用"然而""不禁""竟然"
  - 不写某类内容
  
  对话风格：
  - 角色1: ...
  - 角色2: ...

priority: 1  # 优先级（数字越小越优先）
```

## 规则生效顺序

规则按 priority 从小到大注入上下文，priority 相同时按文件名排序。

## 管理规则

```bash
author rules add --id <id> --name <名称>
author rules update <id> --field description --value <描述>
```
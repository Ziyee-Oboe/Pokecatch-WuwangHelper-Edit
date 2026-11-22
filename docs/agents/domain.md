# 领域文档

Engineering skills 探索 codebase 时，应如何消费这个 repo 的 domain documentation。

## 探索前先读取这些

- repo 根目录的 **`GLOSSARY.md`**
- **`docs/adr/`**：读取与你即将处理区域相关的 ADRs

如果这些文件不存在，**静默继续**。不要标记缺失；不要提前建议创建。

## 文件结构

这是 single-context repo：

```
/
├── AGENTS.md
├── GLOSSARY.md
├── docs/
│   ├── adr/                    ← 架构决策记录
│   └── agents/                 ← engineering skills 配置
├── pcg-extension/              ← 原插件源码（Chrome 扩展）
├── pcg-request-analysis/      ← 请求消耗分析报告
└── .scratch/                   ← local-markdown issue tracker
```

## 使用 glossary 的词汇

当你的输出命名某个 domain concept 时（issue title、refactor proposal、hypothesis、test name），使用 `GLOSSARY.md` 中定义的 term。不要漂移到 glossary 明确避免的 synonyms。

如果你需要的概念还不在 glossary 中，这是一个信号：要么你正在发明项目没有使用的语言（重新考虑），要么确实存在缺口（为 `/domain-modeling` 记录）。

## 标记 ADR 冲突

如果你的输出与现有 ADR 矛盾，明确指出，而不是静默覆盖：

> _Contradicts ADR-0007 (event-sourced orders), but worth reopening because…_

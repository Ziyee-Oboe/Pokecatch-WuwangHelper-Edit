# AGENTS.md

> 此文件记录对本仓库工作的 Engineering Agents 的项目特定说明。

## 仓库概览

这个仓库服务于两个工作流：

1. **Poke'Catch Online 辅助工具开发** — 原 Chrome 扩展代码在 `pcg-extension/`，我们在做的油猴脚本是新的独立产物（还没落地）
2. **分析报告** — `pcg-request-analysis/` 是一次性产出；未来的研究输出也可以放根目录或 `reports/`

```
├── AGENTS.md                  ← 本文件
├── GLOSSARY.md                ← 领域术语表
├── .gitignore
├── docs/
│   ├── adr/                   ← 架构决策记录
│   └── agents/                ← engineering skills 配置
│       ├── issue-tracker.md
│       └── domain.md
├── pcg-extension/             ← 原插件源码（只读参考）
├── pcg-request-analysis/     ← 2026-11 的请求消耗分析报告
├── .scratch/                  ← local-markdown issue tracker
└── （未来的油猴脚本 *.user.js）
```

## 原插件代码只读

`pcg-extension/` 是原插件作者的代码，**我们只参考它的逻辑和数据**，不修改原文件。油猴脚本是独立的新产物。

## 存档访问模式

游戏存档是浏览器 `localStorage['gachamon-save-v1']`，JSON 格式。插件和油猴脚本都只读这个键，不写入。关键字段：

- `trainer.since` / `trainer.id` → `trainerSeed = since + ':' + id`（哈希种子）
- `pension.laid` → 下一颗蛋的序号 k（递增长整数）
- `pension.bx` → 下一颗是否喂过靛莓果（阈值 ×2）
- `pension.mons[]` → 亲代池（含 shiny / sp 标记）

## Agent skills

### Issue tracker

Issues 以本地 Markdown 文件形式存放在 `.scratch/<feature>/` 下。详见 `docs/agents/issue-tracker.md`。

### Domain docs

Single-context：根目录 `GLOSSARY.md` + `docs/adr/`。详见 `docs/agents/domain.md`。

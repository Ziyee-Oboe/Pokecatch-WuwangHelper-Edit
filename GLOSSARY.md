# GLOSSARY

> 本项目的领域术语表。engineering skills 在输出中命名概念时，应使用此处定义的 term。

## Poke'Catch Online

| Term | 定义 |
|------|------|
| **PCG** | Poke'Catch Online 的缩写，运行在 pokecatch-online.netlify.app 的纯前端宝可梦探险游戏 |
| **Cloud RPC** | 游戏后端的 Supabase Remote Procedure Call，通过 `fetch` / 页面内 WebSocket 触发 |
| **gachamon-save-v1** | 游戏存档在 `localStorage` 中的键名，JSON 格式 |
| **pension** | 存档里的培育屋子对象，含 `laid`（已产蛋数）、`mons`（亲代池）、`bx`（靛莓果标记） |
| **trainerSeed** | 训练家唯一种子 = `${trainer.since}:${trainer.id}`，用于所有产蛋哈希 |
| **eggHash** | 插件和游戏一致的 53 位确定性哈希函数 |
| **SLOTS** | 游戏配置的 8 个亲代槽位 |
| **HATCH_MS** | 蛋的常规孵化时间 = 4 小时（游戏常量） |
| **SHINY_RATE** | 游戏默认蛋闪光率 = 1/512 |
| **sp 档** | 蛋的 `sp` 字段标记亲代有闪光，此时阈值提升到 1/16 |
| **bx 档** | 蛋的 `bx` 字段标记下一颗已喂靛莓果，阈值 ×2 |

## 插件结构

| Term | 定义 |
|------|------|
| **pcg-extension/** | 原 Chrome 扩展源码目录，v1.49 |
| **page-hook.js** | 注入层：接管 rAF、伪页面可见性、包装 fetch/WS 做观测 |
| **PCG_SAVE** | 扩展里的存档读取器，带 900ms 节流缓存 |
| **PCG_STAB** | 稳定数据表：属性克制、招式威力、宝可梦中文名 |
| **PCG_HUD** | 统一悬浮看板（可拖动折叠） |
| **autoHatch / berryTick** | 自动化操作模块（催蛋、吃果），默认关闭 |
| **nextShinyInfo()** | 核心预测函数：纯数学哈希扫描，零网络 |
| **intervalMs / intervalSec** | 各循环模块的心跳间隔参数 |

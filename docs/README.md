# MRDI Portal · 项目文档

> 这层目录是项目的"长期记忆"。Sprint 之后的改版依据都在这里。
> **当前基线**：[VERSION.md v1.1-baseline (2026-07-17)](../VERSION.md)
> **当前 Sprint**：Sprint 2 启动前夜（07-20 开跑）

## ⚠️ 待拍板

- **[鉴权路线决策]** ADR-0005 vs AUTH_HYBRID_PRD — 见 [CHANGELOG.md 变更单 2026-07-17-01](./CHANGELOG.md)，截止 2026-07-31
- 决策前：`packages/teams-notify-sdk` **冻结中，不接入 4 API**

## 📚 主文档

| 文件 | 受众 | 何时读 | 内容 |
|------|------|--------|------|
| **[MASTER_PLAN.md](./MASTER_PLAN.md)** | 全员 / 执行基线 | **每周开工前** | Sprint 2-4 按周任务表 / 资源预算 / 变更控制（**行动基线**）|
| **[TOP_LEVEL_PLAN.md](./TOP_LEVEL_PLAN.md)** | 全员 / Sprint 计划 | Sprint 启动 / 跨 Sprint 沟通 | Sprint 2-4 路线图、任务分配、行动项 |
| **[TOP_LEVEL_DESIGN.md](./TOP_LEVEL_DESIGN.md)** | 全员 / 架构 review / 新人 | Sprint 计划 / Code review | 4 个 API + Portal 的设计逻辑、数据流、ADR |
| [CHANGELOG.md](./CHANGELOG.md) 🆕 | 全员 | 变更发生时 | 所有 scope 变更单（MASTER_PLAN §十 要求）|
| [ARCHITECTURE_PLAN.md](./ARCHITECTURE_PLAN.md) | 架构师 / Tech Lead | 合并/拆分决策时 | 演进路径：4 服务 → 3 服务 → 2 服务 |
| [TEST_REPORT_v3.md](./TEST_REPORT_v3.md) | 全员 / QA | 每次 sprint 末 | Sprint 2 集成测试报告（6/6 PASS）|
| [ADR/](./ADR/) | 全员 | 重大架构决策 review | 5 个已落地的架构决策 |
| [../VERSION.md](../VERSION.md) | 全员 | 跨 Sprint 沟通基线 | v1.1-baseline 状态快照（5 系统完成度 + 已知缺口）|

## 📦 归档（V1.0 / V2.1 详细设计稿 · 2026-07-15）

> 后续开发的依据。Sprint 1 MVP 实现与这些稿子有 3 处简化（详见 TOP_LEVEL_DESIGN.md §1.4）

| 子系统 | 目录 | 文档数 | 关键文件 |
|--------|------|--------|----------|
| **CIM-RMS** | [archive/cim-rms-v1.0/](./archive/cim-rms-v1.0/) | 12 份 | 系统逻辑 / 状态机 / SLA / 数据库 / API |
| **CIM-IMS** | [archive/cim-ims-v1.0/](./archive/cim-ims-v1.0/) | 12 份 | API规约 / 状态机 / SLA / 数据库 Schema |
| **MDM** | [archive/mdm-v2.1/](./archive/mdm-v2.1/) | 4 份 + 1 份变更说明 | 系统逻辑 / 开发交接 / 前端设计 / **V2.2 变更说明**（v2.1 已实施为 v2.2，差异见 `MDM-V2.2-变更说明.md`）|
| **cim-perm** | [archive/cim-perm-v1.0/](./archive/cim-perm-v1.0/) | 6 份 | 系统逻辑 / 开发实现 / Mock 数据规范 / 前端设计 |

## 阅读顺序（新人 onboarding）

1. **第 1 步**：`../VERSION.md`（5 分钟）— 知道现在跑的是什么
2. **第 2 步**：`MASTER_PLAN.md`（20 分钟）— 知道接下来 12 周做什么
3. **第 3 步**：`TOP_LEVEL_DESIGN.md`（30 分钟）— 知道为什么这样设计
4. **第 4 步**：`ARCHITECTURE_PLAN.md`（15 分钟）— 知道未来怎么走
5. **第 5 步**：源代码 `../src/` 配合 `TOP_LEVEL_DESIGN.md` 第 3 节读

## 文档关系

```
MASTER_PLAN.md          ← 行动基线（按周）
    │
    ├──→ TOP_LEVEL_PLAN.md   （按 Sprint 规划）
    ├──→ TOP_LEVEL_DESIGN.md （设计逻辑）
    ├──→ ARCHITECTURE_PLAN.md（合并策略）
    ├──→ ADR/                （架构决策）
    ├──→ TEST_REPORT_v3.md   （测试报告）
    └──→ archive/             （V1.0 详细稿）
```

**冲突优先级**：MASTER_PLAN > 其他。如有冲突，**改 MASTER_PLAN，其他文档 sprint 末同步**。

## 文档维护规则

- **每个 Sprint 末 review 一次**：sprint 结束前 1 天，架构师通读 `TOP_LEVEL_DESIGN.md`，把过时的描述更新
- **每周五更新 MASTER_PLAN**：根据本周进度调整下周任务
- **重大架构变更必加 ADR**：在 `ADR/` 目录新增
- **版本快照**：每次"基线定版"（Sprint 1 / V1.0 / V2.0）后更新 `../VERSION.md`
- **演进路径变更**：只在 `ARCHITECTURE_PLAN.md` 改
- **变更单记录**：scope 变更写在 `CHANGELOG.md` 末尾

## 文档不允许包含

- ❌ 临时测试代码（`test-*.js` 等已 gitignore）
- ❌ 个人 debug 笔记
- ❌ 过期 ≥ 3 个月的 API 列表
- ❌ 与代码不一致的"伪代码"示例

如果发现以上内容，**立即删/改**。

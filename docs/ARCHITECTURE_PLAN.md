# MRDI Portal 整体架构规划

> 状态：Sprint 1 MVP 落地后复盘  
> 范围：4 个 Fastify API + PostgreSQL + Redis + 前端 Portal 的演进路线  
> 决策点：什么时候保持分离、什么时候合并、怎么合并

---

## 1. 当前架构基线 (Sprint 1 MVP)

### 1.1 容器清单

| 容器 | 镜像 | 端口 | 角色 |
|------|------|------|------|
| `mrdi-postgres` | postgres:16-alpine | 5432 | 共享数据 (4 schema: mdm / cimrms / cimims / cimperm) |
| `mrdi-redis` | redis:7-alpine | 6379 | 缓存 / 会话 / 限流 |
| `mdm-api` | mrdi/mdm-api | 3000 | 主数据管理 + 用户认证 |
| `cimrms-api` | mrdi/cimrms-api | 3001 | Normal Change 需求工作流 |
| `cimims-api` | mrdi/cimims-api | 3002 | 報案/工單（DR 战备级） |
| `cim-perm-api` | mrdi/cim-perm-api | 3003 | 细粒度权限管理 |
| `mrdi-portal` | nginx + SPA | 8089 | 前端统一入口 |

**总计：** 7 容器 · 镜像 ~7.7 GB · 运行时内存 ~2 GB

### 1.2 4 个 API 的本质区别

不是技术栈的差异（都是 Fastify 4 + Prisma 5 + PostgreSQL），而是**业务边界的差异**：

| 维度 | mdm-api | cimrms-api | cimims-api | cim-perm-api |
|------|---------|-----------|-----------|-------------|
| 业务定位 | 基础设施 | 业务工作流 | 战备系统 | 基础设施 |
| 客户群 | 所有系统 | Mfg + PIE | Mfg + IT + Security | 所有 API |
| 数据量 | 小 (千行) | 中 (万行) | 大 (十万行+ 告警/工單) | 极小 (百行) |
| 部署频率 | 季度 | 周 | 季度 (DR 限制) | 半年 |
| SLA 目标 | 99.5% | 99.0% | **99.9% (DR)** | 99.5% |
| DB schema | `mdm` | `cimrms` | `cimims` | `cimperm` |
| Owner | CIM 平台 | CIM 业务 | CIM 战备 | CIM 平台 |
| 是否可降级 | 否 | 是 | **绝对不能** | 否 |

---

## 2. 三条演进路径

### 路径 A — 保持现状（4 服务独立）

**适用条件：** Sprint 1–2 MVP 阶段 · 团队边界清晰 · DR 隔离要求硬性

```
postgres  redis
   │        │
   └───┬────┘
       │
   ┌───┴────┬────────┬────────┐
   │        │        │        │
 mdm-api  cimrms   cimims   cim-perm
   3000    3001     3002      3003
```

**优势：**
- 独立扩缩容（mdm-api 流量大就多开几个 container）
- 独立部署周期（**CIM-IMS 是 DR 战备系统，更新频率必须低**）
- 故障隔离（一个崩不全崩，特别是 CIM-IMS 不能被 CIM-RMS 拖死）
- 团队 ownership 清晰
- DB schema 已经按服务隔离，将来可拆 4 个独立 DB

**代价：**
- 4 个 Dockerfile 要维护
- 跨服务调用（cimrms 调 mdm 查权限）有 HTTP 开销（~1–3 ms P99）
- Docker Desktop 看着"挤"
- 每个服务要单独监控 / 日志 / 备份

---

### 路径 B — 合并为 1 个 API（Modular Monolith）

**适用条件：** 跨服务调用成为瓶颈 · 团队 < 4 人 · 部署总是同步 · DB 永远不拆

```
postgres  redis
   │        │
   └───┬────┘
       │
   unified-api
   /mdm-api/*
   /cimrms-api/*
   /cimims-api/*
   /perm-api/*
   3000
```

**优势：**
- 部署单元只有 1 个
- 跨 module 数据访问无需 HTTP（直接函数调用）
- 运维简单：监控 / 日志 / 备份 1 套
- 内存占用降 60%（1 个 node_modules vs 4 个）

**代价：**
- 1 个 bug 崩全系统
- 部署粒度粗（改一行 perm 代码也要重启所有 API）
- merge conflict 风险高
- DR 隔离破坏（CIM-IMS 跟着 CIM-RMS 一起重启）
- 失去独立扩缩容能力

---

### 路径 C — 渐进式合并（推荐）

**适用条件：** 现在规划，未来 12–18 个月内分阶段执行

**阶段规划：**

| 阶段 | 时间窗口 | 动作 | 状态 |
|------|----------|------|------|
| **C0** | 现在 | 4 服务独立（路径 A） | ✅ 已落地 |
| **C1** | Sprint 3–4 | 把 mdm-api + cim-perm-api 合并为「平台基础服务」（都是基础设施类，部署频率低） | 待执行 |
| **C2** | Sprint 5+ | 再决定 cimrms-api 是否并入（业务接近，部署频率接近时） | 待评估 |
| **C3** | Sprint 7+ | **CIM-IMS 保持独立**（DR 战备，永远不合并） | 永久保留 |

**最终目标态：** **2 服务**（平台基础 + 业务工作流）+ **1 个 DR 战备系统**

```
postgres  redis
   │        │
   └───┬────┘
       │
   ┌───┴────────┐
   │            │
platform-api  cimims-api   ← 战备系统永远独立
   3000        3002
   /mdm-api/*
   /perm-api/*
   /cimrms-api/*
```

**优势：**
- 不一次性承担技术债
- 业务节奏不变
- 每一步可回退
- 满足「分久必合」但「DR 永远独立」的混合目标

---

## 3. 决策依据

### 3.1 合并的信号（任一出现就考虑合并）

- [ ] 跨服务调用 P99 延迟 > 50 ms
- [ ] 4 个服务的代码贡献者总和 < 4 人
- [ ] 4 个服务总是同时发布（耦合太紧）
- [ ] docker-compose.yml 6 个月没人改
- [ ] 总容器内存占用超过开发机内存的 50%
- [ ] 跨服务调用次数 / 总请求数 > 30%
- [ ] **账号体系 / 鉴权逻辑稳定可复用**（见 ADR-0005，MDM 独立承担后基础设施类服务可加速合并）

### 3.2 保持分离的信号（任一出现就不合并）

- [x] 不同 SLA 等级（99.9% vs 99.0%）
- [x] 不同部署频率（季度 vs 周）
- [x] DR / BCP 隔离需求
- [x] 团队边界清晰
- [x] 数据库逻辑上可拆

**当前 4 个服务都命中 3.2 全部条件 → 现在不合并。**

---

## 4. 我建议的路径：路径 C（渐进式合并）

### 4.1 为什么不是路径 B（一刀切）？

- **DR 战备系统不能合并**：CIM-IMS 是 DR-style，必须能独立 failover。一旦合并进 monolith，cimrms 的一次 OOM 就会击穿 cimims
- **业务边界还在演变**：Sprint 1 MVP 刚跑通，业务流程还没稳定。现在合并 = 把"临时状态"固化成架构
- **团队 ownership 还在分**：CIM-RMS 和 CIM-IMS 是两组人维护，合并后 merge conflict 会爆炸

### 4.2 为什么不是路径 A（永远不合并）？

- 基础设施类服务（mdm + cim-perm）确实会越来越相似，重复维护是浪费
- 12–18 个月后，业务稳定了，团队也会调整
- 「永远分离」会让 ops 成本无限增长

### 4.3 触发合并的具体指标

| 指标 | 阈值 | 测量方式 |
|------|------|----------|
| mdm-api ↔ cim-perm-api 调用次数 / 天 | > 1000 | API 网关日志 |
| mdm-api + cim-perm-api 部署次数 / 月 | < 2 | CI/CD 日志 |
| 两个服务共同开发者占比 | > 50% | git log |
| 两个服务代码重复度 | > 30% | 静态分析 |

三个指标同时命中就启动 C1 合并。

---

## 5. 现在已经做对的准备（合并成本接近 0）

| 准备 | 状态 | 合并时的实际改动 |
|------|------|------------------|
| Monorepo 结构 | ✅ | 业务代码 0 改动 |
| 共享 packages (errors/duration/enums) | ✅ | 0 改动 |
| 统一 Docker 基础镜像 (node:22-bullseye) | ✅ | 1 个 Dockerfile 替代 4 个 |
| PostgreSQL 按 schema 隔离 | ✅ | 将来可拆库（独立 DB 仍兼容） |
| 路径前缀路由 (`/mdm-api/*`, `/cimrms-api/*`) | ✅ | 合并后 0 改动 |
| 统一 JWT secret + auth 协议 | ✅ | 0 改动 |
| 统一 Prisma 版本（5.22.0） | ✅ | 0 改动 |

**未来合并的实际工程量：**
- Dockerfile: 4 → 1（删 3 个）
- docker-compose: 4 services → 1 service
- 业务代码: **0 改动**（已经是 monorepo）
- 部署脚本: 4 → 1

也就是说：**未来合并的成本是 1–2 个 Sprint，提前 1 年做准备是 0 成本。**

---

## 6. 立即可做的事（为未来铺路，不增加当前复杂度）

### P1（建议本 Sprint 内做）

1. **加 path-prefix nginx proxy**（Portal 内）
   - `/mdm-api/*` → `http://mdm-api:3000`
   - `/cimrms-api/*` → `http://cimrms-api:3001`
   - `/cimims-api/*` → `http://cimims-api:3002`
   - `/perm-api/*` → `http://cim-perm-api:3003`
   - **收益**：Portal 容器内也能用容器名调 API，跨网络零配置

2. **统一健康检查端点**
   - 每个 API: `GET /health` + `GET /ready`（DB 连接性）
   - 聚合: `GET /api-status`（Portal 调一次拿全部状态）
   - **收益**：监控大盘 1 套配置搞定

### P2（下个 Sprint 做）

3. **统一 pino 日志格式**
   - 4 个服务用同一套 logger config
   - 合并后不需要重新搭日志系统
   - **收益**：未来合并零成本

4. **OpenAPI 规范导出**
   - 每个 API 暴露 `/docs` (Swagger UI)
   - **收益**：前端对接零成本 / API 治理基础

### P3（按需）

5. **集成测试 fixture**
   - 共享 test database setup
   - 4 个服务的契约测试
   - **收益**：合并后回归测试一次过

6. **CI 流水线并行 build**
   - 现在：4 个镜像顺序 build（4 × 30s = 2min）
   - 优化：并行（30s）
   - **收益**：开发体验提升

---

## 7. 风险登记

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| Sprint 2 业务变化大需要重写 | 中 | 高 | monorepo 结构 + 模块化路径前缀，重写成本低 |
| CIM-IMS 被降级为非 DR | 低 | 高 | 架构决策写入 ADR，跨团队对齐 |
| 团队从 4 人涨到 12 人 | 中 | 中 | 微服务边界反而更清晰，可考虑路径 A 长期化 |
| PostgreSQL 单点 | 中 | 高 | 已有 docker volume，未来加 replica 即可 |
| 跨服务鉴权 token 失效 | 低 | 中 | 统一 JWT secret + mdm-api 鉴权协议已对齐(ADR-0005) |

---

## 8. 总结

| 维度 | 现在 | 12 个月后 | 24 个月后 |
|------|------|-----------|-----------|
| 服务数 | 4 | 3 (mdm+perm 合并) | 2 (cimrms 也合入) |
| 容器数 | 7 | 6 | 5 |
| DB | 1 (4 schema) | 1 (4 schema) | 1 (4 schema) or 2 (DR 拆) |
| 前端 Portal | 1 | 1 | 1 |
| CI/CD 流水线 | 4 build | 3 build | 2 build |
| 监控面板 | 1 套 | 1 套 | 1 套 |
| 团队规模假设 | 2-4 人 | 4-6 人 | 6-10 人 |

**核心原则：**
1. **DR 战备系统永远独立**（CIM-IMS 不合并）
2. **基础设施类先合**（mdm + cim-perm）
3. **业务类后合**（cimrms 视情况）
4. **合并成本接近 0**（monorepo 准备已就位）
5. **数据驱动决策**（按 3.1 指标触发，不靠感觉）

---

*最后更新：2026-07-16 · Sprint 1 MVP 落地后*

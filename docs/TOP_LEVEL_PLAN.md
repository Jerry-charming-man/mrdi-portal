# MRDI Portal Monorepo · 项目顶层规划

> **版本**：v1.0 · 2026-07-16
> **范围**：40-Minimax/Portal 下 5 个业务系统(mrdi-portal / mrdi-mdm / cim-rms / cim-ims / cim-perm)
> **基线**：Sprint 1 MVP 已落地(7 容器全部健康,见 `TEST_REPORT_v2.md`)
> **作者**：Jerry(架构) + Mavis(实施协助)

---

## 〇、TL;DR

5 个业务系统,**Sprint 1 MVP 已全部跑起来**(7 容器 healthy),接下来 3 个 Sprint 把 Sprint 1 留下的 Critical/High bug 收掉、再上 Sprint 2 的实时推送 + RBAC。

| 维度 | 现状 | Sprint 3 结束目标 |
|------|------|------------------|
| 容器数 | 7 | 7(不变) |
| API 服务 | 4 个独立 Fastify | 4 个独立 Fastify |
| 前端 | 1 SPA(8089) | 1 SPA(8089) |
| DB | 1 PG / 4 schema | 1 PG / 4 schema |
| 关键能力 | REST CRUD + 状态机 | + 实时推送 + RBAC + 通知 |
| 测试覆盖 | API 层 80% | API + 集成 90% |
| 已知 Critical bug | 4 个 | 0 个 |

**核心约束(写死在所有 Sprint 里)**:
1. **路径前缀路由**(`/mdm-api/*`, `/cimrms-api/*`, `/cimims-api/*`, `/perm-api/*`)—— 子域名 DNS 不可解析
2. **本机 Docker 优先**—— 验收 OK 再推 vm-jerry-dev-01
3. **CIM-IMS 永远不合并**—— DR 战备系统,独立 failover
4. **统一技术栈**—— Fastify 4 + Prisma 5 + Zod + PostgreSQL 16 + Redis 7
5. **鉴权走 C 方案**—— M365 OAuth 主 + MDM 账号密码应急;dev 账号密码主入口(详见 `ADR/0006-auth-hybrid-c.md`;`ADR-0005` 已 Superseded)

---

## 一、现状盘点(2026-07-16)

### 1.1 容器清单 ✅

| 容器 | 端口 | 镜像 | 状态 |
|------|------|------|------|
| `mrdi-postgres` | 5432 | postgres:16-alpine | ✅ healthy |
| `mrdi-redis` | 6379 | redis:7-alpine | ✅ healthy |
| `mdm-api` | 3000 | mrdi/mdm-api | ✅ healthy |
| `cimrms-api` | 3001 | mrdi/cimrms-api | ✅ healthy |
| `cimims-api` | 3002 | mrdi/cimims-api | ✅ healthy |
| `cim-perm-api` | 3003 | mrdi/cim-perm-api | ✅ healthy |
| `mrdi-portal` | 8089 | nginx + SPA | ✅ Up |

### 1.2 业务系统成熟度

| 系统 | 后端 | 前端 | 状态 | 文档 |
|------|------|------|------|------|
| **mrdi-portal** | — | ✅ Vite + React 19 + TS + Tailwind | 已部署 | `mrdi-portal/BUG_ISSUES.md` |
| **mrdi-mdm** | ✅ Fastify + Prisma | ✅ 10 页面 | 7 个 API(缺 /v1/roles) | `mrdi-mdm/*.md` |
| **cim-rms** | ✅ Fastify + Prisma | ✅ 9 页面 | 25 个 API,字段对齐 | `cim-rms/*.md` |
| **cim-ims** | ✅ Fastify + Prisma | ✅ 9 页面 | 32 个 API,字段对齐 | `cim-ims/*.md` |
| **cim-perm** | ✅ Fastify + Prisma | ✅ 9 页面(从 MSW 切真) | 15 个 API,字段对齐 | `cim-perm/*.md` |

### 1.3 已知问题优先级

详见 `TEST_REPORT_v2.md` 第五节,简版:

| 等级 | 数量 | 代表 |
|------|------|------|
| 🔴 Critical | 4 | `/v1/roles` 缺、`/auth/me` 路径错、Dashboard 布局、Header badge 写死 |
| 🟡 High | 6 | MDM 页面全 Mock、SPC 导出、告警状态联动、班次交接、Dashboard sparkline |
| ⚪ Medium | 5 | KPI 轮询、WebSocket、RBAC、i18n、通知脱敏 |

### 1.4 共享包

| 包 | 状态 | 内容 |
|----|------|------|
| `@mrdi/shared` | ✅ 已有 | types / errors / duration / enums / mdm-client(待补) / **password(Sprint 2 加)** |
| `@mrdi/ui` | ✅ 已有(雏形) | tailwind-preset / cn utils;**组件未抽** |

---

## 二、目标态(2026-09-30 / Sprint 3 结束)

### 2.1 业务能力

| 能力 | Sprint 1 | Sprint 2 | Sprint 3 |
|------|----------|----------|----------|
| REST CRUD | ✅ | ✅ | ✅ |
| 状态机 | ✅ | ✅ | ✅ |
| SLA 监控 | ✅ RMS / IMS | ✅ PERM | ✅ |
| RBAC | ❌ | ✅ 角色 + 资源级 | ✅ 完整 |
| 通知(站内信) | ❌ | ✅ MDM 收口 | ✅ |
| 实时推送(WebSocket) | ❌ | ❌ | ✅ Dashboard KPI |
| 审计日志聚合 | ❌ | ❌ | ✅ 跨服务查询 |
| i18n | ❌ | 🟡 简体 | ✅ 繁中 + 英文 |
| **MDM 登录(密码方案)** | 🟡 dev_login 临时 | ✅ **生产正式** | ✅ 完整(改密/重置/解锁/审计) |

### 2.2 非功能目标

| 维度 | 当前 | 目标 |
|------|------|------|
| API P99 延迟 | 未测 | < 200 ms |
| 跨服务调用 P99 | 未测 | < 50 ms |
| 容器内存总和 | ~2 GB | ≤ 2.5 GB |
| 测试覆盖率 | 估 30% | API 80% / 集成 60% |
| 文档完整度 | 70% | 90% |
| 部署到 vm-jerry-dev-01 | ❌ 仅本地 | ✅ Sprint 3 末 |

### 2.3 不做什么(明确划界)

- ❌ **不拆 DB**——单 PG 多 schema 已够,拆库是 2027+ 议题
- ❌ **不换 ORM**——Prisma 5 锁死,别再讨论
- ❌ **不合并 cim-ims-api**——DR 战备,永远独立
- ❌ **不引入 Kubernetes**——Docker Compose + vm-jerry-dev-01 已够用
- ❌ **不接 Microsoft Teams webhook**——等 v2.0,先做站内信
- ❌ **不搞多租户**——单租户 MRDI,部门级隔离足够

---

## 三、Sprint 拆分(12 周 / 3 Sprint)

### 3.1 时间表

| Sprint | 时间 | 主题 | 验收 |
|--------|------|------|------|
| **Sprint 2** | W5–W7(07-20 ~ 08-08) | 修 Critical + High + RBAC 雏形 | 4 个 Critical 修完;6 个 High 修完 4 个;RBAC 角色级生效 |
| **Sprint 3** | W8–W11(08-11 ~ 09-05) | 实时推送 + 通知 + 完整 RBAC + 账号管理 UI | WebSocket KPI 推送;站内信;资源级权限;Admin 改密/重置/解锁 UI |
| **Sprint 3.5** | W12(09-08 ~ 09-12) | 验收 + 推 vm-jerry-dev-01 | staging 跑通;UAT 准备 |
| **Sprint 4** | W13–W16(09-15 ~ 10-10) | i18n + 审计聚合 + 性能优化 | 繁中 / 英文;跨服务审计;P99 < 200ms |

### 3.2 Sprint 2 详细任务(3 周 / 15 人日)

#### Week 1(07-20 ~ 07-24)— 修 Critical

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S2-1 | mdm-api 补 `GET /v1/roles` | 后端 | 1 endpoint + Prisma query |
| S2-2 | cimrms service `/auth/me` 改 `/v1/auth/me` | 前端 | 1 service 改路径 |
| S2-3 | Portal Dashboard 三栏布局 | 前端 | `Dashboard.tsx` 重构 |
| S2-4 | Portal Header 告警 badge 动态 | 前端 | Zustand store + 轮询 |

#### Week 2(07-27 ~ 07-31)— 修 High(部分)

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S2-5 | MDM Dashboard / Users 接真实 API | 前端 | 替换 mock |
| S2-6 | SPC CSV 导出 + 规则违反 | 前端 | 2 个 handler |
| S2-7 | 告警确认/关闭状态联动 | 前端 | Alarms 页面 + store |
| S2-8 | 班次交接通知 | 前端 | Handover + API |

#### Week 3(08-03 ~ 08-08)— RBAC 雏形 + 收口

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S2-9 | 角色级 RBAC(4 个 API 都加) | 后端 | `@fastify/jwt` + middleware |
| S2-10 | `@mrdi/shared` 抽 `permission.guard.ts` | 后端 | 1 共享中间件 |
| S2-11 | `@mrdi/ui` 抽 Badge / StatusBadge / Button / Modal | 前端 | 4 组件 |
| S2-12 | TEST_REPORT_v2 全部 Critical + 4/6 High 关闭 | QA | v3 测试报告 |

**Sprint 2 验收标准**:
- ✅ 4 个 Critical bug 修复
- ✅ 6 个 High 修完 ≥ 4 个
- ✅ 角色级 RBAC 跑通(用 dev login 切换角色测试)
- ✅ `@mrdi/ui` 开始抽组件
- ✅ TEST_REPORT v3 出炉

### 3.3 Sprint 3 详细任务(4 周 / 20 人日)

#### Week 1(08-11 ~ 08-15)— 通知 + 站内信

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S3-1 | MDM 通知中心 backend | 后端 | `notifications` module + BullMQ |
| S3-2 | `@mrdi/shared` 抽 `NotificationClient` | 后端 | 1 client |
| S3-3 | Portal 通知收件箱 UI | 前端 | `/notifications` 页面 + 角标 |

#### Week 2(08-18 ~ 08-22)— WebSocket 实时推送

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S3-4 | Fastify WebSocket plugin 集成 | 后端 | 1 plugin + 4 API 接入 |
| S3-5 | KPI 推送(cimrms / cimims dashboard) | 后端 | 5s 推送 |
| S3-6 | 告警推送(cimims 1s 推送) | 后端 | + 优先级 |
| S3-7 | 前端 WebSocket client + 断线重连 | 前端 | 1 hook + 4 页面接入 |

#### Week 3(08-25 ~ 08-29)— 资源级 RBAC + 账号管理 UI

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S3-8 | 资源级 RBAC(grant / revoke) | 后端 | MDM 完善 + cimrms / cimims 接入 |
| S3-9 | Admin 改密/重置/解锁 UI | 前端 | 3 个 dialog + 1 个用户详情页 |
| S3-10 | 登录审计 + 失败告警 | 后端 | AuditLog 视图 + portal 角标 |

#### Week 4(09-01 ~ 09-05)— 收口 + 文档

| # | 任务 | 负责 | 输出 |
|---|------|------|------|
| S3-11 | 4 个 API Swagger UI 暴露 | 后端 | `/docs` 端点 |
| S3-12 | TEST_REPORT v4(集成测试) | QA | 90% 覆盖 |
| S3-13 | 部署文档更新 | 全员 | `vm-deploy.md` |

**Sprint 3 验收标准**:
- ✅ WebSocket KPI 推送跑通(P99 < 1s)
- ✅ 站内信可发可收
- ✅ 资源级权限 grant / revoke 闭环
- ✅ Admin 改密/重置/解锁 UI 跑通(走 mdm-api,不走外部 IdP)
- ✅ Swagger UI 全部暴露
- ✅ 登录审计可见(谁在何时从哪登录 / 失败 / 锁定)

### 3.4 Sprint 3.5 验收周(09-08 ~ 09-12)

| # | 任务 | 输出 |
|---|------|------|
| S3.5-1 | 推 vm-jerry-dev-01 staging | 7 容器全跑通 |
| S3.5-2 | 跨服务端到端测试 | E2E report |
| S3.5-3 | UAT 准备 | 培训材料 + 录屏 |

### 3.5 Sprint 4 详细任务(4 周 / 20 人日)

> **启动日期**：2026-07-20（比原计划 09-15 提前 8 周）

| # | 任务 | 输出 |
|---|------|------|
| S4-1 | i18n 框架接入 | react-i18next + 简体/繁中/英文 |
| S4-2 | 4 个 API 错误码 i18n | zh-HK / en-US 资源包 |
| S4-3 | 审计日志跨服务聚合 | MDM `audit` module |
| S4-4 | SQL 慢查询优化 | 索引 review |
| S4-5 | 性能压测 | k6 脚本 + report |
| S4-6 | OpenAPI 导出为前端 types | orval / openapi-typescript |

---

## 四、顶层架构

### 4.1 部署拓扑(vm-jerry-dev-01 staging,2026-09 起)

```
用户浏览器
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│            Caddy (Reverse Proxy + Let's Encrypt)        │
│                                                          │
│   /                  → mrdi-portal:80   (SPA)            │
│   /mdm-api/*         → mdm-api:3000                      │
│   /cimrms-api/*      → cimrms-api:3001                   │
│   /cimims-api/*      → cimims-api:3002                   │
│   /perm-api/*        → cim-perm-api:3003                 │
│   /ws/*              → cimims-api:3002 (WebSocket)       │
└──────────────────────────────────────────────────────────┘
   │
   ▼
┌──────────────────────────────────────────────────────────┐
│              内部网络 (Docker network: internal)         │
│                                                          │
│   postgres (1 实例 / 4 schema)                           │
│   redis    (1 实例 / 多 keyspace)                        │
└──────────────────────────────────────────────────────────┘
```

> **关键约束**: cloudapp 子域名 DNS 不可解析 → **必须 path-prefix**,不准用子域名。
> 来源: 实战踩坑(2026-07),写入长期记忆。

### 4.2 服务清单

| 服务 | 类型 | 容器 | 端口 | 路径前缀 | 状态 |
|------|------|------|------|---------|------|
| portal | SPA | mrdi-portal | 80 | `/` | ✅ |
| mdm-api | Fastify | mdm-api | 3000 | `/mdm-api/*` | ✅ |
| cimrms-api | Fastify | cimrms-api | 3001 | `/cimrms-api/*` | ✅ |
| cimims-api | Fastify | cimims-api | 3002 | `/cimims-api/*` | ✅ |
| cim-perm-api | Fastify | cim-perm-api | 3003 | `/perm-api/*` | ✅ |
| postgres | PG 16 | mrdi-postgres | 5432 | — | ✅ |
| redis | Redis 7 | mrdi-redis | 6379 | — | ✅ |

### 4.3 共享包设计

#### `@mrdi/shared` (后端 4 个 API 共享)

```
packages/shared/src/
├── types/           # 跨服务 type(User, Role, Permission, AuditEvent, ...)
├── errors/          # AppError, NotFoundError, ForbiddenError, InvalidStateTransitionError
├── enums/           # RequestStatus, IncidentStatus, PermissionStatus, RoleCode
├── duration/        # parseDuration / addDuration / formatCountdown
├── validation/      # 通用 Zod schema(pagination, ID, etc.)
├── mdm-client/      # MdmClient(checkPermission, getUser, sendNotification)
├── prisma-client/   # createPrismaClient(schema) 单例封装
├── request-no/      # 业务编号生成(NC-YYYY-NNNN / INC-YYYY-NNNN)
└── permission/      # permissionGuard(角色 / 资源级)
```

#### `@mrdi/ui` (前端 5 个 SPA 共享)

```
packages/ui/src/
├── primitives/      # Button, Input, Select, Textarea, Checkbox
├── layout/          # AppShell, Sidebar, Header, PageContainer
├── feedback/        # Toast, Modal, EmptyState, Skeleton
├── data/            # Table, Pagination, KpiCard
├── status/          # StatusBadge, LevelBadge, UrgencyBadge, TypeBadge
├── time/            # ExpiringCountdown, DurationPicker, RelativeTime
├── charts/          # Sparkline, TrendChart(Sprint 3 抽)
├── nav/             # Breadcrumb, Tabs, Stepper
└── utils/           # cn, formatDate, formatNumber
```

> **抽组件原则**: 出现 2 次以上 + 跨服务复用 → 抽到 `@mrdi/ui`。只在一个服务用的,留在 `mrdi-portal/src/components/`。

### 4.4 依赖关系

```
mrdi-mdm (权限中心,无业务依赖)
    ▲
    │ 调 /mdm-api/v1/permissions/check
    │
cim-rms ─────┐
cim-ims ─────┼── cim-perm
    │        │
    └────────┴── mrdi-portal (纯前端入口,无业务逻辑)
```

> 详见 `规划-后端实现.md` 第四节。

---

## 五、关键决策(写进 ADR)

### 5.1 技术栈锁定

| 维度 | 选型 | 决策依据 | 变更门槛 |
|------|------|---------|---------|
| Web 框架 | Fastify 4 | 性能 + JSON Schema 内置 | 6 个月评审期 |
| ORM | Prisma 5 | 类型安全 + migration | 6 个月评审期 |
| 校验 | Zod 3 | TS 集成 + Fastify type provider | 6 个月评审期 |
| 鉴权 | `@fastify/jwt` | 与 Fastify 集成好 | 12 个月评审期 |
| 任务队列 | BullMQ 5 | Redis 持久化 | 12 个月评审期 |
| 前端框架 | React 19 + Vite 5 | 团队熟悉 | 12 个月评审期 |
| 样式 | Tailwind 3 + preset | MRDI 品牌色集中 | 12 个月评审期 |

### 5.2 合并策略(渐进式 C0-C3)

来自 `docs/ARCHITECTURE_PLAN.md` 第三节:

| 阶段 | 状态 | 说明 |
|------|------|------|
| **C0** 当前 | ✅ Sprint 1 | 4 服务独立 |
| **C1** | 待评审 | mdm-api + cim-perm-api 合并(基础设施类) |
| **C2** | 待评审 | cimrms-api 视情况并入 |
| **C3** | 永久 | CIM-IMS 永远不合并 |

**触发 C1 合并的指标**(3/3 命中才启动):
- [ ] mdm-api ↔ cim-perm-api 调用次数 / 天 > 1000
- [ ] mdm-api + cim-perm-api 部署次数 / 月 < 2
- [ ] 两个服务共同开发者占比 > 50%

> **当前信号**: 调用数低、部署频率差大(季度 vs 半年)、开发者只有 Jerry + Mavis → **不触发 C1**。

### 5.3 安全决策

| 项 | 方案 | 备注 |
|----|------|------|
| 鉴权 | **C 方案:M365 OAuth 主 + MDM 应急**(详见 ADR-0006) | 生产 M365 OAuth / dev 账号密码主入口;不上 TOTP MFA;**满足港府审计 SSO 来源可追溯** |
| Session | JWT in `Authorization: Bearer` | 不放 cookie(防 CSRF) |
| API Key | MDM 签发 / SHA-256 哈希 / `mdm_<prefix>_<random>` | 业务系统调 MDM 用 |
| 密码 | **bcrypt (cost=12)** | 90 天过期;5 次失败锁 15 分钟;首次登录强制改密;**admin 在 MDM 重置**(无 forgot-password 邮件流) |
| dev_login | **admin-only 应急通道** | 必须 `ADMIN_KEY` env 注入;7 天过渡期后永久保留 |
| 审计 | 写操作必写 / 只增不删 / 5 年;LoginAudit 表记录全部登录事件 | 含 IP / user-agent |
| 文件上传 | Sprint 2 后再做 | 当前 4 系统无上传 |
| 速率限制 | `@fastify/rate-limit` | dev 1000/分钟,prod 100/分钟 |

### 5.4 部署决策

| 阶段 | 部署位置 | 触发 |
|------|---------|------|
| 本地开发 | localhost Docker | 始终 |
| Sprint 1–2 | 本地 Docker | 不推 VM |
| Sprint 3 末 | vm-jerry-dev-01 staging | Sprint 3.5 验收 |
| 正式 prod | 待规划(Sprint 5+) | UAT 通过后 |

---

## 六、目录结构(Sprint 2 目标)

```
Portal/
├── docs/                       # 顶层文档
│   ├── ARCHITECTURE_PLAN.md    # 合并策略
│   ├── TOP_LEVEL_PLAN.md       # ★ 本文件
│   ├── DEPLOY.md               # 部署手册(Sprint 3.5 写)
│   ├── ADR/                    # 架构决策记录
│   │   ├── 0001-fastify-stack.md
│   │   ├── 0002-path-prefix-routing.md
│   │   ├── 0003-cim-ims-never-merge.md
│   │   ├── 0004-gradual-merge.md
│   │   └── 0005-mdm-only-auth.md  ← Sprint 2 锁定:鉴权由 MDM 独立承担
│   └── CHANGELOG.md
│
├── packages/
│   ├── shared/                 # @mrdi/shared
│   └── ui/                     # @mrdi/ui
│
├── mdm-api/                    # Fastify + Prisma ✅
├── cimrms-api/                 # Fastify + Prisma ✅
├── cimims-api/                 # Fastify + Prisma ✅
├── cim-perm/                   # 文档目录 + backend(运行中,代码待迁)
│   ├── backend/                # cim-perm-api 代码(短期)
│   ├── scripts/                # schema / seed
│   └── *.md                    # 设计文档
│
├── mrdi-portal/                # 纯前端 SPA ✅
│
├── cim-rms/                    # 文档目录
├── cim-ims/                    # 文档目录
├── mrdi-mdm/                   # 文档目录
│
├── scripts/                    # 仓库根工具脚本
│   ├── init-db.sql             # PG 初始化
│   ├── reset.sh                # 一键重置环境
│   └── seed-all.sh             # 4 schema 灌种子
│
├── docker-compose.yml          # 本机一键起 7 容器 ✅
├── pnpm-workspace.yaml         # ✅
├── package.json                # ✅
├── tsconfig.base.json          # ✅
├── .env.example                # ✅
└── README.md                   # 入口文档(更新中)
```

> **目录清理**:
> - Sprint 2 末把 `cim-perm/backend/src` 迁到根目录 `cim-perm-api/`,与其他 API 命名一致
> - `docs/ADR/` 目录已在 Sprint 2 Week 1 建立(见 ADR-0005)

---

## 七、风险登记

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 密码方案上线后用户登录失败率高 | 中 | 中 | 首次登录强制改密流程清晰;admin 临时密码支持;登录失败详细日志 |
| WebSocket 跨代理掉线 | 中 | 中 | 用 `ws` 库 + ping/pong + 断线指数退避重连 |
| 4 个 API 同步发布踩坑 | 中 | 中 | `@mrdi/shared` 锁版本;OpenAPI diff 校验 |
| PG 单点 | 中 | 高 | docker volume + 每日 pg_dump;replica 留 Sprint 5+ |
| 通知队列积压 | 低 | 中 | BullMQ 监控 + 死信队列 |
| 跨服务鉴权 token 失效 | 低 | 中 | 统一 JWT secret + 8h 过期 + 鉴权协议已对齐(ADR-0005) |
| CIM-IMS 被降级为非 DR | 低 | 高 | ADR-0003 写入,跨团队对齐 |
| 业务方 push 改需求 | 高 | 中 | Sprint 2 锁定 scope,变更走紧急流程 |
| Jerry 时间不足 | 中 | 高 | Mavis 多分担实施;Critical bug 先修,High 排期 |

---

## 八、行动项(本周内 / 立即)

> ⚠️ **本文档是 Sprint 规划视角**；**行动基线以 [`docs/MASTER_PLAN.md`](./MASTER_PLAN.md) 为准**。
> 任何任务调整（包括截止时间推后）以 MASTER_PLAN 为准，本文档 sprint 末同步。

按优先级:

| # | 行动 | 责任 | 截止 | 备注 |
|---|------|------|------|------|
| **A1** | Sprint 2 启动会(对齐 scope + 分配,**新增密码方案**到 scope) | Jerry | 07-17 | 用 MASTER_PLAN §三 |
| **A2** | 修 mdm-api `/v1/roles` 端点 | Mavis | 07-20 | |
| **A3** | 修 cimrms `/auth/me` 路径 | Mavis | 07-20 | |
| **A4** | Portal Dashboard 三栏布局修复 | Mavis | 07-21 | |
| **A5** | Portal Header 告警 badge 动态化 | Mavis | 07-21 | |
| **A6** | ~~建 `docs/ADR/0001-fastify-stack.md`~~ 改为**建 ADR-0005 mdm-only-auth** | Mavis | ✅ 07-16 已完成 | |
| **A7** | ~~建 `docs/ADR/0003-cim-ims-never-merge.md`~~ 合并到 A6 一起做 | Mavis | 07-22 | |
| **A8** | 把 `cim-perm/backend` 迁到 `cim-perm-api/` 根目录 | Mavis | 09-26 | ⚠️ 推后到 Sprint 4 W2 |
| **A9** | `@mrdi/ui` 抽 Badge / Button / Modal / StatusBadge | Mavis | 08-15 | ⚠️ 推后到 Sprint 3 W1 |
| **A10** | 4 个 API 补 Swagger UI 暴露 | Mavis | 09-05 | ⚠️ 推后到 Sprint 3 W4 |
| **A11** | mdm.User 加 7 个密码字段(ADR-0005) | Mavis | ✅ 07-16 已完成 | Sprint 2 已落地 |
| **A12** | `/auth/v1/login` 改造(POST + bcrypt 验证 + 失败锁定) | Mavis | ✅ 07-16 已完成 | Sprint 2 已落地 |
| **A13** | Admin 改密/重置/解锁 API | Mavis | 08-05 | ⚠️ 推到 W3 末;Sprint 2 由 T6b/T8 部分覆盖 |
| **A14** | 旧 `/auth/v1/dev_login` 路由删除 + dev 流程走 login | Mavis | ✅ 07-17 由 T2 替 | dev_login 收紧为 admin-only(`ADMIN_KEY` env) |
| **A15** | 4 API 鉴权中间件统一(`@mrdi/shared/permission`) | Mavis | 08-29 | ⚠️ 推后到 Sprint 3 W3 |
| **T1-T10** | 鉴权 C 方案落地(详见 [AUTH_HYBRID_C_CHECKLIST.md](./Sprint2/AUTH_HYBRID_C_CHECKLIST.md)) | Mavis + Jerry | 08-08 | Sprint 2 W1-W3;5.5 人日 |

---

## 九、文档地图

按阅读顺序:

1. **[`docs/MASTER_PLAN.md`](./MASTER_PLAN.md)** — **行动基线**(按周执行;每周开工前必读)
2. **本文件** `docs/TOP_LEVEL_PLAN.md` — Sprint 规划视角
3. `docs/TOP_LEVEL_DESIGN.md` — 设计逻辑 / 数据流
4. `docs/ARCHITECTURE_PLAN.md` — 合并策略
5. `docs/ADR/0005-mdm-only-auth.md` — 鉴权架构决策
6. `TEST_REPORT_v2.md` — Sprint 1 现状问题清单
7. `README.md` — 开发者入门
8. 各业务系统设计文档(`cim-rms/*.md` 等)
9. 各 API README(`mdm-api/README.md` 等)

---

## 十、版本日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-07-16 | 初版;基于 Sprint 1 MVP + 已有规划整合;Sprint 2-4 路线图 |
| v1.1 | 2026-07-16 | 取消 M365 SSO 路线;鉴权由 MDM 独立承担;新增 ADR-0005;Sprint 2 scope 加入密码方案 |
| v1.2 | 2026-07-16 | 新增 `docs/MASTER_PLAN.md` 作为行动基线;Sprint 2 scope 砍 5 任务推后(Sprint 2 buffer 提到 42%);A8-A15 截止时间按 MASTER_PLAN 重排 |
| **v1.2.1** | **2026-07-17** | **鉴权路线拍板 = C 方案;ADR-0005 Superseded;新增 ADR-0006 + Sprint2/AUTH_HYBRID_C_CHECKLIST.md;§5.3 安全决策 + §八 行动项同步** |

---

*维护人:Jerry / Mavis · 评审周期:每个 Sprint 末*

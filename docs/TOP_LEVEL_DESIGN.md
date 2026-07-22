# MRDI Portal · 顶层设计与系统规划

> 状态：v1.0-baseline（2026-07-16）· 适用于 Sprint 1 MVP 之后的所有改版  
> 受众：架构 review、新人 onboarding、Sprint 计划会议  
> 关联文档：`ARCHITECTURE_PLAN.md`（演进路径）· `VERSION.md`（版本快照）

---

## 0. 一句话定义

**MRDI Portal** 是 MRDI 智能制造运营门户，让 Fab 人员在一个入口内完成日常运营决策（看 KPI、处理需求、报案、查权限），底层由 4 个 Fastify API + 1 个 PostgreSQL 提供数据与权限支撑。

---

## 1. 顶层架构

### 1.1 部署视图（生产环境最终态）

```
┌────────────────────────────────────────────────────────────────────┐
│                  MRDI Fab 厂区 · Browser                          │
└────────────────────────────┬───────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌────────────────────────────────────────────────────────────────────┐
│  Caddy Reverse Proxy  (path-prefix routing · 单一入口)            │
│   /                 → mrdi-portal (8089)                          │
│   /mdm-api/*        → mdm-api:3000                                │
│   /cimrms-api/*     → cimrms-api:3001                             │
│   /cimims-api/*     → cimims-api:3002                             │
│   /perm-api/*       → cim-perm-api:3003                           │
└────────────────────────────┬───────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  mdm-api     │    │ cimrms-api   │    │ cimims-api   │
│  主数据+认证 │    │ Normal Change│    │ 報案/工單    │
│  (Fastify 4) │    │ (Fastify 4)  │    │ (Fastify 4)  │
│  Port 3000   │    │ Port 3001    │    │ Port 3002    │
└──────┬───────┘    └──────┬───────┘    └──────┬───────┘
       │                   │                    │
       │  ┌────────────────┴────────────┐       │
       │  │     cim-perm-api            │       │
       └─►│     细粒度权限 (Fastify 4)   │◄──────┘
          │     Port 3003               │
          └────────┬────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
  ┌──────────┐         ┌──────────┐
  │PostgreSQL│         │  Redis   │
  │ 4 schema │         │ cache    │
  │ mdm/cimrms/cimims/cimperm │   │   │  共享基础设施        │
  └──────────┘         └──────────┘
```

### 1.2 4 个 API 服务的关系（**不是** 微服务网格）

```
                    ┌─────────────────────┐
                    │   mrdi-portal       │ ←── 浏览器唯一入口
                    │   (React SPA)       │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        ┌──────────┐    ┌──────────┐    ┌──────────┐
        │ mdm-api  │    │ cimrms-  │    │ cimims-  │
        │ (主数据) │    │ api      │    │ api      │
        └─────┬────┘    └─────┬────┘    └─────┬────┘
              │               │               │
              │  ┌────────────┴───────┐       │
              └─►│ cim-perm-api       │◄──────┘
                 │ (权限验证)         │
                 └────────────────────┘

调用关系（读路径）：
  cimrms-api  ──→ mdm-api  (查用户身份)
  cimims-api  ──→ mdm-api  (查用户身份)
  cim-perm-api ──→ mdm-api  (查角色/资源)

写路径：每个 API 写自己的 schema，互不干扰。
```

**关键设计**：4 个 API 共享同一个 PostgreSQL（4 schema 隔离），但**通过 HTTP 调用而不是直接读对方 DB**。这保证了：
- 部署独立：每个 API 可单独重启/扩缩容
- 演进自由：mdm-api 可换 MongoDB 不影响其他
- 故障隔离：cim-ims 崩了不影响 mdm

---

## 2. 横向设计原则

### 2.1 共同的设计约束

| 维度 | 决策 | 原因 |
|------|------|------|
| **API 框架** | Fastify 4 | 比 Express 快 2-3x；原生 schema 验证 |
| **ORM** | Prisma 5.22 | 类型安全；migration 友好；DB schema 直读 |
| **语言** | TypeScript 5.5 | 编译期错误；IDE 补全 |
| **认证** | JWT (HS256) | 无状态；path-prefix 路由友好 |
| **API 风格** | REST + JSON | 团队熟悉度最高；Swagger 自动生成 |
| **数据库** | PostgreSQL 16 | JSONB 支持；物化视图；事务强 |
| **缓存** | Redis 7 | 限流 + 会话 + 热点缓存 |
| **日志** | pino (结构化) | Fastify 原生；JSON 格式好解析 |
| **部署** | Docker Compose | 本机/Dev VM 一致；镜像可推 |

### 2.2 路径前缀路由（强约束）

**所有 API 必须用 path-prefix 暴露**：

| 服务 | 前缀 | 示例 |
|------|------|------|
| mdm-api | `/mdm-api` | `/mdm-api/v1/users/me` |
| cimrms-api | `/cimrms-api` | `/cimrms-api/v1/requests` |
| cimims-api | `/cimims-api` | `/cimims-api/v1/incidents` |
| cim-perm-api | `/perm-api` | `/perm-api/v1/grants` |

**为什么是强约束**：
1. **Caddy/网关层做单一入口**——避免暴露 4 个端口
2. **未来合并到 1 个容器零成本**——前缀只是字符串拼接
3. **前端 axios 拦截器统一**——baseURL 一处改全局生效

### 2.3 数据库 schema 隔离（**核心设计**）

| Schema | 所有者 | 表数 | 关键表 |
|--------|--------|------|--------|
| `mdm` | mdm-api | 8 | User, RegisteredSystem, ApiKey, PermissionGrant, Todo, AuditLog, Session, UserRoleAssignment |
| `cimrms` | cimrms-api | 11 | Request, Event, Comment, Attachment, Metric, UAT, SlaConfig, Assignee, ... |
| `cimims` | cimims-api | 9 | Incident, Event, Comment, Assignment, Timeline, SlaRule, ... |
| `cimperm` | cim-perm-api | 5 | Resource, Grant, Role, AuditLog, ... |

**4 schema 共享 1 个 PostgreSQL**：
- ✅ 跨服务事务（如 cimrms 创建 NC 时记录到 mdm.AuditLog）可用 `dblink` 或 `SET search_path`
- ✅ 备份统一 1 次
- ❌ 4 schema 物理隔离不够强——任意 schema 都能 `SELECT * FROM mdm."User"`（需在应用层强制）

**未来拆库时机**：
- 单 DB > 100GB
- 跨服务事务成为瓶颈
- 不同 SLA 要求独立 failover

---

## 3. 各系统设计逻辑

### 3.1 mdm-api（**主数据 + 认证**，基础设施层）

**业务定位**：MRDI 所有系统的"数字身份 + 权限"基础。  
**核心问题**：内部员工的账号、密码、角色、资源授权 怎么统一管？

#### 3.1.1 设计逻辑

```
用户输入 username + password
       ↓
mdm-api 验密（bcrypt）+ 查角色 + 写 Session / AuditLog
       ↓
签发 JWT (HS256, 8h)
       ↓
4 个 API 共享 secret 验签 → req.currentUser
       ↓
业务路由 middleware 调 mdm-api /v1/permissions/check
  → 角色级：User.global_role (admin/auditor/editor/viewer)
  → 资源级：PermissionGrant 表
       ↓
放行 / 拒绝 403
```

**3 个核心抽象**：

1. **User**（用户）
   - 字段：`id, email, name, department, global_role, status, manager_id`
   - **密码字段**：`password_hash (bcrypt, cost=12)`, `password_expires_at`, `failed_login_count`, `locked_until`, `must_change_password`, `password_history[]`
   - 唯一性：本地登录用 `email`；**不接外部 IdP**
   - 全局角色：`admin` / `auditor` / `editor` / `viewer`（4 级）

2. **RegisteredSystem**（系统注册）
   - 字段：`id, system_id, name, api_base_url, allowed_roles, status, api_key_hash`
   - 用途：每个子系统向 mdm-api 注册自己（self-registration）
   - 网关层校验：`api_key` + `X-System-Id` Header

3. **PermissionGrant**（资源权限）
   - 字段：`id, user_id, resource_type, resource_id, permission (read/write/admin), granted_by, expires_at`
   - 用途：cim-perm-api 写入，cimrms/cimims 查询
   - 粒度：到具体资源（不是只到 role）

#### 3.1.2 API 表面

```
POST   /auth/v1/login                  username + password → JWT (生产长期使用)
POST   /auth/v1/logout                 撤销 Session
POST   /auth/v1/password/change        已登录用户改密
POST   /auth/v1/password/reset         admin 强制重置某用户
GET    /auth/v1/me                     当前用户

GET    /v1/users                       用户列表
GET    /v1/users/me                    当前用户详情
GET    /v1/users/by-email/:email       按邮箱查
POST   /v1/users                       创建（admin only，生成临时密码）
PATCH  /v1/users/:id                   admin 改用户信息
POST   /v1/users/:id/unlock            admin 解锁被锁账号

GET    /v1/systems                     已注册系统
POST   /v1/systems                     注册新系统
PATCH  /v1/systems/:id                 启停

POST   /v1/permissions/check           检查权限
POST   /v1/permissions/grant           授予
DELETE /v1/permissions/:id             撤销

GET    /v1/todos/users/me              我的待办（跨系统聚合）
POST   /v1/todos                        创建待办

GET    /v1/audit/logs                  审计日志（含登录成功/失败/锁定）
```

> **不接 M365 SSO**：见 `docs/ADR/0005-mdm-only-auth.md`

#### 3.1.3 关键决策

| 决策 | 原因 |
|------|------|
| **不接外部 IdP**（M365 / OAuth / SAML 全不做） | 门户是内部运营系统；Mfg/IT/PIE/Security 都是 MRDI 员工；审计必须内闭环 |
| 密码用 bcrypt (cost=12) + 90 天过期 + 5 次失败锁 15 分钟 | 内部系统足够安全；防止弱密码；不依赖外部策略 |
| 4 级 role 而非 RBAC 完整模型 | Sprint 1 够用；将来加细粒度 PermissionGrant |
| PermissionGrant 表是预留接口 | Sprint 2 起 cim-perm-api 写入 |
| Session 表 + AuditLog 表复用做登录会话/审计 | 不建新表；token_hash / expires_at / ip / user-agent 直接落库 |

---

### 3.2 cimrms-api（**Normal Change 需求工作流**，核心业务）

**业务定位**：Fab 车间向 IT 提需求 → 审批 → 开发 → UAT → 上线 → 验收 完整流程。  
**核心问题**：Mfg+PIE 提的"小需求"怎么不靠邮件群流转？每个 NC 状态怎么可追溯？

#### 3.2.1 设计逻辑

**状态机**（11 个状态）：

```
submitted ──→ pending_manager ──→ pending_pool ──→ scheduled
                    │                  │              │
                    ↓ rejected         ↓ in_development
              manager_rejected        pending_uat → pending_deploy
                                              ↓
                                          deployed → pending_acceptance
                                                         ↓
                                                        closed
```

**SLA 配置**（按 urgency 等级）：

| Urgency | 响应 SLA | 解决 SLA | 超时升级路径 |
|---------|---------|---------|--------------|
| P1 | 2h | 24h | 直接通知 IT Manager + CIO |
| P2 | 8h | 72h | 通知 IT Manager |
| P3 | 24h | 168h | 仅记录到 dashboard |

#### 3.2.2 11 个核心表

| 表 | 作用 | 关键字段 |
|---|------|---------|
| `Request` | NC 主表 | `request_no (NC-YYYY-NNNN)`, `urgency`, `status`, `submitter_id`, `assignee_id` |
| `Event` | 状态流转事件 | `request_id`, `event`, `actor_id`, `detail` |
| `Comment` | 评论 | `request_id`, `author_id`, `body` |
| `Attachment` | 附件 | `request_id`, `file_path`, `size` |
| `Metric` | 度量（耗时/返工次数）| `request_id`, `metric_type`, `value` |
| `UAT` | 用户验收记录 | `request_id`, `uat_by`, `result` |
| `SlaConfig` | SLA 配置 | `urgency`, `response_hours`, `resolve_hours` |
| `Assignee` | 处理人历史 | `request_id`, `user_id`, `assigned_at`, `released_at` |
| `Notification` | 通知队列 | `user_id`, `type`, `payload`, `sent_at` |
| `Tag` | 标签 | `name`, `color` |
| `RequestTag` | 多对多 | `request_id`, `tag_id` |

#### 3.2.3 API 表面

```
GET    /v1/requests                       列表（filter: status/urgency/assignee）
POST   /v1/requests                       提交 NC
GET    /v1/requests/:id                   详情
PATCH  /v1/requests/:id                   修改（标题/描述/Urgency）
POST   /v1/requests/:id/approve           主管审批通过
POST   /v1/requests/:id/reject            驳回
POST   /v1/requests/:id/schedule          排期
POST   /v1/requests/:id/start-dev         开始开发
POST   /v1/requests/:id/uat               提交 UAT
POST   /v1/requests/:id/deploy            部署
POST   /v1/requests/:id/accept            用户验收
POST   /v1/requests/:id/close             关闭

GET    /v1/dashboard/kpi                  主页 KPI
GET    /v1/dashboard/my-pending           我的待办
GET    /v1/dashboard/team-in-progress     团队进行中
GET    /v1/dashboard/sla-breaches         SLA 超时列表
```

#### 3.2.4 关键决策

| 决策 | 原因 |
|------|------|
| NC 编号格式 `NC-YYYY-NNNN` | 年+顺序号；用户一眼看出时间 |
| Event 表用 append-only | 状态机追溯简单，UI 也能直接画时间轴 |
| SLA 在 SlaConfig 表 | 不同 P 等级不同 SLA；改配置不需改代码 |
| 提单后自动派单到主管 | 当前流程硬编码；将来加规则引擎 |

---

### 3.3 cimims-api（**報案/工單**，DR 战备级）

**业务定位**：Fab 用户发现 IT 异常 → 报案 → 值班接单 → 处置 → 用户确认 → 关闭。  
**核心问题**：当 Mfg 在产线上报修，IT 能在 2h 内响应吗？超时怎么升级？

#### 3.3.1 设计逻辑

**为什么 DR 战备级**：
- 99.9% SLA（P1 报修 2h 响应）
- 独立部署周期（季度级，不能跟业务系统一起发版）
- 独立 failover（业务系统挂了，工單系统必须能接报案）
- 即使 CIM 平台全挂，工單也要能继续记录

**状态机**（7 个状态）：

```
reported ──→ pending_takeover ──→ in_progress ──→ pending_user_confirm
                  │                    │                   │
                  ↓ rejected            ↓ transferred        ↓ user_rejected
              (back to user)        (back to in_progress)   (back to in_progress)
                                                          ↓
                                                      closed
```

**关键设计：SLA 自动升级**：

```
报修 0h  ──── 50% SLA  ──── 100% SLA  ──── 200% SLA
   │            │            │             │
   ↓            ↓            ↓             ↓
 创建工单     推送到钉钉群  通知值班长    通知 IT Manager
              (提醒)        (升级)       (再升级)
```

#### 3.3.2 9 个核心表

| 表 | 作用 | 关键字段 |
|---|------|---------|
| `Incident` | 工單主表 | `incident_no (INC-YYYY-NNNN)`, `urgency (P1/P2/P3)`, `status`, `submitter_id`, `assignee_id` |
| `Event` | 流转事件 | `incident_id`, `event`, `actor_id` |
| `Comment` | 内部评论 | `incident_id`, `is_internal` |
| `Assignment` | 接单/转派记录 | `incident_id`, `from_user`, `to_user` |
| `Timeline` | 时间线（前端展示用）| `incident_id`, `action`, `actor`, `is_internal` |
| `SlaRule` | SLA 规则 | `urgency`, `response_minutes`, `resolve_minutes` |
| `SlaBreachLog` | 超时记录 | `incident_id`, `sla_type`, `breached_at` |
| `Attachment` | 附件 | `incident_id`, `file_path` |
| `OncallSchedule` | 值班表 | `date`, `shift`, `user_id` |

#### 3.3.3 API 表面

```
POST   /v1/incidents                     用户报案
GET    /v1/incidents                     列表
GET    /v1/incidents/:id                 详情
PATCH  /v1/incidents/:id                 修改（紧急度/描述）
POST   /v1/incidents/:id/takeover        值班接单
POST   /v1/incidents/:id/transfer        转派
POST   /v1/incidents/:id/resolve         处置完成
POST   /v1/incidents/:id/confirm         用户确认
POST   /v1/incidents/:id/reject          用户驳回（处置不认可）
POST   /v1/incidents/:id/close           关闭

GET    /v1/oncall/today                  今日值班
GET    /v1/oncall/week                   本周值班
GET    /v1/sla/breaches                  超时列表
GET    /v1/dashboard/kpi                 角色视角 KPI
```

#### 3.3.4 关键决策

| 决策 | 原因 |
|------|------|
| 工單号 `INC-YYYY-NNNN` | 与 NC 同格式便于追溯 |
| `OncallSchedule` 单独表 | 值班轮换规则将来可走配置中心 |
| 超时自动升级（不需人工）| DR 要求；值班换班时不能丢单 |
| 转派必须填原因 | 防止"踢皮球"无记录 |

---

### 3.4 cim-perm-api（**细粒度权限**，从 Express 迁移）

**业务定位**：补充 mdm-api 的粗粒度 role，做资源级访问控制。  
**核心问题**：当一个用户只能看"自己部门的设备 SPC"而不能看其他部门时，mdm 的 4 级 role 不够用。

#### 3.4.1 设计逻辑

**与 mdm-api 的分工**：

| 维度 | mdm-api | cim-perm-api |
|------|---------|--------------|
| 粒度 | 全局 role | 资源级 grant |
| 决策 | Admin 手动分配 | 人工审批（来自权限申请工單） |
| 缓存 | 无 | Redis（高频检查） |
| 写来源 | Admin 创建 / 重置 | 申请工單审批通过 |
| 读消费者 | UI 菜单 | API 网关层细粒度校验 |

**决策流程**：

```
用户提"权限申请"（CIM-IMS 工單）
       ↓
IT Manager 在 cimrms 中审批通过
       ↓
cimrms 调用 cim-perm-api: POST /v1/grants
       ↓
cim-perm-api 写入 cimperm.PermissionGrant
       ↓
下次 cimrms API 调用时网关查 cim-perm-api: POST /v1/check
       ↓
返回 true/false
```

#### 3.4.2 5 个核心表

| 表 | 作用 | 关键字段 |
|---|------|---------|
| `Resource` | 资源定义 | `resource_type`, `resource_id`, `name` |
| `Grant` | 授权记录 | `user_id`, `resource_type`, `resource_id`, `permission`, `expires_at`, `granted_by` |
| `Role` | 角色定义 | `name`, `permissions (JSON array)` |
| `AuditLog` | 授权/撤销审计 | `action`, `actor_id`, `target_user_id`, `grant_id` |
| `Policy` | 自动策略 | `conditions (JSON)`, `actions (JSON)` |

#### 3.4.3 API 表面

```
POST   /v1/check                         权限检查（高频读）
POST   /v1/grants                        授予
GET    /v1/grants/user/:userId           查用户所有授权
GET    /v1/grants/resource/:type/:id     查资源所有授权
DELETE /v1/grants/:id                    撤销

GET    /v1/resources                     资源列表
POST   /v1/resources                     注册新资源类型

GET    /v1/roles                         角色列表
POST   /v1/policies                      策略（自动授权规则）
```

#### 3.4.4 关键决策

| 决策 | 原因 |
|------|------|
| Express → Fastify 迁移 | Fastify 快 2-3x；schema 验证内置 |
| 读路径用 Redis 缓存 | `/v1/check` 高频调用 |
| 不用 ABAC 完整引擎 | 资源 grant 表 + 简单策略足够 |
| Policy 表预留 | Sprint 3+ 用规则引擎自动授权 |

---

### 3.5 mrdi-portal（**统一入口**，前端 SPA）

**业务定位**：所有 CIM 系统的"门面"，值班长每天上班第一眼看到的地方。  
**核心问题**：4 个系统的入口怎么收敛到 1 个网址？怎么样一眼看出"今天差多少能交差"？

#### 3.5.1 设计逻辑

**信息架构**：

```
mrdi-portal/
├── Dashboard (主页)            ← 值班长看 KPI/目标
├── MDM 子系统
│   ├── MdmDashboard
│   ├── MdmUsers
│   ├── MdmSystems
│   ├── MdmApiKeys
│   └── MdmAccessMatrix
├── CIM-RMS 子系统
│   ├── CimrmsDashboard
│   ├── CimrmsRequests (列表)
│   ├── CimrmsRequestNew
│   └── CimrmsRequestDetail
├── CIM-IMS 子系统
│   ├── CimimsDashboard
│   ├── CimimsIncidents
│   ├── CimimsIncidentNew
│   └── CimimsIncidentDetail
├── 权限管理子系统
│   ├── PermDashboard
│   └── PermApprovals
└── 用户/系统
    ├── Login (MDM 账号密码)
    ├── Profile
    └── SystemSettings
```

**Dashboard 主页设计原则**（P0 改版后）：

1. **顶部 KPI 条**：4 个生产指标（OEE/在制 Lot/Yield/稼动率），统一格式
2. **3 列网格**：产线状态矩阵 / 今日 Lot 进度 / 实时告警
3. **今日目标达成**（hero 区）：4 张主卡 + 7 日 Yield 趋势
4. **底部**：我的待办（3 卡）+ 系统消息（2 条）

#### 3.5.2 前端技术栈

| 技术 | 用途 |
|------|------|
| React 19 + TypeScript 5.5 | 主框架 |
| Vite 5 | 构建（dev 启动 < 1s） |
| React Router 7 | 路由 |
| TanStack Query 5 | 服务端状态（缓存/重试/失效） |
| TailwindCSS 3 | 样式（MRDI brand preset） |
| lucide-react | 图标 |
| recharts | 图表（生产 KPI 趋势） |
| pnpm workspace | 共享 `@mrdi/shared` / `@mrdi/ui` |

#### 3.5.3 与 4 个 API 的集成

**axios 实例配置**：

```ts
// 一处配置全局生效
const clients = {
  mdm: axios.create({ baseURL: 'http://localhost:3000' }),
  cimrms: axios.create({ baseURL: 'http://localhost:3001' }),
  cimims: axios.create({ baseURL: 'http://localhost:3002' }),
  cimperm: axios.create({ baseURL: 'http://localhost:3003' }),
};

// 拦截器自动注入 JWT
clients.mdm.interceptors.request.use((cfg) => {
  cfg.headers.Authorization = `Bearer ${getToken()}`;
  return cfg;
});
```

**TanStack Query 模式**：

```ts
// 每个服务一个 hook，staleTime 60s（够用，无需频繁拉）
export const useDashboardKpi = () => {
  return useQuery({
    queryKey: ['cimrms', 'dashboard', 'kpi'],
    queryFn: () => api.cimrms.get('/v1/dashboard/kpi'),
    staleTime: 60_000,
  });
};
```

---

## 4. 横切关注点（Cross-Cutting Concerns）

### 4.1 认证流程（MDM 独立承担 · 无外部 IdP）

```
Browser
   │  1. 输入 username + password
   ▼
Portal ──(POST /auth/v1/login)──→ mdm-api
   │                                  │
   │                          2. 查 User 表(email)
   │                          3. 校验 bcrypt password_hash
   │                          4. 校验 status=active / locked_until 已过
   │                          5. 校验 password_expires_at 未过
   │                          6. 写 Session 表(token_hash, ip, ua, expires_at)
   │                          7. 写 AuditLog(action="auth.login.success")
   │                          8. 签发 JWT (HS256, 8h)
   │  9. 返回 JWT + User 信息
   ▼
Portal 保存 JWT（sessionStorage）
   │  10. 后续所有 API 调用带 Authorization: Bearer <jwt>
   ▼
4 个 API 共享 JWT secret 验证 → 注入 req.currentUser
   │
   ▼
业务路由 middleware 调 mdm-api POST /v1/permissions/check
   → 角色级 / 资源级判断
   → 放行 / 403
```

**关键决策**：
- **不接任何外部 IdP**（M365 / OAuth / SAML 全不做）— 见 ADR-0005
- JWT secret 4 个 API 共享：`dev-jwt-secret-change-in-production-mrdi-2026`
- 生产环境必须改 secret 并用 RS256
- 登录失败 / 锁定 / 改密 / 重置 全部写 `mdm.AuditLog`
- `dev_login` 端点 **Sprint 2 末删除**，统一走 `/auth/v1/login`

### 4.2 日志格式（pino 结构化）

```json
{
  "level": 30,
  "time": "2026-07-16T10:18:42.123Z",
  "pid": 1,
  "hostname": "mdm-api",
  "reqId": "req-1",
  "req": { "method": "GET", "url": "/v1/users/me", "remoteAddress": "172.19.0.1" },
  "res": { "statusCode": 200 },
  "responseTime": 12,
  "service": "mdm-api",
  "user_id": "131e8e97-...",
  "msg": "request completed"
}
```

### 4.3 错误处理（统一格式）

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数校验失败",
    "details": {
      "fieldErrors": { "email": ["Required"] }
    }
  }
}
```

**错误码**：
- `VALIDATION_ERROR` - Zod schema 校验失败
- `UNAUTHORIZED` - JWT 缺失/过期
- `FORBIDDEN` - 权限不足
- `NOT_FOUND` - 资源不存在
- `CONFLICT` - 唯一键冲突
- `INTERNAL` - 500 兜底
- `HTTP_ERROR` - 透传上游 API 错误

### 4.4 部署与运维

**启动**：
```bash
cd C:/M0056/20-AI/40-Minimax/Portal
docker compose up -d
# 7 容器在 30s 内全部就绪
```

**健康检查**：
- 每个 API: `GET /health` 返回 `{ status, db, uptime, version }`
- 聚合: 前端 portal 启动时调 4 个 API 的 health（实现中）

**日志聚合**（未来）：
- 本机开发：`docker logs <container>`
- 生产 ELK/Loki：`pino` → JSON → Fluent Bit → ES

---

## 5. 数据流：用户典型操作

### 5.1 场景：Mfg 班长发现设备报警，提交工單

```
1. 班长在 portal 主页看到"实时告警"区显示 E02 报警
   ↓
2. 点"上报事件"按钮 → 跳转到 cimims/incidents/new
   ↓
3. 填写：标题/紧急度/影响范围/描述/截图
   ↓
4. POST /cimims-api/v1/incidents
   ↓
5. cimims-api: 写入 cimims.Incident, 生成 INC-2026-0288
   ↓
6. cimims-api: 创建 OncallSchedule 关联
   ↓
7. cimims-api: 推送到钉钉群"今日新工單"
   ↓
8. 值班 IT 收到钉钉通知 → 打开 portal → 点 CIM-IMS 卡片
   ↓
9. 看到新工單 → POST /takeover
   ↓
10. cimims-api: 状态 → in_progress, 记录 Assignment
   ↓
11. 处置中... 2h 后
    ↓
12. POST /resolve → 状态 → pending_user_confirm
    ↓
13. 班长收到通知 → 在 portal 点"确认解决"
    ↓
14. POST /confirm → 状态 → closed
    ↓
15. 写入 AuditLog
    ↓
16. cimims-api: 通过 mdm-api 的 AuditLog 跨服务记录
```

**涉及 3 个服务 + 1 个 DB，耗时 2-8h 包含**。

### 5.2 场景：Mfg+PIE 提交 Normal Change 需求

```
1. PIE 在 portal 主页点"快速操作"→"新需求"
   ↓
2. 跳转到 cimrms/requests/new
   ↓
3. 填写：标题/类型/紧急度/关联系统/影响区域/期望完成时间
   ↓
4. POST /cimrms-api/v1/requests
   ↓
5. cimrms-api: 写入 cimrms.Request, 生成 NC-2026-0143
   ↓
6. 派单规则：自动派给同部门主管
   ↓
7. 主管收到 portal 通知 → 待办列表出现
   ↓
8. 主管审批 → 状态 → pending_pool
   ↓
9. CIM Lead 在 pool 中排期 → scheduled
   ↓
10. IT 工程师 start-dev → in_development
    ↓
11. 提 UAT → pending_uat
    ↓
12. PIE 验收 → deployed → pending_acceptance
    ↓
13. PIE 接受 → closed
    ↓
14. 写入 Metric 表（处理时长、返工次数）
    ↓
15. 主页 KPI 实时更新
```

---

## 6. 演进路线（12-18 个月）

### 6.1 短期（Sprint 2-3 · 1-3 个月）

- [ ] **CIM-IMS 工單系统完整化**：OncallSchedule 自动轮值、SLA 升级
- [ ] **mdm-api 账号管理完整化**：Admin 创建/重置/解锁/审计 UI(详见 ADR-0005)
- [ ] **cimrms-api 通知中心**：站内消息 + 飞书 webhook
- [ ] **Portal 移动端适配**：现有 1280px 宽版 → 375-768px 响应式

### 6.2 中期（Sprint 4-6 · 3-6 个月）

- [ ] **mdm-api + cim-perm-api 合并**：都是基础设施类，部署频率低
- [ ] **SPC 趋势模块**（cimrms 范围扩展）
- [ ] **告警中心**（portal 内聚合，订阅/过滤/告警静音）
- [ ] **值班长 dashboard**：早班/中班/夜班 切换

### 6.3 长期（Sprint 7+ · 6-18 个月）

- [ ] **CIM-IMS 拆独立部署**：DR 战备级，独立 VM
- [ ] **AI 辅助**：工單自动分类 / NC 智能派单 / 异常告警根因
- [ ] **跨厂区**：复制整套到 MEC 厂区（这就是 plant 字段改 MEC 的原因）
- [ ] **数据中台**：MES / SPC / APC 数据接入，Portal 变数据可视化平台

---

## 7. 风险与缓解

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| 跨服务调用成为瓶颈 | 中 | 中 | Redis 缓存 / 异步消息 / 减少强依赖 |
| PostgreSQL 单点 | 低 | 高 | docker volume 备份 / 未来主从 |
| 密码方案弱密码 / 锁定误触发 | 中 | 中 | bcrypt cost=12 + 5 次失败锁 15 分钟;Admin 后台可手动解锁;详细审计日志 |
| CIM-IMS 误合并进业务系统 | 低 | 高 | 架构决策写入 ADR（见 ARCHITECTURE_PLAN） |
| JWT secret 泄露 | 低 | 高 | 4 个 API 用同一 secret，rotate 时同步 |
| Prisma 性能瓶颈 | 低 | 中 | n+1 监控 / 物化视图 / 未来换 Drizzle |

---

## 8. 关键 ADR（架构决策记录）

### ADR-001 · 路径前缀路由
- **决策**：所有 API 用 `/<service-name>-api/*` 暴露
- **原因**：Caddy 单一入口 + 未来合并零成本
- **影响**：所有 API 设计必须遵守

### ADR-002 · 数据库 schema 隔离
- **决策**：4 个 API 用 1 个 PostgreSQL + 4 schema
- **原因**：降低运维复杂度 + 跨服务事务支持
- **影响**：每个 API 强制 `SET search_path`；禁止跨 schema 读表

### ADR-003 · CIM-IMS 永不合并
- **决策**：CIM-IMS 永远是独立服务
- **原因**：DR 战备级要求（99.9% SLA + 独立 failover）
- **影响**：未来 12 个月内不参与合并

### ADR-004 · JWT 共享 secret
- **决策**：4 个 API 共享 JWT secret + HS256
- **原因**：4 服务互信，无外部 IdP
- **影响**：rotate secret 时必须 4 服务同步

### ADR-005 · Prisma 5.22.0 统一
- **决策**：所有 API 用同一 Prisma 版本
- **原因**：避免版本漂移 / migration 兼容问题
- **影响**：升级时必须 4 服务同步

---

## 9. 附：完整路由表

### mdm-api (Port 3000)
```
GET    /health

POST   /auth/v1/login                 username + password → JWT
POST   /auth/v1/logout                撤销 Session
POST   /auth/v1/password/change       已登录用户改密
POST   /auth/v1/password/reset        admin 强制重置
GET    /auth/v1/me                    当前用户

GET    /v1/users                      用户列表
POST   /v1/users                      admin 创建(生成临时密码)
GET    /v1/users/me                   当前用户详情
GET    /v1/users/by-email/:email      按邮箱查
PATCH  /v1/users/:id                  admin 改用户信息
POST   /v1/users/:id/unlock           admin 解锁被锁账号

GET    /v1/systems
POST   /v1/systems
GET    /v1/systems/:id
PATCH  /v1/systems/:id
DELETE /v1/systems/:id

POST   /v1/permissions/check
POST   /v1/permissions/grant
DELETE /v1/permissions/:id

GET    /v1/todos/users/me
POST   /v1/todos
PATCH  /v1/todos/:id

GET    /v1/audit/logs                 审计日志(含登录)
```

### cimrms-api (Port 3001)
```
GET    /health → /v1/health
GET    /v1/health

GET    /v1/requests
POST   /v1/requests
GET    /v1/requests/:id
PATCH  /v1/requests/:id
POST   /v1/requests/:id/approve
POST   /v1/requests/:id/reject
POST   /v1/requests/:id/schedule
POST   /v1/requests/:id/start-dev
POST   /v1/requests/:id/uat
POST   /v1/requests/:id/deploy
POST   /v1/requests/:id/accept
POST   /v1/requests/:id/close

GET    /v1/dashboard/kpi
GET    /v1/dashboard/my-pending
GET    /v1/dashboard/team-in-progress
GET    /v1/dashboard/sla-breaches
```

### cimims-api (Port 3002)
```
GET    /health → /v1/health

POST   /v1/incidents
GET    /v1/incidents
GET    /v1/incidents/:id
PATCH  /v1/incidents/:id
POST   /v1/incidents/:id/takeover
POST   /v1/incidents/:id/transfer
POST   /v1/incidents/:id/resolve
POST   /v1/incidents/:id/confirm
POST   /v1/incidents/:id/reject
POST   /v1/incidents/:id/close

GET    /v1/oncall/today
GET    /v1/oncall/week
GET    /v1/sla/breaches
GET    /v1/dashboard/kpi
```

### cim-perm-api (Port 3003)
```
GET    /health → /perm-api/v1/health

POST   /perm-api/v1/check
POST   /perm-api/v1/grants
GET    /perm-api/v1/grants/user/:userId
GET    /perm-api/v1/grants/resource/:type/:id
DELETE /perm-api/v1/grants/:id

GET    /perm-api/v1/resources
POST   /perm-api/v1/resources

GET    /perm-api/v1/roles
POST   /perm-api/v1/policies
```

### mrdi-portal (Port 8089)
```
GET    /
所有 React 路由（SPA history fallback）
```

---

*最后更新：2026-07-16 · v1.1-baseline(取消 M365 SSO,MDM 独立承担鉴权)*
*下次 review：Sprint 2 启动前(2026-07-23 预计)*

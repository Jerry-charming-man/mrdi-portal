# MRDI Portal · 版本快照

> 本文件记录每次"基线定版"时的状态。
> 没有用 git（项目还不是 git repo），所以手动维护。
> **冲突优先级**：`docs/MASTER_PLAN.md` > 本文件 > 其他。Sprint 末同步。

---

## v1.1-baseline · 2026-07-17（当前）

**定版原因**：Sprint 2 收口期 — 6/6 任务 PASS、Sprint 3 待启动

### 全栈状态（2026-07-17 更新）

| 服务 | 端口 | 镜像 / 进程 | 状态 |
|------|------|------------|------|

### 全栈状态
| 服务 | 端口 | 镜像 / 进程 | 状态 |
|------|------|------------|------|
| PostgreSQL 16 | 5432 | `mrdi-postgres` | ✅ healthy |
| Redis 7 | 6379 | `mrdi-redis` | ✅ healthy |
| mdm-api | 3000 | `mrdi/mdm-api:latest` | ✅ DB up · v2.2 |
| cimrms-api | 3001 | `mrdi/cimrms-api:latest` | ✅ DB up · 25 API |
| cimims-api | 3002 | `mrdi/cimims-api:latest` | ✅ DB up · 32 API |
| cim-perm-api | 3003 | `mrdi/cim-perm-api:latest` | ✅ DB up · 15 API |
| mrdi-portal | 8089 | `mrdi-portal:latest` | ✅ serving · 41 页面 |

### Sprint 2 完成度（TEST_REPORT_v3 6/6 PASS）

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| S2-5 | MDM 页面接真 API（Users / Dashboard） | ✅ | mock 切真 |
| S2-6 | SPC 趋势图 + CSV 导出 | ✅ | cimrms-api 真 API |
| S2-7 | Alarm 状态联动（acknowledge / close） | ✅ | takeOver / forceClose |
| S2-8 | 班次交接通知（Handover） | ✅ | 接真 incidents API + 班别自动推导 |
| S2-9+10 | 角色级 RBAC（4 API 全加） | ✅ | mdm / cimrms / cimims 守卫通过；cim-perm 待补 |
| S2-11 | `@mrdi/ui` 抽 4 组件 | ✅ | Badge / StatusBadge / Button / Modal / ConfirmModal |
| A11 | mdm.User 加 7 字段（密码体系） | ✅ | password_hash / failed_login_count / locked_until / password_history 等 |
| A12 | `/auth/v1/login` 改造（bcrypt + 失败锁定） | ✅ | 5 次失败锁 15 分钟；测试 PASS |

### Sprint 3 进行中

| # | 任务 | 状态 | 备注 |
|---|------|------|------|
| T1 | Prisma 补 2 字段（`m365_object_id` / `m365_synced_at`） | ✅ 2026-07-17 | v1.1-baseline 已落地（属于 A11） |
| **T2** | dev_login 加 ADMIN_KEY 中间件 | ✅ 2026-07-17 | 无 key → 403；正确 key → 200；测试 PASS |
| **T3** | M365 OAuth mock client（token exchange + Graph API `/me`） | ✅ 2026-07-17 | dev mock IDP；editor/viewer/admin 3 角色切换；测试 PASS |
| T4 | `POST /auth/v1/m365/callback` full endpoint（前端集成） | ⏳ pending | E2E with frontend login page |
| **T5** | `POST /auth/v1/login` full + LoginAudit 6 events | ✅ 2026-07-17 | bcrypt + 5次失败锁；audit: fail/success/lock/lock_triggered；测试 PASS |
| **T6** | `POST /auth/v1/change-password` | ✅ 2026-07-17 | 强度校验（12+上小写数特）+ password_history + bcrypt cost=12；测试 PASS |
| T7a-d | 登录页 UI（Jerry's task） | ⏳ pending | M365 button + collapsible credentials form |
| **T8** | admin unlock + reset-password | ✅ 2026-07-17 | unlock(403非admin/404不存在/400未锁定) + reset(200+must_change_password)；测试 PASS |
| **T9** | E2E 集成测试 + TEST_REPORT_v4 | ✅ 2026-07-17 | 22 PASS / 0 FAIL；T2/T3/T5/T6/T8 全覆盖；TEST_REPORT_v4.md 已产出 |
| T4 | M365 callback 前端集成 | ✅ 2026-07-17 | portal 登录页 → M365 OAuth 跳转 → JWT 存储；build 2458 modules |
| T7a-d | 登录页 UI + Profile 改密页 | ✅ 2026-07-17 | M365 按钮置顶 + 账号密码折叠 + Profile 改密 + RequireAuth守卫 |

### Sprint 2 累计变更

**mdm-api**
- User 表 +7 字段（bcrypt 密码体系）— Prisma migration 已应用
- User 表 +2 字段（`m365_object_id` / `m365_synced_at`）— Sprint 3 T1
- 新增 LoginAudit 表（Sprint 2 已落地，记录全部登录/失败/锁定）
- 新增 Notification 子系统（13 种 type、5 个 API）
- 新增 Session 表
- 9 个核心 API prefix（auth / users / roles / permissions / systems / todos / notifications / systemNotifications / health）
- 角色守卫：POST /v1/systems、POST /v1/permissions/grant、POST /v1/permissions/grant/:id/revoke
- **ADMIN_KEY 中间件（Sprint 3 T2）**：dev_login 受 ADMIN_KEY 保护；`/dev/login` 无 key → 403 `EMERGENCY_ACCESS_DISABLED`；auth 逻辑移至 `app.ts` 根 scope 避免 Fastify encapsulation 问题

**cimrms-api**
- 角色守卫全 8 操作通过：approve / reject / schedule / dev_start / dev_complete / uat_pass / deploy / accept / reject_acceptance / comment
- 25 个 API 全部字段对齐

**cimims-api**
- 角色守卫 7 操作全过：take-over / transfer / mark-resolved / confirm / reject / force-close / audit
- 32 个 API 全部字段对齐
- 修复：Alarm 页面 → takeOver 状态联动；Handover 接真 API + 班别自动推导

**cim-perm-api** ⚠️
- 仍用 PG 直接写（非 Prisma，与其他 3 API 不一致）
- **缺角色守卫**（TEST_REPORT v3 未覆盖）
- **目录未迁移** `cim-perm/` → `cim-perm-api/`（A8 推到 Sprint 4 W2）

**mrdi-portal**
- 4 个 Critical 全部修复（`/v1/roles` / `/auth/me` 路径 / Dashboard 三栏 / Header 告警 badge 动态）
- 4 个 High 修完 4 个（MDM 接真 API / SPC 导出 / Alarm 联动 / 班次交接）
- `@mrdi/ui` 抽 4 组件，5 页面接入示例
- 41 页面（Dashboard 1 + MDM 11 + CIM-RMS 9 + CIM-IMS 9 + cim-perm 9 + Login/Profile 2）

**共享包**
- `@mrdi/shared` 31 文件，permission/ 升级（去重 ForbiddenError / GlobalRole）
- `@mrdi/ui` 6 文件，5 组件
- `packages/teams-notify-sdk` 🆕 17 文件（7/17 10:18 编译完）— **冻结中，等鉴权决策拍板**

### 关键决策（防止回头撞车）

- 所有 4 个 API 走**路径前缀**路由：`/mdm-api/*` / `/cimrms-api/*` / `/cimims-api/*` / `/perm-api/*`
- `@prisma/client` Dockerfile 必须是真实 npm 包（5.22.0），不能用 workspace 协议
- `dev_login` JWT secret：`dev-jwt-secret-change-in-production-mrdi-2026`
- dev_login 路径：`/auth/v1/dev/login?email=...&name=...&role=...&department=...`
- Docker compose 用 `image:` 不用 `build:`（避免缓存旧层）
- **鉴权路线（核心约束）**：当前按 ADR-0005（MDM 独立承担）；AUTH_HYBRID_PRD 与之冲突，本周拍板前**不接入** teams-notify-sdk

### 已知缺口（按 P0 / P1 排序）

**🔴 P0（Sprint 2 末必补）**
1. mdm-api 缺 `GET /audit` 路由 — MdmAudit 整页 mock
2. MdmUsers 赋予角色 fake toast — 弹窗未调真实 `POST /v1/roles/assign`
3. **鉴权路线 ADR-0005 vs AUTH_HYBRID 拍板**（07-31 前）
4. cim-perm 角色守卫未补（与其他 3 API 不齐）
5. 4 API Swagger UI 缺（推到 Sprint 3 W4）
6. 4 API 鉴权中间件统一推到 Sprint 3 W3

**🟡 P1**
7. mdm-api 缺用户详情页（路由 `/mdm/users/:email`）+ 5 Tab
8. mdm-api 缺 PIV 异常页（业务真接 PIV 设备时再补）
9. RBAC 前端隔离（`usePermission` hook + `<ProtectedRoute>`）
10. MdmSettings UI 与 ADR-0005 矛盾（要 UI 改成本地账号管理 或 删页面）
11. cim-perm 目录迁移到 `cim-perm-api/`（Sprint 4 W2）
12. cim-perm 仍用 PG 直接写（与 3 API 用 Prisma 不一致）

### 文档状态
| 文档 | 状态 | 备注 |
|------|------|------|
| VERSION.md | v1.1-baseline（2026-07-17） | **本文件** |
| CHANGELOG.md | 🆕 已建 | 变更单正式记录位置 |
| MASTER_PLAN.md | v1.0（2026-07-16） | 行动基线，每周五更新 |
| TOP_LEVEL_PLAN.md | v1.2（2026-07-16） | Sprint 末同步 |
| TOP_LEVEL_DESIGN.md | v1.1（2026-07-16） | 鉴权路线变更有冲突 |
| TEST_REPORT_v3.md | 2026-07-16 | Sprint 2 6/6 PASS |
| ADR/0005-mdm-only-auth.md | Accepted 2026-07-16 | 与 AUTH_HYBRID 冲突中 |
| Sprint2/AUTH_HYBRID_PRD.md | v1.0 草案 2026-07-17 | **本周拍板** |
| archive/mdm-v2.1/MDM-V2.2-变更说明.md | 🆕 2026-07-17 | v2.1 → v2.2 实施差距 |
| TEST_REPORT_v4.md | ✅ 2026-07-17 | Sprint 3 T9 · 22 PASS / 0 FAIL |

---

## v1.0-baseline · 2026-07-16（历史）

**定版原因**：Sprint 1 MVP 全部跑通 + Portal Dashboard P0 改版落地

### 全栈状态
| 服务 | 端口 | 镜像 / 进程 | 状态 |
|------|------|------------|------|
| PostgreSQL 16 | 5432 | `mrdi-postgres` | ✅ healthy |
| Redis 7 | 6379 | `mrdi-redis` | ✅ healthy |
| mdm-api | 3000 | `mrdi/mdm-api:latest` | ✅ DB up |
| cimrms-api | 3001 | `mrdi/cimrms-api:latest` | ✅ DB up |
| cimims-api | 3002 | `mrdi/cimims-api:latest` | ✅ DB up |
| cim-perm-api | 3003 | `mrdi/cim-perm-api:latest` | ✅ DB up |
| mrdi-portal | 8089 | `mrdi-portal:latest` | ✅ serving |

### Portal Frontend
- 构建产物：`mrdi-portal/dist/assets/index-wlzfCG7m.js` (1066 KB)
- Plant 标签：`Fab-1 · MEC`（Sidebar / CimrmsLayout / CimimsLayout / Dashboard 4 处）
- Dashboard P0-1：4 张主卡 = OEE / 在制 Lot / 本班 Yield / 设备稼动率（生产 KPI，与设计稿一致）
- 设计稿 README：2026-07-16 起标记"已对齐"

### 关键决策（防止回头撞车）
- 所有 4 个 API 走**路径前缀**路由：`/mdm-api/*` / `/cimrms-api/*` / `/cimims-api/*` / `/perm-api/*`
- `@prisma/client` Dockerfile 必须是真实 npm 包（5.22.0），不能用 workspace 协议
- `dev_login` JWT secret：`dev-jwt-secret-change-in-production-mrdi-2026`
- dev_login 路径：`/auth/v1/dev/login?email=...&name=...&role=...&department=...`
- Docker compose 用 `image:` 不用 `build:`（避免缓存旧层）

### 启动命令
```powershell
cd C:/M0056/20-AI/40-Minimax/Portal
docker compose up -d                 # 启动全栈
# 访问：http://localhost:8089
```

### 重新构建（任一服务代码变化后）
```powershell
# Backend
docker build -f mdm-api/Dockerfile    -t mrdi/mdm-api:latest    .
docker build -f cimrms-api/Dockerfile -t mrdi/cimrms-api:latest .
docker build -f cimims-api/Dockerfile -t mrdi/cimims-api:latest .
docker build -f cim-perm/Dockerfile   -t mrdi/cim-perm-api:latest .

# Frontend
cd mrdi-portal
pnpm exec tsc -b
vite build
cd ..
docker compose build --no-cache mrdi-portal
docker compose up -d
```

### 历史版本变更
- **v1.1 → v1.0**：将 v1.1 状态提升为当前基线，v1.0 保留为历史快照
- v1.0：Sprint 1 MVP 落地

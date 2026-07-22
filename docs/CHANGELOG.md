# MRDI Portal · 变更单（CHANGELOG）

> **作用**：记录所有 scope 变更、决策冲突、版本基线。MASTER_PLAN §十 要求。
> **优先级**：`MASTER_PLAN` > `VERSION.md` > `CHANGELOG.md` > 其他
> **格式**：`[变更单 YYYY-MM-DD-NN] 任务: <原任务>`

---

## 待拍板（Pending Decision）

> _本节当前无待拍板项。最近一次拍板：2026-07-17-01（鉴权路线 C 方案）。_

---

## [变更单 2026-07-21-28] Sprint 4 W16 S4-8：v1.0 文档收口 ✅

**日期**：2026-07-21
**类型**：文档收口（Sprint 4 W16）
**影响范围**：README.md + CHANGELOG.md + KANBAN.md

**内容**：
- `README.md` 全面重写，同步 Sprint 1~4 完成状态
  - 更新目录结构（实际部署名称：`cimrms-api`/`cimims-api`/`cim-perm`/`mdm-api`）
  - Sprint 路线图表：Sprint 1-4 全部 ✅ + v1.0 GA 标注
  - Sprint 4 完成清单（S4-1~8 全部 ✅）
  - 核心文档索引（CHANGELOG / TEST_REPORT_v6 / KANBAN / k6 README）
  - ADR 状态表（ADR-0005 ⚠️ / ADR-0006~8 ✅）
  - 路径前缀约定（Azure cloudapp DNS 不可用规则）
  - Docker 快速启动说明
- `docs/Sprint4/KANBAN.md` S4-8 + Sprint 4 收口 → ✅ 2026-07-21
- `docs/CHANGELOG.md` 变更单-28 记录

**版本**：v1.0 GA · 2026-07-21

---

## 已批准（Approved）

### [变更单 2026-07-17-01] 鉴权路线：ADR-0005 vs AUTH_HYBRID_PRD ✅

**决策**：**C 方案**（M365 OAuth + MDM 应急，**不上 TOTP MFA**）

**决策日期**：2026-07-17
**决策人**：Jerry（架构）+ Mavis（实施）
**取代**：[ADR-0005](./ADR/0005-mdm-only-auth.md) → ⚠️ Superseded by [ADR-0006](./ADR/0006-auth-hybrid-c.md)
**实施文档**：[Sprint2/AUTH_HYBRID_C_CHECKLIST.md](./Sprint2/AUTH_HYBRID_C_CHECKLIST.md)

**核心要点**：
1. **生产**：M365 OAuth 主登录（99%）；MDM 账号密码应急（1% / DR 战备级）
2. **dev**：账号密码 = **主入口**（无 M365 tenant）；M365 mock 占位
3. **不上 TOTP MFA**（港府审计核心 = SSO 来源可追溯，M365 已满足；MFA 推 V2）
4. **不上 forgot-password 邮件流**（改用 admin 在 MDM 重置密码）
5. **dev_login 收紧为 admin-only**（必须 `ADMIN_KEY` env；7 天过渡期后永久保留）

**Prisma schema 变化**：补 **2 字段**（`m365_object_id` / `m365_synced_at`）—— 比 PRD 估的 6 字段少（PRD 包含 TOTP / reset token，本方案不上）

**Sprint 2 工作量**：5.5 人日（vs PRD 估 12.5d 从零起；vs 6.5d 实施 ADR-0005）

**理由（为什么选 C 不选 B/A）**：
- **A 退役原因**：漏了港府非营利受资助方审计要求"SSO 登录来源可追溯"硬约束
- **B 不选原因**：TOTP MFA 不是审计硬要求；DR 断 M365 时用户手机可能也无网
- **C 折中**：满足审计 + 简化 + 5.5d 装得下

**后续动作**：
- [x] 新建 ADR-0006 ✅
- [x] ADR-0005 标 Superseded ✅
- [x] AUTH_HYBRID_PRD 标"已采纳 C 方案" ✅
- [x] Sprint 2 任务表加 T1-T10（5.5d / 2 人并行）✅
- [x] CHANGELOG 标记 ✅
- [ ] Sprint 2 启动会宣贯（07-20）
- [ ] TEST_REPORT v4（08-08）

**回滚方案**：见 [ADR-0006 §七](../ADR/0006-auth-hybrid-c.md)

### [变更单 2026-07-17-02] 5 系统完成度基线（v1.1-baseline）

**变更**：从 v1.0-baseline 提升为 v1.1-baseline
**原因**：Sprint 2 6/6 任务全部 PASS，4 Critical 修复、4 High 修复、RBAC 角色守卫落地、bcrypt 密码体系上线
**影响**：所有 sprint 末文档同步状态；新文档以此为基线
**决策**：Mavis（实施）+ Jerry（架构）2026-07-17

### [变更单 2026-07-17-03] 冻结 teams-notify-sdk 接入

**变更**：`packages/teams-notify-sdk` 编译完成（17 文件，4 dist），**不接入 4 API**
**原因**：等鉴权路线（变更单 2026-07-17-01）拍板后再决定是否使用
**影响**：避免 M365 路线半途切换的返工
**决策**：Mavis 2026-07-17

---

## 变更日志（按时间倒序）

| 日期 | 变更单 | 任务 | 调整 | 原因 | 决策人 |
|------|--------|------|------|------|--------|
| 2026-07-21 | 2026-07-21-28 | Sprint 4 W16 S4-8：v1.0 文档收口 | ✅ 完成 | README.md 全面同步 Sprint 4 完成状态（Sprint 1-4 全部 ✅ / v1.0 GA）；KANBAN 归档 S4-1~8；变更单-28 记录 | Mavis |
| 2026-07-21 | 2026-07-21-27 | Sprint 4 W16 S4-7：TEST_REPORT_v6（v1.0 全面覆盖）| ✅ 完成 | 自动脚本 + curl 验证；S4-1 i18n 5/5 ✅ / S4-2 error i18n 6/6 ✅ / S4-3 audit 3/3 ✅ / S4-4 SQL 2/2 ✅ / S4-5 k6 4/4 ✅ / S4-6 types 6/6 ✅；TypeScript 编译 0 错误；总计 27/27 PASS；TEST_REPORT_v6.md 已产出 | Mavis |
| 2026-07-21 | 2026-07-21-26 | Sprint 4 W16 S4-6：OpenAPI → 前端 types（orval）| ✅ 完成 | 4 API openapi.yaml 编写（mdm-api 22KB / cimrms-api / cimims-api / cim-perm）；orval v8 配置（本地 YAML 输入 + 各 API 独立子目录）；orval `operationName` override 签名 bug（`(operation) => operation.operationId` 而非错误的 `({ operationName }) => operationName`）；fix mutator `export` 缺失；`clean: true` 互相覆盖 bug → 各 API 独立目录；TypeScript 编译 0 错误；产物：`src/api/generated/{api}/{api}.ts` + `*.schemas.ts` | Mavis |
| 2026-07-20 | 2026-07-20-22 | Sprint 4 W13 S4-1：i18n 框架接入 | ✅ 完成 | `react-i18next` + `i18next-browser-languagedetector`；3 种语言 zh-HK/繁中 zh-CN/简体 en-US/英文；Header 语言切换器（Globe 图标）；Sidebar/Header/Login 关键文案全部 i18n 化；language 持久化 localStorage；portal Docker rebuild | Mavis |
| 2026-07-20 | 2026-07-20-16 | Sprint 3 W4 A10：4 API Swagger UI 暴露 | ✅ 完成 | @fastify/swagger + @fastify/swagger-ui 注册；4 API 非生产自动暴露 /docs；cim-perm 装 swagger 包；4 API typecheck 全 PASS | Mavis |
| 2026-07-20 | 2026-07-20-17 | Sprint 3 W4 A14：删除非 MDM API dev_login | ✅ 完成 | cimrms/cimims/cim-perm DEV_LOGIN_ENABLED=false；mdm-api 保留本地开发入口 | Mavis |
| 2026-07-20 | 2026-07-20-18 | Sprint 3 W4 S3-10：登录审计 API + portal 页面 | ✅ 完成 | loginAudit.ts（GET /login-audit /failed-logins /summary）；MdmLoginAudit.tsx portal 页面；Sidebar 入口；mdm.ts service helpers | Mavis |
| 2026-07-20 | 2026-07-20-19 | Sprint 3 W4 S3-13：部署文档 DEPLOY.md | ✅ 完成 | 完整 DEPLOY.md：架构概览 / 快速启动 / Swagger UI / 鉴权设计 / 登录审计 / WebSocket / env 参考 / 重启清单 / DB schema / FAQ | Mavis |
| 2026-07-20 | 2026-07-20-20 | Sprint 3 W4 S3-12：TEST_REPORT_v5 | ✅ 完成 | 覆盖 W3（W3 A15/S3-8 鉴权守卫/资源RBAC）+ W4（A10/A14/S3-10）；4 API typecheck PASS + curl API 验证 | Mavis |
| 2026-07-20 | 2026-07-20-14 | Sprint 3 W3：4 API 鉴权守卫统一（cimrms/cimims/cim-perm/mdm） | ✅ 完成 | @mrdi/shared/permission guards 替换 inline role 检查；cimims duty→editor 级别映射；cim-perm addHook→onRequest；cim-perm 类型修复（role→string / dept→department）；4 API typecheck 全 PASS | Mavis |
| 2026-07-20 | 2026-07-20-15 | Sprint 3 W3 S3-8：资源级 RBAC 接入 + @mrdi/shared permission 增强 | ✅ 完成 | checkResourcePermission helper 加到 @mrdi/shared/permission；cimrms transition（approve/reject/schedule）资源级 grant；cimims force-close/audit 资源级 grant；4 API typecheck 全 PASS | Mavis |
| 2026-07-17 | 2026-07-17-13 | Sprint 3 S3-4~7：WebSocket 实时推送（S3-4/5/6/7） | ✅ 完成 | cimrms-api KPI 5s push；cimims-api KPI 5s + 告警 1s push；前端 useWebSocket hook（指数退避重连）；CimrmsDashboard/CimimsDashboard 接入 WS；portal Docker 重建 | Mavis |
| 2026-07-17 | 2026-07-17-12 | Sprint 3 T9：Admin UI 改密/重置/解锁 dialog | ✅ 完成 | MdmUsers 3 dialog（解锁/重置密码/改密）；services/mdm.ts JWT Bearer 认证升级；mdm-api PATCH /v1/users/:id/password；Docker 镜像重建；E2E 测试 PASS | Mavis |
| 2026-07-17 | 2026-07-17-09 | Sprint 3 T10：Sprint 2 Retrospective + 文档收口 | ✅ 完成 | MASTER_PLAN.md 同步 T1-T9 实际完成时间；CHANGELOG.md 加 T1/T10 条目；Sprint 2 正式收口 | Mavis |
| 2026-07-17 | 2026-07-17-01 | Sprint 3 T1：Prisma 补 M365 2 字段 | ✅ 完成 | `m365_object_id` + `m365_synced_at`；作为 A11 7字段扩展同步完成（prisma db push）| Mavis |
| 2026-07-17 | 2026-07-17-08 | Sprint 3 T7：Profile 改密页 + Auth 守卫 | ✅ 完成 | Profile.tsx+change-password+Sidebar入口+RequireAuth守卫；8 PASS；mdm-api change-password 新增返回 JWT | Mavis |
| 2026-07-17 | 2026-07-17-07 | Sprint 3 T9：E2E 集成测试 + TEST_REPORT_v4 | ✅ 完成 | 22 PASS / 0 FAIL；T2/T3/T5/T6/T8 全覆盖；TEST_REPORT_v4.md 已产出 | Mavis |
| 2026-07-17 | 2026-07-17-06 | Sprint 3 T5/T6/T8 后端鉴权完成 | ✅ 完成 | bcrypt+LoginAudit+change-password+admin unlock/reset；10+ 测试场景 PASS | Mavis |
| 2026-07-17 | 2026-07-17-05 | Sprint 3 T3 M365 OAuth mock client | ✅ 完成 | dev mock IDP；authorize → callback → JWT 全流程 PASS | Mavis |
| 2026-07-17 | 2026-07-17-04 | Sprint 3 T2 ADMIN_KEY 中间件 | ✅ 完成 | dev_login 收紧；3 场景测试 PASS | Mavis |
| 2026-07-17 | 2026-07-17-01 | 鉴权路线 = C 方案 | ✅ 已批准 | 港府审计硬约束；ADR-0005 退役；ADR-0006 生效 | Jerry + Mavis |
| 2026-07-17 | 2026-07-17-02 | v1.0 → v1.1 baseline | 提升基线 | Sprint 2 6/6 PASS | Mavis + Jerry |
| 2026-07-17 | 2026-07-17-03 | teams-notify-sdk 接入 | 冻结 | 等鉴权路线拍板 | Mavis |
| 2026-07-17 | 2026-07-17-01 | 鉴权路线决策 | ~~待拍板~~ → 已批准 | ADR-0005 vs AUTH_HYBRID 冲突 | Jerry |
| 2026-07-16 | — | Sprint 2 启动 | scope 拍板 | 按 MASTER_PLAN §三 | Jerry |
| 2026-07-16 | — | Sprint 1 MVP 收口 | v1.0-baseline 落地 | 7 容器全 healthy | Mavis + Jerry |

### [变更单 2026-07-17-04] Sprint 3 T2：ADMIN_KEY 中间件完成

**变更**：`mdm-api` dev_login 受 `ADMIN_KEY` 环境变量保护
**实施**：
- `mdm-api/.env` 加 `ADMIN_KEY=mrdi-dev-admin-key-2026`
- `mdm-api/.env.example` 加 `ADMIN_KEY=` placeholder
- `mdm-api/src/config/env.ts` 加 `ADMIN_KEY: z.string().optional()`
- `mdm-api/src/app.ts` 加 root scope `onRequest` hook（`/dev/login` 检测 → ADMIN_KEY 检查）
- `docker-compose.yml` mdm-api service 加 `ADMIN_KEY: mrdi-dev-admin-key-2026`
- `prisma db push` 同步 schema（含 `m365_object_id` / `m365_synced_at`）

**测试结果**：
- 无 `admin_key` 参数 → 403 `EMERGENCY_ACCESS_DISABLED` ✅
- 错误 `admin_key` → 403 `EMERGENCY_ACCESS_DISABLED` ✅
- 正确 `admin_key=mrdi-dev-admin-key-2026` → 200 + JWT token ✅

**技术细节**：
- Fastify `onRequest` hook 必须在 **root scope** 注册（直接在 `app.ts` 级别），不能用 `fp()` 封装插件，因为 `fp()` 的 encapsulated scope 会阻止 hook 传播到 child scope 的路由
- `fp()` 默认 `encapsulate=true`，即使加 `{ encapsulate: false }` 仍有 scope 隔离问题
- `dev_login` 检测字符串改为 `/dev/login`（路径格式），不是 `dev_login`（下划线格式）

### [变更单 2026-07-17-05] Sprint 3 T3：M365 OAuth Mock Client 完成

**变更**：新增 `mdm-api/src/services/m365MockClient.ts` + 3 个 mock OAuth routes
**实施**：
- `M365MockClient` 类：`authorize()` / `exchangeCode()` / `getMe()` 三步模拟
- `GET /auth/v1/m365/mock-users` — 返回 3 个 dev mock 用户（admin / editor / viewer）
- `GET /auth/v1/m365/authorize?email=xxx` — 生成 mock auth code + redirect URL
- `POST /auth/v1/m365/callback` — code → token → Graph API `/me` → upsert user → JWT
- `M365_MOCK_ENABLED` env var（默认 `true`，`NODE_ENV=development` 时激活）
- code→user 映射用 in-memory Map（5 分钟过期，code 一次性）

**测试结果**：
- `GET /auth/v1/m365/mock-users` → 3 用户列表 ✅
- `GET /auth/v1/m365/authorize?email=editor@...` → code ✅
- `POST /auth/v1/m365/callback` with editor code → JWT + role:editor ✅
- `POST /auth/v1/m365/callback` with viewer code → JWT + role:viewer ✅
- `POST /auth/v1/m365/callback` with invalid code → 400 ✅

### [变更单 2026-07-17-06] Sprint 3 T5/T6/T8：账号密码鉴权 + change-password + admin unlock/reset

**变更**：后端鉴权 endpoints 完整化
**实施**：
- `POST /auth/v1/change-password`（T6）：密码强度校验（12+字符/大写/小写/数字/特殊）+ password_history（最近5次不可重用）+ bcrypt cost=12
- `POST /auth/v1/unlock/:email`（T8）：admin 解锁任意用户；清除 failed_login_count + locked_until
- `POST /auth/v1/admin/reset-password`（T8）：admin 重置密码；must_change_password=true；解锁账号
- LoginAudit 6 events 完整化：`auth.login.fail` / `auth.login.lock`（锁定触发时）/ `auth.login.success` / `auth.password.changed` / `auth.user.unlocked` / `auth.password.reset`
- 登录强制改密：must_change_password=true 时返回 200 + token=null + requirePasswordChange=true
- Prisma schema：`NotificationType` 加 `account_unlocked`

**测试结果**（10+ 场景全 PASS）：
- 错误密码登录 → 401 ✅ | 正确密码 → 200 ✅
- change-password 错误旧密码 → 401 ✅ | 正确旧密码 → 200 ✅ | 新旧相同 → 400 ✅
- 密码强度（过短/无大写/无特殊）→ 400 ✅
- admin unlock 非admin → 403 | 不存在 → 404 | 未锁定 → 400 | 正常 → 200 ✅
- admin reset password → 200 + must_change_password=true ✅ | reset 自己 → 400 ✅
- admin reset 后登录 → requirePasswordChange=true ✅

### [变更单 2026-07-17-08] Sprint 3 T7：Profile 改密页 + Auth 守卫

**变更**：前端完整 Auth C 方案落地
**T7c — Profile 改密页：**
- `mrdi-portal/src/pages/Profile.tsx`：新页面，用户信息卡 + change-password 表单
- 实时密码强度检查（大写/小写/数字/特殊/12+字符），逐条显示
- `mrdi-portal/src/store/authStore.ts`：`apiChangePassword()` helper
- `mdm-api/src/routes/auth.ts`：`change-password` 成功后返回新 JWT
- Sidebar 用户菜单 → "账号设置" → `/profile`
- 改密成功后 authStore 更新 JWT → redirect to `/`

**T7d — Auth 守卫：**
- `RequireAuth`：未登录 → `/login`；token=null（强制改密）→ `/profile`
- `/profile` 路由挂载在 Portal Shell（Layout 内）
- 登录页 `must_change_password=true` → navigate `/profile`

**mdm-api TypeScript 修复：**
- `UserWithPassword` 接口补全（`m365_object_id`/`m365_synced_at`/`password_history`）
- Prisma upsert `m365_object_id` 字段加 `as any`（pre-generated Prisma client 未含此字段）
- `m365MockClient`：`MOCK_USERS[0]!` 断言（`noUncheckedIndexedAccess`）

**测试结果**（8 PASS）：
- admin reset → login → requirePasswordChange=true + token=null ✅
- dev_login bypass → token for change-password ✅
- 错误旧密码 → 401 ✅ | 合法改密 → 200 + 新 JWT ✅
- 新密码登录 → JWT + must_change_password 清除 ✅
- portal `/profile` → 200 ✅

**端口修复：**
- `authStore.ts`：`localhost:3100` → `localhost:3000`（mdm-api 实际端口）

### [变更单 2026-07-17-07] Sprint 3 T9：E2E 集成测试 + TEST_REPORT_v4

**变更**：`mdm-api/test-auth-e2e.cjs` E2E 测试脚本修复 + 完整 TEST_REPORT_v4.md
**修复**：测试脚本中 T5/T6 suite 的 `must_change_password` 处理逻辑 bug——admin reset 后 login 返回 `token=null`，后续 `change-password` 无法获取 token。修复方案：使用 `dev_login`（bypasses `must_change_password`）获取 token，再调用 `change-password`
**测试结果**（22 PASS / 0 FAIL）：
- T2 ADMIN_KEY：3 PASS
- T3 M365 OAuth mock：4 PASS
- T5 密码登录 + LoginAudit：4 PASS（含 must_change_password 强制改密场景）
- T6 改密：6 PASS（含 5 种强度校验失败 + 合法改密）
- T8 Admin unlock/reset：5 PASS
**产出**：`docs/TEST_REPORT_v4.md` — 完整覆盖 T2/T3/T5/T6/T8，含安全检查清单

### [变更单 2026-07-17-11] Sprint 3 Week 1 提前交付（S3-1 BullMQ + A9 UI 组件）

**变更**：Sprint 3 Week 1 提前完成；S3-1 BullMQ worker 上线 + A9 @mrdi/ui 组件接入

**S3-1 BullMQ 完成（2026-07-17）**：
- ✅ `plugins/bullmq.ts`（Queue + Worker + QueueEvents 单件模式）
- ✅ BullMQ 连接：`{ host: 'redis', port: 6379, maxRetriesPerRequest: null }`
- ✅ `POST /v1/notifications/send`：enqueue job → worker 写 DB（`1 notifications written`）
- ✅ `/health` 暴露 `queue: up` 状态
- ✅ `REDIS_URL` env var（`redis://redis:6379`）+ docker-compose 配置
- ✅ Prisma schema FK 移除（`Notification.recipient_email` 不再 FK 到 User）
- ✅ `fp()` plugin name 显式声明（`name: 'prisma'` / `name: 'bullmq'`）
- ✅ BullMQ `maxRetriesPerRequest: null` → `as any` 类型断言
- ✅ IORedis URL → `{ host, port }` 解析（Docker service name 兼容）

**A9 @mrdi/ui 组件接入完成（2026-07-17）**：
- ✅ `@mrdi/ui/components/Badge.tsx` → Notifications.tsx（通知类型标签）
- ✅ `@mrdi/ui/components/Button.tsx` → Login.tsx（M365 登录按钮）
- ✅ `@mrdi/ui/components/Button.tsx` → Notifications.tsx（全部标为已读、标记已读、删除）
- ✅ `@mrdi/ui/components/Button.tsx` → Profile.tsx（确认修改密码按钮）
- ✅ `authStore.ts`：`apiChangePassword` 返回类型补 `token?: string`

**技术踩坑记录**：
1. `fp()` plugin name 默认用函数名推导，与其他 plugin 可能冲突 → 加 `name:` 显式声明
2. BullMQ v5 要求 `maxRetriesPerRequest: null`，IORedis types 不认 → `as any`
3. IORedis URL 解析在 Docker service name 有 bug（`redis://redis:6379` 把 `redis` 当 hostname）→ 改用 `{ host, port }` 格式
4. PostgreSQL FK 约束阻止发给非注册用户 → 移除 `@relation` directive

**Sprint 3 进度**：Week 1 ✅ → Week 2 ⏳（WebSocket）

---

### [变更单 2026-07-17-10] Sprint 3 启动 + 通知 MVP 现状盘点

**变更**：Sprint 3 看板建立；通知系统 MVP 现状确认
**Sprint 3 启动时间**：2026-07-17（比原计划 08-11 提前 3 周）
**看板**：[docs/Sprint3/KANBAN.md](./Sprint3/KANBAN.md)

**通知系统现状（已就绪）**：
- ✅ Notification backend CRUD：`routes/notifications.ts` + `services/notificationService.ts`
- ✅ Portal 通知页面：`Notifications.tsx`（分页/筛选/已读/删除/全部标已读）
- ✅ Header bell badge：`Header.tsx` 含 unread count 角标
- ✅ `@mrdi/shared` MdmClient 含 `sendNotification()` stub

**S3-1 完成（2026-07-17）**：
- ✅ BullMQ worker plugin：`plugins/bullmq.ts`（Queue + Worker + QueueEvents）
- ✅ `POST /v1/notifications/send`：走 BullMQ 异步队列 → worker 写 DB
- ✅ `/health` 暴露 `queue: up/down` 状态
- ✅ `REDIS_URL` 环境变量（`redis://redis:6379`）+ docker-compose 配置
- ✅ BullMQ `maxRetriesPerRequest: null`（IORedis BullMQ 兼容性）
- ✅ Prisma schema FK 移除：`Notification.recipient_email` 不再 FK 到 User
- ✅ 测试：job → `1 notifications written` ✅

**技术细节**：
- BullMQ 连接用 `{ host: 'redis', port: 6379 }` 格式（IORedis URL 解析在 Docker service name 有 bug）
- `fp()` plugin name 显式声明（`name: 'prisma'` / `name: 'bullmq'`）避免 name 推导冲突
- BullMQ `maxRetriesPerRequest: null` 需 `as any` 类型断言（IORedis types 不认此选项）
- `Notification.recipient_email` 解除 FK 后可发给任意 email（包括非注册用户）

### [变更单 2026-07-20-14] Sprint 3 W3：4 API 鉴权守卫统一 + @mrdi/shared/permission 升级

**变更**：Sprint 3 W3 资源级 RBAC 守卫接入 4 个 API；`@mrdi/shared/permission` 全套 guards 替换 inline role 检查
**实施日期**：2026-07-20

**cimrms-api（`routes/requests.ts`）**：
- 导入 `requireAdmin` / `requireAuditor` / `requireEditor`
- `approve` / `reject` → `requireAuditor()`（auditor+）
- `schedule` / `escalate` → `requireEditor()`（editor+）
- 删除冗余 `isAuditor` / `isEditor` 变量

**cimims-api（`routes/incidents.ts`）**：
- 导入 `requireAdmin` / `requireAuditor` + 新增 `requireDutyOrAbove()` 本地 helper
- `take-over` / `transfer` → `requireDutyOrAbove()`（duty/editor/admin）
- `mark-resolved` → 非当前处理人调用 `requireAdmin()`
- `force-close` / `audit` → `requireAuditor()`
- `duty` 角色映射为 editor+ 级别（IMS 特有角色）

**cim-perm（`routes/requests.ts`）**：
- 导入 `requireViewer` / `requireEditor` / `requireAuditor`
- `addHook('onRequest')` 全局 hook → 各路由 `onRequest: async (req) => { app.auth(req); }`
- `POST /requests` / `GET /requests` / `POST /requests/:id/comment` → `requireViewer()`
- `POST /requests/:id/it-review` → `requireEditor()`
- `POST /requests/:id/owner-review` / `revoke` / `extend` / `GET /audit` → `requireAuditor()`
- 类型修复：`AuthUser.role` 字面量联合 → `string`（匹配 @mrdi/shared）；`user.dept` → `user.department`

**mdm-api（`routes/users.ts`）**：
- `PATCH /v1/users/:id/password` inline admin 检查 → `requireAdmin()`

**技术细节**：
- `@mrdi/shared/permission` 的 `AuthUser.role: string` 类型宽松；cim-perm `types/index.ts` 需同步为 `role: string`（不能用字面量联合）
- cimims `duty` 角色是值班表特有，不在标准角色体系；用 `requireDutyOrAbove()` 本地 helper 处理（允许 duty/editor/admin）
- cimims `mark-resolved` 保留业务逻辑（当前处理人 OR admin），其余改为统一 guards

**TypeScript 验证**：4 API 全部 `pnpm typecheck` 通过 ✅

### [变更单 2026-07-20-15] Sprint 3 W3 S3-8：资源级 RBAC 接入 + @mrdi/shared permission 增强

**变更**：`@mrdi/shared/permission` 新增 `checkResourcePermission()`；cimrms / cimims 关键端点接资源级权限
**实施日期**：2026-07-20

**`@mrdi/shared/permission` 增强**：
- 新增 `checkResourcePermission(mdmClient, user, resourceGroup, resourceName, action, resourceId, logFn)` 函数
- 查询 MDM `/permissions/check` API → 返回用户的 permission_id 列表
- MDM 不可用时 fail-open（返回空数组，角色检查兜底）
- 接口化解耦（接受任意含 `checkPermission()` 的对象，不依赖具体 MdmClient class）

**cimrms-api（`routes/requests.ts`）**：
- `approve` / `reject`：auditor+ OR `cimrms:request:approve` 资源级 grant
- `schedule` / `escalate`：editor+ OR `cimrms:request:schedule` 资源级 grant
- 先尝试角色检查，失败则查 MDM permission_grants 表

**cimims-api（`routes/incidents.ts`）**：
- `force-close`：auditor+ OR `cimims:incident:admin` 资源级 grant
- `audit`：auditor+ OR `cimims:incident:audit` 资源级 grant
- 同样 try-role → fail → check-grant 降级路径

**cimrms/cimims 类型修复**：
- `types/mdm-client.d.ts` 补全 `checkPermission` / `grantPermission` / `revokePermission` 方法声明（本地 .d.ts 覆盖了 @mrdi/shared 的真实模块）

**技术细节**：
- permission_id 格式：`{group}:{resource}:{action}`，如 `cimrms:request:approve`
- resourceId 传具体实例 ID（如 NC-2026-0001），MDM `/permissions/check` 查 `permission_grants` 表
- fail-open 设计：MDM 挂了不影响现有角色检查流程，资源级 grant 校验优雅降级

**TypeScript 验证**：cimrms ✅ / cimims ✅ / cim-perm ✅ / mdm ✅

### [变更单 2026-07-17-13] Sprint 3 S3-4~7：WebSocket 实时推送

**变更**：后端 KPI/告警 5s/1s 推送 + 前端 WS client hook + Dashboard 实时刷新

**后端（cimrms-api）**：
- `plugins/websocket.ts` 加 `onReady` KPI push timer
- 每 5s 查询 DB（totalActive / inProgress / pendingUat / pendingAcceptance / closed / newToday）
- `broadcast('kpi:rms:update', payload)` → 所有在线 WS 客户端
- 有客户端才推送（`clients.size === 0` 跳过）

**后端（cimims-api）**：
- `@fastify/websocket@^11.3.0` 安装（package.json 补）
- KPI 5s push：`kpi:ims:update`（newToday / openTotal / slaWarn / slaBreach / processing）
- 告警 1s push：`alarm:ims:new`（P1/P2 新增 incident，广播给 duty+ / admin）
- Prisma schema 字段 `relatedSystem`（非 `systemName`）修正

**前端（S3-7）**：
- 新建 `hooks/useWebSocket.ts`：mount→连接 / unmount→断开；JWT Bearer 自动注入；指数退避重连（max 30s）；事件订阅；5 个状态暴露
- `CimrmsDashboard.tsx`：接入 RMS WS → `kpi:rms:update` → `invalidateQueries(['cimrms', 'dashboard'])`
- `CimimsDashboard.tsx`：接入 IMS WS → `kpi:ims:update` → invalidate + `alarm:ims:new` → toast 通知
- 两个 Dashboard 加 "Live" / "重连中" 状态角标

**Docker 重建**：
- `mrdi/cimrms-api:latest` ✅
- `mrdi/cimims-api:latest` ✅
- `portal-mrdi-portal:latest` ✅

**技术细节**：
- WS URL：`ws://localhost:3001/v1/ws`（cimrms）/ `ws://localhost:3002/v1/ws`（cimims）
- Token 注入：`?token=${jwt}` query param（与后端 `url.searchParams.get('token')` 对应）
- 重连策略：指数退避（base 500ms × 2^n，max 30s），maxRetries=10
- 30s polling 作为 WS 断线 fallback（S3-7 完成）

### [变更单 2026-07-17-12] Sprint 3 T9：Admin UI 改密/重置/解锁 dialog

**变更**：MdmUsers 页面 + Admin 账号管理 3 dialog 完成
**实施**：

**后端**：
- `PATCH /v1/users/:id/password`：admin 直接改密（不清除 must_change_password 标记）；bcrypt cost=12；400 if not admin
- `POST /auth/v1/unlock/:email`：admin 解锁账号（清除 locked_until + failed_login_count）；发站内信通知
- `POST /auth/v1/admin/reset-password`：admin 重置密码 + must_change_password=true；发站内信

**前端（`MdmUsers.tsx`）**：
- `services/mdm.ts` auth 升级：从 `dev_login=true` query param → **JWT Bearer token**（从 authStore localStorage 读取）
- `services/mdm.ts` 新增：`adminUnlock()` / `adminResetPassword()` / `adminChangePassword()`
- MdmUsers 操作列：**解锁**（账号 Suspended 时才显示）/ **重置密码** / **改密**（3 个 Button dialog）
- 解锁 dialog：状态展示 + 确认按钮 + 成功后刷新列表
- 重置密码 dialog：随机密码生成 + 密码强度 5 条实时校验 + 警告说明（强制改密）
- 改密 dialog：密码强度校验 + 随机密码生成
- `@mrdi/ui/Button` 组件接入所有确认按钮
- `useAuthStore` 判断 admin 角色；非 admin 降级为"赋予角色"按钮

**测试结果（3/3 PASS）**：
- `PATCH /v1/users/:id/password` → `已为 xxx 修改密码` ✅
- `POST /auth/v1/unlock/:email`（账号未锁定）→ `400：该账号未被锁定` ✅
- `POST /auth/v1/admin/reset-password`（admin 重置自己）→ `400：管理员不能重置自己的密码` ✅
- `POST /auth/v1/admin/reset-password`（admin 重置其他用户）→ `已为 xxx 重置密码` ✅

**Docker 重建**：
- `portal-mrdi-portal:latest`：build ✅（3944 modules）
- `mrdi/mdm-api:latest`：TypeScript rebuild + docker build ✅

**技术细节**：
- `getJwt()` 从 localStorage 读取 authStore persist 数据（key: `mrdi-auth`）
- 后端 admin unlock/reset 返回 `status 400` 时前端直接 toast 展示后端 message
- PowerShell `Invoke-RestMethod` 对无 body POST 报错 → 用 `WebRequest` + explicit ContentType

---

## [变更单 2026-07-20-21] BugFix: @fastify/swagger 版本修复

**日期**：2026-07-20
**类型**：BugFix
**影响范围**：A10（Swagger UI）全部 4 个 API

**问题**：
- `@fastify/swagger@^9.0.0` 要求 Fastify 5.x，但所有 API 均使用 `fastify@^4.28.0`
- 错误：`FastifyError: fastify-plugin: @fastify/swagger - expected '5.x' fastify version, '4.29.1' is installed`

**修复**：
- 4 个 API（mdm-api, cimrms-api, cimims-api, cim-perm）package.json 中：
  - `@fastify/swagger: ^9.0.0` → `^8.0.0`
  - `@fastify/swagger-ui: ^4.1.0` → `^4.0.0`
- `pnpm install` + TypeScript rebuild + Docker rebuild

**技术细节**：
- Docker build 时 `NODE_ENV=production` 会跳过 devDependencies
- PowerShell `docker build` exit code 1 是 false positive（镜像实际 build 成功，named+unpacked）
- docker-compose.yml 中 cimrms-api/cimims-api/mrdi-portal 用 `build:` 指令，旧镜像是 `cimrms-api:latest`，已改为 `image: mrdi/xxx:latest` 直接引用构建镜像
- **Root cause**：Dockerfile 中 `echo '{...}' > ./package.json` 硬编码了 `@fastify/swagger: "^9.0.0"`，本地 package.json 修改不影响 Docker build；`--no-cache` 仍用旧 echo 内容
- **最终解决方案**：直接修改 Dockerfile 中 `echo` 里的版本号 → `@fastify/swagger: ^8.0.0` + `@fastify/swagger-ui: ^4.0.0`，4 个 Dockerfile 全改
- **验证**：镜像 swagger 版本 8.15.0 ✅；所有 4 API health ✅ + Swagger UI (`/docs/`) 200 ✅
- **镜像时间戳**：2026-07-20 15:55 CST

**文件变更**：
- `mdm-api/package.json`：`@fastify/swagger` + `@fastify/swagger-ui` 版本
- `cimrms-api/package.json`：`@fastify/swagger` + `@fastify/swagger-ui` 版本
- `cimims-api/package.json`：`@fastify/swagger` + `@fastify/swagger-ui` 版本
- `cim-perm/package.json`：`@fastify/swagger` + `@fastify/swagger-ui` 版本
- `docker-compose.yml`：移除 cimrms-api/cimims-api/mrdi-portal 的 `build:` 指令，改用 `image:`


---

---

## [变更单 2026-07-20-23] Sprint 4 W13 S4-3：跨系统统一审计日志

**日期**：2026-07-20
**类型**：Feature（Sprint 4 W13）
**影响范围**：MDM AuditLog + 3 个业务 API（cimrms / cimims / cim-perm）+ Portal 审计页面

**设计**：
- MDM Prisma `AuditLog` 表：写入端来自 3 个业务系统，查询端在 portal
- 各系统用 `X-Service-Token` 调用 MDM `POST /v1/audit/events` 写入审计事件（非关键路径，失败不抛错）
- `sourceSystem` 写入 metadata JSONB，避免 schema 迁移
- 业务 API 端：`MdmClient.auditEvent()`（`@mrdi/shared`）统一封装

**实现细节**：

| 系统 | 路由 | 审计事件 |
|------|------|---------|
| cimrms-api | `performTransition` | `request.{approve/reject/submit/schedule/deploy...}` |
| cimims-api | `incidents.ts` | `incident.{create/take_over/mark_resolved/confirm/reject/force_close}` |
| cim-perm-api | `requests.ts` | `perm.{create/it_review/owner_review/revoke/extend}` |
| cim-perm-api | `app.ts` | 新增 MDM plugin（`MdmClient`）|
| mdm-api | `routes/audit.ts` | `POST /v1/audit/events`（service token）+ `GET /v1/audit`（admin JWT）|
| mrdi-portal | `pages/mdm/MdmAudit.tsx` | 替换 mock → 真实 API（分页/筛选）|

**文件变更**：
- `mdm-api/src/routes/audit.ts` — 新增，S4-3a ✅
- `packages/shared/src/mdm-client/index.ts` — `MdmClient.auditEvent()`，S4-3b ✅
- `cimrms-api/src/routes/requests.ts` — `performTransition` 加 auditEvent，S4-3c ✅
- `cimims-api/src/routes/incidents.ts` — 6 个 transition handler 加 auditEvent，S4-3d ✅
- `cim-perm/src/app.ts` — 注册 `mdmPlugin` ✅
- `cim-perm/src/plugins/mdm.ts` — 新增，`MdmClient` 注入 ✅
- `cim-perm/src/config/env.ts` — 加 `MDM_BASE_URL` + `SERVICE_TOKEN` ✅
- `cim-perm/src/routes/requests.ts` — 5 个 handler 加 auditEvent，S4-3d ✅
- `mrdi-portal/src/services/mdm.ts` — `getMdmAuditLogs()`，S4-3e ✅
- `mrdi-portal/src/pages/mdm/MdmAudit.tsx` — 重写，接真实 API，S4-3e ✅
- `cimrms-api/src/types/mdm-client.d.ts` — 加 `auditEvent` stub ✅
- `cimims-api/src/types/mdm-client.d.ts` — 加 `auditEvent` stub ✅
- `cimrms-api/tsconfig.json` — 统一 paths 格式 ✅
- `cimims-api/tsconfig.json` — 统一 paths 格式 ✅

**Typecheck**：
- 全部 5 个项目（mdm-api / cimrms-api / cimims-api / cim-perm / mrdi-portal）：✅ 无错误

**维护人**：Mavis

---

---

## [变更单 2026-07-21-24] Sprint 4 W13 S4-2：后端 Zod 错误 i18n 化

**日期**：2026-07-21
**类型**：Feature（Sprint 4 W13）
**影响范围**：4 个 API 的 Zod 错误响应格式

**设计**：
- Zod validation error 返回 `{ error: { code: 'VALIDATION_ERROR', i18nKey: 'validation_error', message: '参数校验失败', issues: [...] } }`
- `issues[].i18nKey` 格式：`{system}.validation.{field}.{issueCode}`，例如 `cimrms.validation.title.required`
- portal locale 文件新增 `validation.*` i18n keys（zh-HK / zh-CN / en-US）

**实现细节**：
- `@mrdi/shared/errors` 新增 `zodIssuesToI18n(issues, systemPrefix)` 函数
- 4 个 API `plugins/errorHandler.ts` 的 ZodError 分支统一改造：
  - `mdm-api` → systemPrefix `'mdm'`
  - `cimrms-api` → systemPrefix `'cimrms'`
  - `cimims-api` → systemPrefix `'cimims'`
  - `cim-perm` → systemPrefix `'cim-perm'`
- portal locale 新增 `validation` section（`error/required/invalid_type/invalid_string/invalid_email/string_too_short/too_small/too_big/enum/custom`）

**文件变更**：
- `packages/shared/src/errors/index.ts` — `zodIssuesToI18n()` + `I18nZodIssue` 接口
- `mdm-api/src/plugins/errorHandler.ts` — ZodError 分支改造
- `cimrms-api/src/plugins/errorHandler.ts` — ZodError 分支改造
- `cimims-api/src/plugins/errorHandler.ts` — ZodError 分支改造
- `cim-perm/src/plugins/errorHandler.ts` — ZodError 分支改造
- `mrdi-portal/src/i18n/locales/zh-HK.json` — 加 `validation` section
- `mrdi-portal/src/i18n/locales/zh-CN.json` — 加 `validation` section
- `mrdi-portal/src/i18n/locales/en-US.json` — 加 `validation` section

**Typecheck**：全部 4 API ✅ + shared ✅

### [变更单 2026-07-21-02] S4-5 k6 load test 基础设施 ✅

**日期**：2026-07-21
**类型**：Performance（Sprint 4 W13）
**影响范围**：4 个 API + k6 脚本

**k6 脚本**（`k6/*.js`）：
- `k6/mdm-api.js` — List users / Get profile / List systems
- `k6/cimrms-api.js` — List requests / Create request / List mine
- `k6/cimims-api.js` — List incidents / Create incident / List mine
- `k6/cim-perm-api.js` — List perm requests / Create / List mine
- `k6/README.md` — 运行说明

**API auth 修复**（k6 压测暴露的问题）：
- `cimims-api/plugins/auth.ts`：全局 `onRequest` hook 对 `/v1/auth/` 路由未跳过 JWT 验证，导致 dev-login 也被 block → 调整为 dev_login bypass 优先
- `cim-perm-api/plugins/auth.ts`：同上，`/perm-api/` 路由跳过 JWT，但 dev_login bypass 需在 skip 之前执行
- `docker-compose.yml`：mdm-api `DEV_LOGIN_ENABLED=true`（k6 测试用）

**文件变更**：
- `k6/cimrms-api.js` — 新建
- `k6/cimims-api.js` — 新建
- `k6/cim-perm-api.js` — 新建
- `k6/mdm-api.js` — 新建
- `k6/README.md` — 新建
- `cimims-api/src/plugins/auth.ts` — dev_login bypass 顺序修复
- `cim-perm-api/src/plugins/auth.ts` — dev_login bypass 顺序修复
- `docker-compose.yml` — mdm-api DEV_LOGIN_ENABLED=true

**维护人**：Mavis

### [变更单 2026-07-21-01] S4-4 SQL 慢查询优化 ✅

**日期**：2026-07-21
**类型**：Performance（Sprint 4 W13）
**影响范围**：cimrms-api

**问题**：cimrms `GET /v1/requests` 列表 N+1——`computeSlaPercent()` 对每条记录单独查 `slaConfig.findUnique()`，20 条记录 = 20 次额外查询。

**设计**：批量预加载 SLA configs，一次查询替代 N 次。

**实现细节**：
- `cimrms-api/src/services/requestService.ts` 新增 `loadSlaConfigs()` 批量加载函数
- `computeSlaPercent()` 新增可选 `slaMap` 参数，有 map 时走内存查找，无 map 时降级为单次查询（向后兼容）
- `requests.ts` list handler：`Promise.all([items, count, loadSlaConfigs()])`，传 map 给每个 item 的 SLA 计算
- `requests.ts` detail handler：同样改用 `loadSlaConfigs()` + map，避免 `computeSlaPercent` 和 `slaConfig.findUnique` 重复查询

**文件变更**：
- `cimrms-api/src/services/requestService.ts` — `loadSlaConfigs()` + `computeSlaPercent` 支持 slaMap 参数
- `cimrms-api/src/routes/requests.ts` — list + detail handler 使用批量加载

**Typecheck**：cimrms-api ✅ + cimims-api ✅ + cim-perm ✅ + mdm-api ✅

**维护人**：Mavis

---

---

## [变更单 2026-07-20-24] Sprint 4 W13 S4-2：后端错误响应 i18n 化

**日期**：2026-07-20
**类型**：Feature（Sprint 4 W13）
**影响范围**：4 个 API errorHandler + @mrdi/shared/errors + portal apiFetch + 3 个 locale

**设计**：
- 所有 error response 统一含 `code` + `i18nKey` + `message` + 可选 `details` / `issues`
- 后端不翻译（性能/一致性），前端 `tError(err)` 用 i18next 翻译
- `@mrdi/shared/errors` 提供 `errorCodeToI18nKey()`：标准 code → 标准 i18n key；未知 code → fallback `error.<code_lower>`
- Zod 动态 issue 仍走 `zodIssueToI18nKey()`：格式 `{system}.validation.{path}.{code}`

**实现细节**：

| 组件 | 改动 |
|------|------|
| `@mrdi/shared/errors` | 加 `errorCodeToI18nKey()`；`AppError` 构造函数加 `i18nKey?` 参数；`toJSON()` 输出 `i18nKey` |
| mdm-api errorHandler | 4 处 error 响应都加 `i18nKey`（AppError / ForbiddenError / UnauthorizedError / ZodError / FastifyError / Internal）|
| cimrms-api errorHandler | 同上 |
| cimims-api errorHandler | 同上 |
| cim-perm errorHandler | 同上（duck typing 也读 `i18nKey` 字段）|
| portal `services/mdm.ts` | `apiFetch` throw `ApiError`（含 i18nKey/code/message/status/details/issues）；`tError(err)` fallback 链：i18nKey → issues 逐条翻译（具体 key → 通用 validation.<code> → 原始 message）→ error.<code> → err.message |
| 3 个 locale | 加 `error` namespace（12 个 key）；`validation` namespace 已存在 |

**响应结构**（错误）：
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "i18nKey": "error.validation",
    "message": "参数校验失败",
    "issues": [
      { "path": "title", "code": "required", "i18nKey": "cimrms.validation.title.required", "message": "Required" }
    ]
  }
}
```

**Typecheck**：5 项目全 ✅

**文件变更**：
- `packages/shared/src/errors/index.ts` — `errorCodeToI18nKey()` + AppError `i18nKey` 字段
- `mdm-api/src/plugins/errorHandler.ts` — 所有分支加 i18nKey
- `cimrms-api/src/plugins/errorHandler.ts` — 同上 + 本地 AppError 加字段
- `cimims-api/src/plugins/errorHandler.ts` — 同上 + 本地 AppError 加字段
- `cim-perm/src/plugins/errorHandler.ts` — duck typing 读 i18nKey
- `mrdi-portal/src/services/mdm.ts` — `ApiError` class + `tError()` helper
- `mrdi-portal/src/i18n/locales/{zh-HK,zh-CN,en-US}.json` — `error` namespace

**维护人**：Mavis

---

---

## [变更单 2026-07-21-25] Sprint 4 W13 S4-5：k6 性能压测

**日期**：2026-07-21
**类型**：Feature（Sprint 4 W13）
**影响范围**：新增 `load-tests/` 目录 + k6 v0.55.0 脚本（4 个 API）

**设计**：
- 每个 API 一个 scenario 脚本（`load-tests/scenarios/{mdm,cimrms,cimims,cim-perm}-api.js`）
- 流量模型：ramp-up 20s → 持续 60s → ramp-down 20s
- 共用 `lib/auth.js` 通过 dev login 拿 JWT（带 ADMIN_KEY）
- 每个端点 P95/P99 阈值（threshold），不达标 k6 退出码非 0

**场景**：

| API | VU | 端点覆盖 | P95 阈值 | P99 阈值 |
|-----|----|---------|---------|---------|
| mdm-api | 50 | users / roles / notifications / audit | 300-500ms | 400-800ms |
| cimrms-api | 30 | list / dashboard / detail / create / approve | 200-600ms | 400-1000ms |
| cimims-api | 30 | list / dashboard / create / take-over | 200-600ms | 400-1000ms |
| cim-perm-api | 30 | list / dashboard / create / IT review | 400-600ms | 700-1000ms |

**执行**：
- `./k6.exe run load-tests/scenarios/<api>.js`
- 4 个并行跑（2m10s 各自）

**文件变更**：
- `load-tests/lib/auth.js` — `getDevToken()` + 工具函数
- `load-tests/scenarios/mdm-api.js`
- `load-tests/scenarios/cimrms-api.js`
- `load-tests/scenarios/cimims-api.js`
- `load-tests/scenarios/cim-perm-api.js`
- `load-tests/README.md`

**维护人**：Mavis

---

### [变更单 2026-07-21-01] cim-perm 403/500 根因修复 + k6 100% pass ✅

**问题**：k6 压测 cim-perm-api → 403 on it-review（20%）+ create 500（47%）

**根因 1 — JWT role 解码错误**（致 403）：
- mdm-api dev login JWT 字段为 `role: 'admin'`（字符串）
- cim-perm auth plugin 的 `mapM365RoleToAppRole()` 只读 `payload.roles`（M365 数组格式），对 mdm-api JWT 返回 `undefined`，降级为 `'viewer'`
- `it-review` 需要 `editor+` 角色 → 全部 403

**修复**：`cim-perm/src/plugins/auth.ts` — 新增 `mapRoleFromPayload()` 同时支持：
  1. `payload.role` 字符串（mdm-api 标准格式）
  2. `payload.roles[]` 数组（M365 OAuth 格式）
  优先级：显式字符串 > M365 数组

**根因 2 — MDM_BASE_URL 指向 localhost**（致 500）：
- cim-perm `.env` 缺少 `MDM_BASE_URL`，`loadEnv()` 默认为 `http://localhost:3000`
- 容器内 `localhost` 指向自己，不可达 mdm-api

**修复**：`cim-perm/.env` 加 `MDM_BASE_URL=http://mdm-api:3000` + `SERVICE_TOKEN=mrdi-dev-service-token-2024`

**根因 3 — itReview SQL CASE WHEN $1 类型冲突**（致 500）：
- `UPDATE ... SET status=$1, reject_reason=CASE WHEN $1='rejected' ...`
- PostgreSQL prepared statement 对 `$1` 在 SET 和 CASE WHEN 两处类型推断冲突

**修复**：`cim-perm/src/services/requestService.ts` — 改用 `isRejected` bool 参数，消除 `$1` 重用

**根因 4 — nextRequestNo() 并发竞争**（致 create 500）：
- `COUNT(*)` → +1 → 30 VUs 并发时多 TX 读到同一 count → request_no 重复 → unique constraint 冲突

**修复**：
- `cim-perm/src/services/requestService.ts` — `nextRequestNo()` 改用 `perm_request_seq` 表 + `INSERT ... ON CONFLICT DO UPDATE RETURNING`
- `cim-perm/src/services/requestService.ts` — `createRequest()` 加 retry 兜底（23505 → 重试，最多 5 次）
- `cim-perm/scripts/schema.sql` — 加 `perm_request_seq` 表 DDL
- DB：创建 `perm_request_seq` 表并初始化为当前 max(request_no)

**k6 结果（修复后）**：
| API | VU | 成功率 | list p95 | dashboard p95 | create p95 | review p95 |
|-----|----|---------|---------|-------------|-----------|-----------|
| cim-perm-api | 30 | **100.00%** | 7.55ms | 8.23ms | 57.19ms | 48.72ms |

**文件变更**：
- `cim-perm/src/plugins/auth.ts` — JWT role 解析修复
- `cim-perm/.env` — 加 MDM_BASE_URL + SERVICE_TOKEN
- `cim-perm/src/services/requestService.ts` — itReview SQL 修复 + seq table + retry
- `cim-perm/scripts/schema.sql` — 加 seq 表 DDL

**维护人**：Mavis

---

*维护人：Mavis · 评审周期：每周五 + 变更发生时*
*关联文档：MASTER_PLAN §十（变更控制规则）*

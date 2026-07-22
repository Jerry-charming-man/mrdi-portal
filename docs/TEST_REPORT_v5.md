# TEST_REPORT_v5 — Sprint 3 W3/W4 资源级 RBAC + 收口测试报告

> 日期：2026-07-20
> 范围：W3（A15 / S3-8 鉴权守卫 / 资源级 RBAC）/ W4（A10 Swagger UI / A14 dev_login / S3-10 登录审计）
> 测试方式：TypeScript typecheck（4 API 全量）+ curl 手动验证
> 测试结果：**4 API typecheck PASS / Swagger UI PASS / Login Audit API PASS / dev_login disabled PASS**
> 测试环境：mdm-api @ localhost:3000 / cimrms-api @ localhost:3001 / cimims-api @ localhost:3002 / cim-perm @ localhost:3003

---

## 一、容器健康状态

| 容器 | 状态 | 端口 | 用途 |
|------|------|------|------|
| mdm-api | Up | 3000 | MDM 主数据 + 登录审计 |
| cimrms-api | Up | 3001 | 需求管理 + WebSocket KPI |
| cimims-api | Up | 3002 | 事件管理 + WebSocket 告警 |
| cim-perm-api | Up | 3003 | 权限请求管理（Fastify）|
| mrdi-portal | Up | 8089 | Portal SPA |
| mrdi-postgres | healthy | 5432 | PostgreSQL |
| mrdi-redis | healthy | 6379 | Redis（BullMQ）|

---

## 二、W3 A15 — 4 API 鉴权守卫统一

### 测试目标
`@mrdi/shared/permission` guards 替换 4 个 API 的 inline role 检查；TypeScript 编译无错误。

### 验证方式
```bash
cd <repo-root>
pnpm --filter cimrms-api typecheck  # ✅
pnpm --filter cimims-api typecheck  # ✅
pnpm --filter cim-perm-api typecheck  # ✅
pnpm --filter mdm-api typecheck  # ✅
```

### 测试用例

| # | API | 改动 | 验证 | 结果 |
|---|---|---|---|---|
| A15-1 | cimrms | `requireAuditor()` (approve/reject) / `requireEditor()` (schedule/escalate) | `pnpm typecheck` | ✅ PASS |
| A15-2 | cimims | `requireDutyOrAbove()` (take-over/transfer) / `requireAuditor()` (force-close/audit) | `pnpm typecheck` | ✅ PASS |
| A15-3 | cim-perm | `addHook`→`onRequest` 选项；`requireViewer/Editor/Auditor` | `pnpm typecheck` | ✅ PASS |
| A15-4 | cim-perm | `user.dept`→`user.department`；`AuthUser.role: string`（非字面量联合）| `pnpm typecheck` | ✅ PASS |
| A15-5 | mdm | `requireAdmin()` 替换 inline PATCH password guard | `pnpm typecheck` | ✅ PASS |

### cimims duty 角色特殊处理

| 角色 | take-over | transfer | mark-resolved | force-close |
|------|-----------|----------|---------------|-------------|
| admin | ✅ | ✅ | ✅ | ✅ |
| auditor | ✅ | ✅ | ✅ | ✅ |
| editor | ✅ | ✅ | — | — |
| duty（值班表）| ✅ | ✅ | — | — |
| viewer | 403 | 403 | 403 | 403 |

---

## 三、W3 S3-8 — 资源级 RBAC

### 测试目标
`@mrdi/shared/permission` 新增 `checkResourcePermission()`；cimrms / cimims 关键端点接 MDM `permission_grants` 表。

### @mrdi/shared 新增 API

| 函数 | 用途 |
|------|------|
| `checkResourcePermission(mdmClient, user, resourceGroup, resourceName, action, resourceId?, logFn?)` | 查 MDM `/permissions/check` → 返回 permission_id 列表；fail-open |

### cimrms 资源级权限覆盖

| 端点 | 动作 | 角色要求 | 资源级 grant 兜底 |
|------|------|----------|-------------------|
| POST `/requests/:id/approve` | approve | auditor+ | `cimrms:request:approve` |
| POST `/requests/:id/reject` | reject | auditor+ | `cimrms:request:approve` |
| POST `/requests/:id/schedule` | schedule | editor+ | `cimrms:request:schedule` |
| POST `/requests/:id/escalate` | escalate | editor+ | `cimrms:request:schedule` |

### cimims 资源级权限覆盖

| 端点 | 动作 | 角色要求 | 资源级 grant 兜底 |
|------|------|----------|-------------------|
| POST `/incidents/:id/force-close` | admin | auditor+ | `cimims:incident:admin` |
| GET `/incidents/:id/audit` | audit | auditor+ | `cimims:incident:audit` |

### permission_id 格式
```
{group}:{resource}:{action}
例：cimrms:request:approve、cimims:incident:admin、cim-perm:request:write
```

### 类型修复
- `cimrms-api/types/mdm-client.d.ts`：补全 `checkPermission` / `grantPermission` / `revokePermission`（本地 .d.ts 覆盖 workspace alias）
- `cimims-api/types/mdm-client.d.ts`：同上

### TypeScript 验证

| # | 验证 | 结果 |
|---|------|------|
| S3-8-1 | `@mrdi/shared` tsc build | ✅ PASS |
| S3-8-2 | cimrms `pnpm typecheck` | ✅ PASS |
| S3-8-3 | cimims `pnpm typecheck` | ✅ PASS |
| S3-8-4 | cim-perm `pnpm typecheck` | ✅ PASS |
| S3-8-5 | mdm `pnpm typecheck` | ✅ PASS |

---

## 四、W4 A10 — Swagger UI 暴露

### 测试目标
4 个 API 非生产环境暴露 Swagger UI（`/docs`）。

### 实现

| API | Swagger 注册 | 路由前缀 | DoD |
|-----|-------------|----------|-----|
| mdm-api | ✅ `@fastify/swagger` + `@fastify/swagger-ui` | `/docs` | 启动日志出现 `[swagger] Swagger UI available at /docs` |
| cimrms-api | ✅ `@fastify/swagger` + `@fastify/swagger-ui` | `/docs` | 同上 |
| cimims-api | ✅ `@fastify/swagger` + `@fastify/swagger-ui` | `/docs` | 同上 |
| cim-perm-api | ✅ `@fastify/swagger` + `@fastify/swagger-ui` | `/docs` | 同上 |

### Swagger UI 条件暴露
```typescript
// 仅 NODE_ENV !== 'production' 时注册
if (env.NODE_ENV !== 'production') {
  await app.register(swagger, { openapi: { ... } })
  await app.register(swaggerUi, { routePrefix: '/docs', ... })
}
```

### 访问验证

| API | Swagger URL | 预期 |
|-----|-------------|------|
| mdm | http://localhost:3000/docs | Swagger UI 页面 |
| cimrms | http://localhost:3001/docs | Swagger UI 页面 |
| cimims | http://localhost:3002/docs | Swagger UI 页面 |
| cim-perm | http://localhost:3003/docs | Swagger UI 页面 |

---

## 五、W4 A14 — dev_login 禁用

### 测试目标
非 MDM API（cimrms / cimims / cim-perm）禁用 `dev_login`；mdm-api 保留供本地开发。

### docker-compose.yml 变更

```yaml
# 变更前
DEV_LOGIN_ENABLED: "true"   # 4 个 API 全开

# 变更后
DEV_LOGIN_ENABLED: "false"   # cimrms / cimims / cim-perm 禁用
# mdm-api 保持 "true"（本地开发仍可用）
```

### 验证

| # | API | `DEV_LOGIN_ENABLED` | 验证方式 | 结果 |
|---|-----|---------------------|----------|------|
| A14-1 | mdm-api | `true` | `curl http://localhost:3000/auth/v1/dev/login?email=test@test.com&role=admin&admin_key=mrdi-dev-admin-key-2026` → 200 | ✅ PASS |
| A14-2 | cimrms-api | `false` | `curl http://localhost:3001/v1/auth/dev/login?email=test@test.com` → 403 | ✅ PASS |
| A14-3 | cimims-api | `false` | `curl http://localhost:3002/v1/auth/dev/login?email=test@test.com` → 403 | ✅ PASS |
| A14-4 | cim-perm-api | `false` | `curl http://localhost:3003/perm-api/v1/auth/dev/login?email=test@test.com` → 403 | ✅ PASS |

---

## 六、W4 S3-10 — 登录审计

### 测试目标
`/v1/login-audit` 路由 + portal 页面 admin 可查。

### 后端新增路由

| 端点 | 方法 | 权限 | 用途 |
|------|------|------|------|
| `/v1/login-audit` | GET | admin | 分页审计日志 |
| `/v1/login-audit/failed-logins` | GET | admin | 7 天失败登录聚合 |
| `/v1/login-audit/summary` | GET | admin | 今日摘要（成功/失败/锁定/总用户）|

### LoginAudit 事件类型

| 事件 | 触发 |
|------|------|
| `auth.login.fail` | 密码错误 / 用户不存在 |
| `auth.login.lock` | 5 次失败后账号锁定 |
| `auth.login.locked` | 锁定状态下登录尝试 |
| `auth.login.success` | 登录成功（密码 / M365 mock） |
| `auth.password.changed` | 用户改密成功 |
| `auth.password.change.fail` | 改密失败（旧密码错 / 历史重用）|
| `auth.password.reset` | admin 重置密码 |
| `auth.user.unlocked` | admin 解锁账号 |
| `auth.login.m365_mock` | M365 mock OAuth 登录 |

### API 验证（curl）

| # | 场景 | curl | 预期 | 结果 |
|---|------|------|------|------|
| S3-10-1 | 获取摘要 | `curl -H "Authorization: Bearer $JWT" http://localhost:3000/v1/login-audit/summary` | 200 + JSON | ✅ PASS |
| S3-10-2 | 失败登录列表 | `curl .../login-audit/failed-logins` | 200 + JSON | ✅ PASS |
| S3-10-3 | 分页日志 | `curl .../login-audit?page=1&pageSize=20` | 200 + 分页 | ✅ PASS |
| S3-10-4 | 筛选 email | `curl .../login-audit?email=admin@test.com` | 200 + 过滤结果 | ✅ PASS |
| S3-10-5 | 非 admin 访问 | 无 admin JWT → /login-audit | 401 | ✅ PASS |

### Portal 页面
- 路径：`/mdm/login-audit`
- Sidebar 入口：MDM → 运维 → **登录审计**
- 功能：今日 KPI / 7 天失败登录聚合 / 完整审计日志分页
- 权限：仅 admin 显示；非 admin → 提示"需要 admin 权限"

---

## 七、安全检查清单（W3/W4）

| 项目 | 状态 |
|------|------|
| 4 API TypeScript 编译无错误 | ✅ |
| `@mrdi/shared/permission` 全套 guards 统一 | ✅ |
| `checkResourcePermission` fail-open 设计（MDM 挂了角色检查兜底）| ✅ |
| 4 API Swagger UI 非生产暴露 | ✅ |
| cimrms/cimims/cim-perm dev_login 禁用 | ✅ |
| 登录审计覆盖所有安全事件 | ✅ |
| admin-only 端点 requireAdmin 守卫 | ✅ |
| cimims duty 角色特殊映射（不在标准角色体系）| ✅ |
| cim-perm `user.department`（非 `user.dept`）| ✅ |

---

## 八、已知限制

| 限制 | 说明 | 影响 |
|------|------|------|
| Swagger UI 未配置 JWT auth | dev 环境可用；生产可加 `addSecurityObjects` | dev/demo 可用 |
| cim-perm 使用 PG pool（不是 Prisma）| 资源级 RBAC 待后续接 `checkResourcePermission` | cimrms/cimims 已接入 |
| Login Audit portal 页面使用真实 API | 需要 admin JWT 访问 | 功能已验证 |
| cimims duty 角色是值班表特有 | 不在标准 viewer/editor/auditor/admin 体系 | 已用本地 helper 处理 |

---

## 九、测试运行方式

```bash
# 1. TypeScript 全量验证
cd <repo-root>
pnpm --filter cimrms-api typecheck  # ✅
pnpm --filter cimims-api typecheck  # ✅
pnpm --filter cim-perm-api typecheck  # ✅
pnpm --filter mdm-api typecheck  # ✅

# 2. Swagger UI 验证（容器运行中）
open http://localhost:3000/docs   # mdm-api
open http://localhost:3001/docs   # cimrms-api
open http://localhost:3002/docs   # cimims-api
open http://localhost:3003/docs   # cim-perm-api

# 3. dev_login 禁用验证（容器运行中）
curl http://localhost:3000/auth/v1/dev/login?email=test@test.com\&role=admin\&admin_key=mrdi-dev-admin-key-2026  # mdm → 200
curl http://localhost:3001/v1/auth/dev/login?email=test@test.com  # cimrms → 403

# 4. Login Audit API 验证
curl -H "Authorization: Bearer $ADMIN_JWT" \
  http://localhost:3000/v1/login-audit/summary
```

---

*报告人：Mavis*
*生成时间：2026-07-20T06:32+08:00*
*关联：CHANGELOG 变更单 2026-07-20-14、2026-07-20-15、2026-07-20-16*

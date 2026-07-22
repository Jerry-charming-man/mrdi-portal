# TEST_REPORT_v4 — Sprint 3 Auth C 方案集成测试报告

> 日期：2026-07-17
> 范围：T2 / T3 / T5 / T6 / T8（ADR-0006）
> 测试脚本：`mdm-api/test-auth-e2e.cjs`
> 测试结果：**22 PASS / 0 FAIL**
> 测试环境：mdm-api @ localhost:3000（本机 Docker）

---

## 一、容器健康状态

| 容器 | 状态 | 端口 | 用途 |
|------|------|------|------|
| mdm-api | Up | 3000 | MDM 主数据 API（含 Auth C） |
| mrdi-postgres | healthy | 5432 | PostgreSQL（mdm schema） |

---

## 二、T2 — ADMIN_KEY 中间件

### 测试目标
`GET /auth/v1/dev/login` 受 `ADMIN_KEY` 环境变量保护；无 key / 错误 key → 403；正确 key → 200 + JWT。

### 测试用例

| # | 场景 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| T2-1 | 无 admin_key 参数 | 403 `EMERGENCY_ACCESS_DISABLED` | 403 | ✅ PASS |
| T2-2 | 错误 admin_key (`wrong`) | 403 | 403 | ✅ PASS |
| T2-3 | 正确 admin_key (`mrdi-dev-admin-key-2026`) | 200 + JWT | 200 + JWT | ✅ PASS |

### 实现说明
- `ADMIN_KEY` 通过 `env.ts` 注入，**不进 git**
- 保护范围：所有 `dev_login` 请求（含 `email` / `role` 参数）
- 错误消息：`EMERGENCY_ACCESS_DISABLED`，不泄漏 key 是否存在

---

## 三、T3 — M365 OAuth Mock Client

### 测试目标
`M365MockClient` 实现完整 dev mock OAuth flow：mock 用户列表 → authorize → callback → JWT。

### 测试用例

| # | 场景 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| T3-1 | `GET /m365/mock-users` | 200 + 3 个 mock 用户 | 200 + 3 users | ✅ PASS |
| T3-2 | `GET /m365/authorize`（默认 admin） | 200 + `code` | 200 + code | ✅ PASS |
| T3-3 | `POST /m365/callback` + 有效 code | 200 + JWT + user info | 200 + JWT | ✅ PASS |
| T3-4 | `POST /m365/callback` + 无效 code | 400 `INVALID_CODE` | 400 | ✅ PASS |

### Mock 用户角色映射

| Mock Email | 角色 |
|---|---|
| `admin@mock.m365` | admin |
| `editor@mock.m365` | editor |
| `viewer@mock.m365` | viewer |

### 实现说明
- `M365_MOCK_ENABLED` 环境变量控制（默认 `true`）
- Code → user 使用内存 Map（5 min TTL）
- JWT 签发使用 `@fastify/jwt`（与密码登录同一套）
- 不调用真实 Microsoft Graph API（dev mock）

---

## 四、T5 — 账号密码登录 + LoginAudit

### 测试目标
`POST /auth/v1/login` 完整登录流程：bcrypt 验证、锁定逻辑、`must_change_password` 强制、LoginAudit 写表。

### 测试用例

| # | 场景 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| T5-A | 错误密码登录 | 401 `AUTH_FAILED` | 401 | ✅ PASS |
| T5-B | admin 重置后登录（`must_change_password=true`） | 200 + `requirePasswordChange=true` + `token=null` | 200 + requirePasswordChange=true + token=null | ✅ PASS |
| T5-C | 正常登录（`must_change_password=false`） | 200 + JWT | 200 + JWT | ✅ PASS |
| T5-D | 不存在用户登录 | 401（不泄漏用户是否存在） | 401 | ✅ PASS |

### LoginAudit 事件覆盖

| 事件 | 触发场景 |
|------|----------|
| `auth.login.fail` | 密码错误、用户不存在、无密码 |
| `auth.login.lock` | 5 次错误后账号被锁 |
| `auth.login.success` | 登录成功（含 M365 mock） |
| `auth.password.changed` | 用户主动改密成功 |
| `auth.user.unlocked` | admin 解锁账号 |
| `auth.password.reset` | admin 重置密码 |

### 账号锁定规则
- 5 次密码错误 → 锁定 15 分钟（`locked_until`）
- 锁定期间登录 → 423 `ACCOUNT_LOCKED`
- Admin 解锁后自动解除（`failed_login_count` → 0）

---

## 五、T6 — 改密（用户主动）

### 测试目标
`POST /auth/v1/change-password`：校验旧密码、强度策略、`password_history` 防重用。

### 密码强度策略
- 最少 12 字符
- 至少 1 个大写字母
- 至少 1 个小写字母
- 至少 1 个数字
- 至少 1 个特殊字符（`!@#$%^&*()_+-=[]{}|;':",./<>?`）
- 新密码不能与旧密码相同
- 最近 5 次密码不可重用（`password_history`）

### 测试用例

| # | 场景 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| T6-A | 错误旧密码 | 401 | 401 | ✅ PASS |
| T6-B | 新旧密码相同 | 400 `BAD_REQUEST` | 400 | ✅ PASS |
| T6-C | 新密码少于 12 字符 | 400（含"12"字样） | 400 | ✅ PASS |
| T6-D | 缺少大写字母 | 400（含"大写"字样） | 400 | ✅ PASS |
| T6-E | 缺少特殊字符 | 400（含"特殊"字样） | 400 | ✅ PASS |
| T6-F | 合法改密 | 200 | 200 | ✅ PASS |

### 副作用
- `password_changed_at` → 当前时间
- `password_history` 更新（追加旧密码哈希，保留最近 5 次）
- `must_change_password` → `false`（清除 admin 重置标记）
- 发送 `password_changed` 通知

---

## 六、T8 — Admin 解锁 + 密码重置

### 测试目标
Admin 可解锁任意用户、可重置任意用户密码；普通用户无权限。

### 测试用例

| # | 场景 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| T8-1 | 非 admin 调用 `/unlock` | 403 | 403 | ✅ PASS |
| T8-2 | 解锁不存在的用户 | 404 | 404 | ✅ PASS |
| T8-3 | 解锁未被锁定的用户 | 400 | 400 | ✅ PASS |
| T8-4 | Admin 重置密码 | 200 + `must_change_password=true` | 200 | ✅ PASS |
| T8-5 | Admin 重置自己 | 400（保护） | 400 | ✅ PASS |

### Admin 重置密码副作用
- `password_hash` → 新密码 bcrypt 哈希
- `must_change_password` → `true`（强制下次登录改密）
- `locked_until` → `null`
- `failed_login_count` → `0`
- 发送 `password_changed` 通知

### Admin 解锁副作用
- `locked_until` → `null`
- `failed_login_count` → `0`
- 发送 `account_unlocked` 通知

---

## 七、T7 — Profile 改密页 + Auth 守卫

### 测试用例

| # | 场景 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| T7c-A | admin reset 后登录 | 200 + `requirePasswordChange=true` + `token=null` | 200 + requirePasswordChange=true + token=null | ✅ PASS |
| T7c-B | 错误旧密码 → change-password | 401 | 401 | ✅ PASS |
| T7c-C | 合法改密 | 200 + **新 JWT** | 200 + 新 JWT | ✅ PASS |
| T7c-D | 改密后用新密码登录 | 200 + JWT + `must_change_password` 清除 | 200 + JWT | ✅ PASS |
| T7d | portal `/profile` 路由 | 200 | 200 | ✅ PASS |

### Profile 改密页功能
- `Profile.tsx`：用户信息卡 + change-password 表单（old/new/confirm）
- 实时密码强度检查（大写/小写/数字/特殊/长度）
- `apiChangePassword` helper：调用 `POST /auth/v1/change-password` → 新 JWT
- 新 JWT → `authStore` 更新 → redirect to `/`
- Sidebar 用户菜单 → "账号设置" → `/profile`
- Auth 守卫：`/profile` 仅允许已登录但 `token=null` 的用户（强制改密场景）

---

## 八、安全检查清单

| 项目 | 状态 |
|------|------|
| 密码 bcrypt cost = 12 | ✅ |
| JWT HS256 / 8h 过期（`fastify-jwt` 默认） | ✅ |
| 用户不存在 → 401（防用户枚举） | ✅ |
| ADMIN_KEY env 注入（不进 git） | ✅ |
| LoginAudit 覆盖所有安全事件 | ✅ |
| Admin 不能重置自己的密码 | ✅ |
| 账号锁定 15 分钟 + 通知 | ✅ |

---

## 九、已知限制

| 限制 | 说明 | 影响 |
|------|------|------|
| M365 mock（非真实 Graph API） | dev 环境用 mock client；生产需对接 Entra ID | dev/demo 可用，生产需换真实 client |
| T5 account lockout 未在 E2E 测试中覆盖 | 需要 5 次连续失败（耗时），已通过单元验证 | CI 快速测试跳过；手动测试可验证 |
| T4 前端登录页 UI | 属于 Jerry 的工作范围（Dev B） | T4 联调待 Jerry 完成 |

---

## 十、测试运行方式

```bash
# 前提：mdm-api 容器运行中
cd mdm-api
node test-auth-e2e.cjs

# 输出：
#   22 PASS / 0 FAIL
#   Report saved: test-auth-report.json
```

---

*报告人：Mavis*
*生成时间：2026-07-17T06:16+08:00*
*下次 review：Sprint 3 结束（2026-08-08）*

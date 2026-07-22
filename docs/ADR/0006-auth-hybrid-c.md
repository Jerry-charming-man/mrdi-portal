# ADR-0006 · 鉴权路线 C 方案（M365 OAuth + MDM 应急，不含 TOTP MFA）

> 状态：✅ Accepted
> 日期：2026-07-17
> 决策人：Jerry（架构）+ Mavis（实施）
> **取代**：ADR-0005（Superseded 2026-07-17）
> 影响范围：mdm-api / 4 API / mrdi-portal · Sprint 2 全程 + 后续所有 Sprint

---

## 一、背景

ADR-0005（2026-07-16 Accepted）确立了"门户非 SaaS 化、MDM 独立鉴权、不接外部 IdP"的原则，但**漏了港府非营利受资助方审计要求"SSO 登录来源可追溯"**这条硬约束。

AUTH_HYBRID_PRD v1.0（2026-07-16 草案）提出混合鉴权思路。在 §1.1 明写：

> "**港府非营利受资助方审计要求 SSO 登录来源可追溯**"

经 2026-07-17 决策评审，决定**采纳 C 方案**：M365 OAuth 为主登录（满足审计）、MDM 账号密码为应急 + dev 主入口（不接 TOTP MFA，简化）。

---

## 二、决策

### 2.1 五条核心决策

| # | 决策 | 说明 |
|---|---|---|
| 1 | **M365 OAuth 主登录**（生产） | 99% 场景走 M365 Entra ID OAuth 2.0；解决港府审计 |
| 2 | **MDM 账号密码 = dev 主入口** | dev 环境无 M365 tenant，账号密码登录是**主入口**（不是"应急"） |
| 3 | **MDM 账号密码 = 生产应急入口** | M365 全宕时走账号密码（DR 战备级） |
| 4 | **不上 TOTP MFA** | 港府审计核心 = SSO 来源可追溯（M365 已满足），MFA 推 V2 |
| 5 | **dev_login 收紧为 admin-only** | 必须带 `ADMIN_KEY` env 才能用；7 天过渡期后保留作为 admin 应急通道 |

### 2.2 不做什么（明确划界）

- ❌ **TOTP MFA**（Sprint 2 不上，推 V2）— 港府审计不强制；DR 断 M365 时用户手机也可能无网
- ❌ **forgot-password 邮件流**（PRD §6.4 / §6.5 整段砍）— 改用 admin 在 MDM 重置密码
- ❌ **M365 Graph API cron 同步**（PRD F11）— 推 Sprint 3
- ❌ **设备绑定 / 地理异常检测 / 自助注册**（PRD F15-F18）— 推 V2
- ❌ **真实 SMTP**（PRD F5 邮件）— Sprint 2 dev 用 console.log；Sprint 4 接真

### 2.3 鉴权流程图

```
┌────────────────────────────────────────────────────────────┐
│                    生产环境 (M365 可用)                      │
└────────────────────────────────────────────────────────────┘

浏览器 → portal /login
         ├─ 大按钮 "M365 公司账号登录"（默认）
         │     ↓
         │  M365 OAuth 2.0 (Entra ID)
         │     ↓ callback
         │  mdm-api POST /auth/v1/m365/callback
         │     ↓
         │  mdm-api 用 code 换 access_token → Graph API /me
         │     ↓
         │  mdm-api 查/建 User (按 email)
         │     ↓
         │  mdm-api 签发 JWT (HS256, 8h)
         │     ↓
         │  portal 存 sessionStorage → /dashboard
         │
         └─ 折叠 "应急登录"
               ↓
              mdm-api POST /auth/v1/login
              (username + password, bcrypt 验证)
              ↓
              mdm-api 签发 JWT
              ↓
              portal 存 sessionStorage → /dashboard

┌────────────────────────────────────────────────────────────┐
│              dev 环境 (无 M365 tenant)                      │
└────────────────────────────────────────────────────────────┘

浏览器 → portal /login
         ├─ 大按钮 "M365 公司账号登录" → 走 mock IDP（dev only）
         │
         └─ 折叠 "账号密码登录"（dev 主入口，默认展开）
               ↓
              mdm-api POST /auth/v1/login
              (同生产应急入口)
```

---

## 三、数据模型变更

### 3.1 Prisma schema 补 2 字段

`mdm-api/prisma/schema.prisma` `User` 模型新增 2 字段：

```prisma
// ADR-0006 · Sprint 2 补
m365ObjectId   String?   @unique @map("m365_object_id")
m365SyncedAt   DateTime? @map("m365_synced_at")
```

### 3.2 已就绪字段（ADR-0005 实施时已有，不动）

| 字段 | 类型 | 状态 |
|---|---|---|
| `password_hash` | String? | ✅ 已有 |
| `password_changed_at` | DateTime? | ✅ 已有 |
| `password_expires_at` | DateTime? | ✅ 已有 |
| `failed_login_count` | Int @default(0) | ✅ 已有 |
| `locked_until` | DateTime? | ✅ 已有 |
| `must_change_password` | Boolean @default(false) | ✅ 已有 |
| `password_history` | String[] | ✅ 已有 |
| `LoginAudit` 表 | (新建) | ✅ Sprint 2 已落地 |

### 3.3 砍掉的字段（PRD 提了但 C 方案不上）

| 字段 | 原因 |
|---|---|
| `totp_secret` | 不上 TOTP |
| `mfa_enabled` | 不上 MFA |
| `mfa_failed_count` | 不上 MFA |
| `password_reset_token` | 不上 forgot-password 邮件流 |
| `password_reset_expires_at` | 同上 |

### 3.4 LoginAudit 表已就绪（不动）

`event` 字段涵盖：
- `login.success` / `login.fail` / `account.locked` / `password.changed` / `user.unlocked` / `password.reset`
- `flow` 字段：`m365` / `emergency` / `dev`（dev 走应急端点时记 flow=dev）

---

## 四、API 表面

### 4.1 Sprint 2 新增/改造

| 端点 | 用途 | 角色 |
|---|---|---|
| `POST /auth/v1/login` | 账号密码登录（**主入口 dev / 应急生产**）| 公开 |
| `POST /auth/v1/logout` | 撤销 Session | 已登录 |
| `POST /auth/v1/change-password` | 用户自己改密 | 已登录 |
| `POST /auth/v1/m365/callback` | M365 OAuth 回调 | 公开 |
| `GET /auth/v1/me` | 当前用户信息 | 已登录 |
| `POST /v1/users/:id/reset-password` | **admin 重置密码**（忘密码唯一流程）| admin |
| `POST /v1/users/:id/unlock` | admin 解锁 | admin |
| `POST /auth/v1/dev/login` | dev 应急通道（**收紧后必须 ADMIN_KEY**）| dev only |

### 4.2 4 API 鉴权流程

```
请求带 Authorization: Bearer <jwt>
       ↓
任一 API 的 @fastify/jwt 验签（共享 secret）
       ↓
注入 req.currentUser = { email, role, ... }
       ↓
业务路由 middleware 调 mdm-api：
   GET /v1/permissions/check?user=...&resource=...&permission=...
       ↓
mdm-api: 角色级 → global_role；资源级 → PermissionGrant
       ↓
返回 { allowed: true|false }
       ↓
业务路由放行 / 拒绝 403
```

**mdm-api 是唯一信任源**。

---

## 五、与 ADR-0005 的差异

| 维度 | ADR-0005（已退役）| ADR-0006（现行）|
|---|---|---|
| 登录入口唯一 | username + password | M365 OAuth 主 / 账号密码 双入口 |
| 是否接外部 IdP | ❌ 不接 | ✅ M365 Entra ID |
| dev_login 性质 | dev 临时（计划删除）| admin 应急通道（永久保留，ADMIN_KEY 鉴权）|
| TOTP MFA | ❌ | ❌（V2 评估）|
| 港府审计 SSO 可追溯 | ❌ 不满足 | ✅ M365 OAuth 满足 |
| 密码找回 | PRD 草案 forgot-password 邮件 | **admin 在 MDM 重置**（不接邮件）|
| Sprint 2 工时 | 6.5d（实施 ADR-0005）| **5.5d**（修订 C 方案）|

---

## 六、Sprint 2 实施步骤（5.5d 拆 W1/W2/W3）

详见 `docs/Sprint2/AUTH_HYBRID_C_CHECKLIST.md`。

---

## 七、风险与回滚

| 风险 | 概率 | 影响 | 缓解 / 回滚 |
|---|---|---|---|
| M365 mock 跑不通 | 中 | 中 | dev 走账号密码主入口；M365 mock 留 Sprint 3 末 |
| 7 天过渡期用户没切完 | 低 | 中 | ADMIN_KEY 留 30 天；30 天后强制切 |
| dev_login 收紧后现有 dev 流程断 | 高 | 高 | ADMIN_KEY 默认值 `dev-admin-key-2026-mrdi` 写到 .env.example |
| 港府审计要 TOTP MFA | 中 | 中 | V2 评估；MFA 推到 Sprint 5+ |

**回滚方案**：

```bash
# 立即回滚到 ADR-0005 行为
docker compose down mdm-api
git revert <commit-hash>
docker compose build mdm-api
docker compose up -d mdm-api
# 恢复 dev_login 无 ADMIN_KEY 模式
```

---

## 八、关联文档

- **ADR-0001** · Fastify + Prisma + PostgreSQL 统一技术栈
- **ADR-0002** · 路径前缀路由
- **ADR-0004** · JWT 共享 secret
- **ADR-0005** · ⚠️ Superseded by ADR-0006
- **AUTH_HYBRID_PRD.md** v1.0 草案 → 标 "✅ 已采纳 C 方案"
- **Sprint2/AUTH_HYBRID_C_CHECKLIST.md** · 实施 checklist

---

## 修订记录

| 版本 | 日期 | 变更 |
|---|---|---|
| 1.0 | 2026-07-17 | 初版；C 方案拍板；取代 ADR-0005 |

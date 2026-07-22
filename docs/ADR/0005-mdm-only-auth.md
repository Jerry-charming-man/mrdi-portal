# ADR-0005 · 全栈鉴权由 MDM 独立承担（不接外部 SSO）

> 状态：⚠️ **Superseded by ADR-0006**（2026-07-17）
> 取代文档：[ADR-0006 · 鉴权路线 C 方案（M365 OAuth + MDM 应急，不含 TOTP MFA）](./0006-auth-hybrid-c.md)
> 原决策日期：2026-07-16
> 原决策人：Jerry（架构）
> 影响范围：mdm-api / cimrms-api / cimims-api / cim-perm-api / mrdi-portal · 全部 Sprint

> **退役原因**：本 ADR 漏了"港府非营利受资助方审计要求 SSO 登录来源可追溯"这条硬约束。
> 经 2026-07-17 决策评审，由 [ADR-0006](./0006-auth-hybrid-c.md) 取代：
> - 生产环境 = M365 OAuth 主 + MDM 账号密码应急
> - dev 环境 = MDM 账号密码主入口（无 M365 tenant）
> - 不上 TOTP MFA（V2 评估）
> - dev_login 收紧为 admin-only 应急通道（ADMIN_KEY 鉴权）

---

## 背景

Sprint 1 MVP 落地时，规划里默认了"M365 SSO 是终态，dev_login 是临时"的路线，把 M365 / Entra ID 当成未来生产环境的唯一登录入口。

经过 Sprint 1 复盘 + 2026-07-16 架构评审，决定**取消 M365 SSO 路线**，整套登录、鉴权、权限管控全部由 **mdm-api 独立承担**，门户是内部运营系统，不接外部 IdP。

## 决策

1. **登录入口唯一**：`POST /auth/v1/login`（username + password），生产长期使用，**不是 dev-only**
2. **鉴权源唯一**：4 个 API 全部通过 mdm-api 验证 JWT + 查 `mdm.User.global_role` + `mdm.PermissionGrant`
3. **不接外部 IdP**：无 Azure Entra / 无 OAuth / 无 SAML。门户是 MRDI 内部系统，不面向外部
4. **dev_login 退役**：`/auth/v1/dev/login` 在 Sprint 2 末删除，统一走 `/auth/v1/login`

## 鉴权模型

### 三层结构

| 层 | 抽象 | 存储位置 | 决策依据 |
|---|---|---|---|
| **身份** | `User` | mdm.User | 由 admin 创建 / 导入；不再有 m365_object_id 来源 |
| **角色** | `global_role` (4 级) | mdm.User.global_role | admin / auditor / editor / viewer |
| **资源授权** | `PermissionGrant` | mdm.PermissionGrant | 资源级临时授权；`expires_at` 可空 |

### 密码方案

| 维度 | 方案 |
|---|---|
| 存储 | bcrypt (cost=12) |
| 盐 | bcrypt 自动生成 |
| 长度 | ≥ 10 字符，必须含字母+数字 |
| 过期 | 90 天，过期前 7 天提醒 |
| 历史 | 不允许重用最近 5 次 |
| 失败锁定 | 5 次连续失败锁 15 分钟 |
| 重置 | admin 后台强制重置，发临时密码 |
| 首次登录 | admin 创建后发临时密码，用户首次登录强制改密 |

### mdm.User 表新增字段（Sprint 2）

| 字段 | 类型 | 用途 |
|---|---|---|
| `password_hash` | String? | bcrypt 哈希；null = 未设密码（admin 账号临时状态） |
| `password_changed_at` | DateTime? | 上次改密时间；用于 90 天过期判断 |
| `password_expires_at` | DateTime? | 到期时间；登录时校验 |
| `failed_login_count` | Int @default(0) | 连续失败计数 |
| `locked_until` | DateTime? | 锁定截止时间 |
| `must_change_password` | Boolean @default(false) | 首次登录 / admin 重置后置 true |
| `password_history` | String[] | 最近 5 次哈希，禁止重用 |

**移除字段**：`m365_object_id`, `m365_synced_at`（已无外部同步来源）

### 复用现有表（不新建）

- `Session`：每次登录建一条，`token_hash` + `expires_at` + `ip_address` + `user_agent`
- `AuditLog`：登录成功/失败/锁定/改密/重置 全部走这里

## API 表面（Sprint 2 新增 / 改造）

```
POST   /auth/v1/login              username + password → JWT
POST   /auth/v1/logout             撤销 Session
POST   /auth/v1/password/change    已登录用户改密
POST   /auth/v1/password/reset     admin 强制重置某用户
GET    /auth/v1/me                 当前用户信息（含 global_role / permissions）

GET    /v1/users                   用户列表
POST   /v1/users                   admin 创建用户（生成临时密码）
PATCH  /v1/users/:id               admin 改用户信息
POST   /v1/users/:id/unlock        admin 解锁被锁账号
```

## 4 个 API 鉴权流程

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

**mdm-api 是唯一信任源**。其他 3 个 API 不持有自己的角色表，只信 mdm 返回的判断。

## 为什么不接 M365 SSO

| 反对理由 | 说明 |
|---|---|
| **门户是内部系统** | Mfg/PIE/IT/Security 都是 MRDI 员工，不需要外部 IdP |
| **值班场景失败** | P1 工單半夜报，IT 工程师可能没在 Entra 登录态；走 SSO 会卡住 |
| **审计链路必须内闭环** | 登录、权限、审计全部留在 mdm.AuditLog，不依赖外部日志 |
| **运维简单** | 不需要维护 Entra ID app 注册 / client secret 轮换 / group 同步 |
| **ADR 决策明确** | 跨团队对齐"门户非 SaaS 化"原则 |

## 影响 / 后续

| 项 | 影响 |
|---|---|
| Sprint 2 任务清单 | S2-9 角色级 RBAC 范围扩大（包含密码登录） |
| Sprint 3 任务清单 | S3-9 / S3-10 整段删，换成"Admin 账号管理 UI" |
| Sprint 3.5 部署 | 无 Entra ID 注册步骤 |
| TOP_LEVEL_DESIGN §4.1 流程图 | 重画（不再有 Azure Entra 跳转） |
| @mrdi/shared 共享包 | 加 `password.ts`（bcrypt 封装 + 强度校验） |
| @mrdi/ui 组件库 | 加 `LoginForm` / `ChangePasswordDialog` 组件 |
| Sprint 2 末验收 | admin 可在 portal 创建用户 + 改密 + 解锁 + 看登录审计 |

## 关联 ADR

- ADR-0001 · Fastify + Prisma + PostgreSQL 统一技术栈
- ADR-0002 · 路径前缀路由
- ADR-0004 · JWT 共享 secret

## 修订记录

| 版本 | 日期 | 变更 |
|---|---|---|
| 1.0 | 2026-07-16 | 初版；取消 M365 SSO 路线，MDM 独立承担鉴权 |

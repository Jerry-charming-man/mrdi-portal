# Sprint 2 · 鉴权 C 方案实施 Checklist

> **基线**：[ADR-0006 · 鉴权路线 C 方案](../ADR/0006-auth-hybrid-c.md)
> **总工时**：5.5 人日
> **时间窗**：2026-07-20 ~ 2026-08-08（3 周）
> **Sprint 2 buffer**：12.5 人日 → 剩 7 人日（回归 + 突发）
> **验收**：2026-08-08 周五 Sprint 2 review

---

## 一、人员分工（2 人并行）

| 角色 | 谁 | 工时预算 | 核心职责 |
|---|---|---|---|
| **Dev A · 后端主力** | Mavis | 100% × 3 周 = 15 人日 | Prisma migration + 鉴权 endpoints + dev_login 收紧 + 集成测试 + 容器部署 |
| **Dev B · 前端 + 架构** | Jerry | 50% × 3 周 = 7.5 人日 | 登录页 UI 改造 + 架构评审 + ADR 拍板 + Sprint 末 review |

**总计**：22.5 人日（< Sprint 2 预算 30 人日，剩 7.5 留 buffer）

**并行策略**：
- Dev A 先动 schema → Dev B 按 schema 写 UI（不阻塞）
- W2 中段开始端到端联调（Dev A 暴露 endpoint → Dev B 接）
- W3 收口期双线收（Dev A 集成测试 / Dev B 末 review）

---

## 二、任务清单（按周拆）

### 2.1 Week 1（07-20 ~ 07-24）— 2.5 人日

| # | 任务 | Owner | 人日 | DoD | 撞档检查 |
|---|---|---|---|---|---|
| **T1** | Prisma 补 2 字段（`m365_object_id` / `m365_synced_at`）+ migration | Dev A | 0.5 | dev DB 加 2 列；prisma studio 可见 | 不撞 A11（已有 7 字段）|
| **T2** ✅ | dev_login 加 ADMIN_KEY 中间件 | Dev A | 0.5 | 无 key 返 403 EMERGENCY_ACCESS_DISABLED；env 有 key 走通 | 不撞 S2-9/10 RBAC |
| **T3** ✅ | M365 OAuth client（token 交换 + Graph API /me）| Dev A | 1.0 | dev mock IDP 跑通；code → token → user info | 不撞（独立模块）|
| **T7a** | 登录页 UI 草图（ASCII 草稿 + 状态机）| Dev B | 0.5 | 草图定稿：大按钮 M365 + 折叠账号密码 | 不撞 S2-5/6/7/8 |

**W1 小计**：2.5 人日

### 2.2 Week 2（07-27 ~ 07-31）— 2.5 人日

| # | 任务 | Owner | 人日 | DoD | 撞档检查 |
|---|---|---|---|---|---|
| **T4** | M365 callback endpoint `POST /auth/v1/m365/callback` | Dev A | 1.0 | E2E 跑通 M365 OAuth（dev mock）；LoginAudit 写 m365 flow | 不撞 |
| **T5** ✅ | 账号密码登录 `POST /auth/v1/login`（**主入口** dev / 应急生产）| Dev A | 1.0 | bcrypt 验证 + LoginAudit 写 emergency/dev flow + 5 次失败锁 15 分钟 | **不撞 A12**（A12 已 PASS；本任务 = 补 LoginAudit 完整化）|
| **T6a** ✅ | 改密 `POST /auth/v1/change-password` | Dev A | 0.5 | 用户自己改密；强度校验（12 字符 + 大小写 + 数字 + 特殊）| 不撞 |
| **T7b** | 登录页 UI 实施（大按钮 + 折叠表单 + 状态联动）| Dev B | 0.5 | 浏览器可点；M365 流 / 应急流 UI 切换 | 联调 T4/T5 |
| **T7c** | Profile 改密对话框 | Dev B | 0.5 | 已登录用户在 Profile 可改密 | 联调 T6a |

**W2 小计**：3.5 人日（**超出 0.5** 留 buffer 吃）

### 2.3 Week 3（08-03 ~ 08-08）— 0.5 人日 + 收口

| # | 任务 | Owner | 人日 | DoD | 撞档检查 |
|---|---|---|---|---|---|
| **T6b** ✅ | admin 重置密码 `POST /auth/v1/admin/reset-password` | Dev A | 0.5 | admin 可重置任意用户；must_change_password 置 true | 不撞 A13（admin 改密/重置/解锁 UI 已规划）|
| **T8** ✅ | 账号锁定/解锁（5 次失败 15min + admin 解锁）| Dev A | 0.5 | 验证：5 次错锁 15 分钟；admin 解锁可重登 | 不撞 A12（已有）；本任务 = 端到端回归 |
| **T9** | 集成测试 + TEST_REPORT v4 | Dev A + Dev B | 1.0 | E2E 跑通：M365 流 + 应急流 + dev_login 收紧 + 改密 + 重置 | 占 Dev B W3 0.5 |
| **T10** | Sprint 2 retro + 文档收口 | Dev B | 0.5 | MASTER_PLAN / TOP_LEVEL_PLAN / VERSION 同步更新 | 占 Dev B W3 0.5 |

**W3 小计**：2.5 人日（Dev A 2.0 + Dev B 1.0 — Dev B 紧张）

---

## 三、任务依赖图

```
T1 (Prisma)
  │
  ├─→ T2 (dev_login ADMIN_KEY)
  │
  └─→ T3 (M365 OAuth client)
         │
         └─→ T4 (M365 callback endpoint)
                │
                └─→ T7b (登录页 UI) ──→ T9 (集成测试)
                                         
T5 (账号密码登录) ──→ T7b
  │
  └─→ T6a (改密) ──→ T7c (Profile) ──→ T9

T6b (admin 重置) ──────────────────────→ T9
T8 (锁定/解锁)  ──────────────────────→ T9
```

**关键路径**：T1 → T3 → T4 → T7b → T9（**最长 4.5d**）

---

## 四、与现有 Sprint 2 任务不冲突

| 现有任务 | 状态 | 本 checklist 是否冲突 |
|---|---|---|
| A11 mdm.User 加 7 字段 | ✅ Sprint 2 已完成 | ❌ 不冲突（7 字段保留）|
| A12 `/auth/v1/login` bcrypt 改造 | ✅ Sprint 2 已完成 | ❌ 不冲突（T5 复用）|
| S2-5 ~ S2-8 修 High | ✅ Sprint 2 已完成 | ❌ 不冲突 |
| S2-9+10 角色守卫 | ✅ Sprint 2 已完成 | ❌ 不冲突 |
| S2-11 @mrdi/ui 抽组件 | ✅ Sprint 2 已完成 | ❌ 不冲突（Profile 改密用 StatusBadge 等）|
| A13 admin 改密/重置/解锁 API | 🟡 W3 已规划 | **T6b 替 A13 实现**；UI 推到 Sprint 3 W3 |
| A14 dev_login flag | 🟡 W3 推后 | **T2 替 A14 实现**（提前）|
| A15 鉴权中间件统一 | 🟡 W3 推后到 S3 W3 | ❌ 不冲突（推后保留）|

---

## 五、验收标准

### 5.1 功能验收

- [ ] M365 OAuth（dev mock）：能用 mock 邮箱登录，sessionStorage 存 JWT，跳转 /dashboard
- [ ] 账号密码登录：dev 环境默认入口；能登录；bcrypt 验证；登录审计写
- [ ] 5 次密码错误 → 423 Locked 15 分钟 → admin 解锁
- [ ] 改密：用户自己改密成功；强度校验；password_history 检查
- [ ] admin 重置密码：admin 可重置任意用户；目标用户下次登录强制改密
- [ ] dev_login 收紧：无 ADMIN_KEY 返 403；有 key 走通
- [ ] LoginAudit 表完整：login.success / login.fail / account.locked / password.changed / user.unlocked / password.reset

### 5.2 安全验收

- [ ] 密码 bcrypt cost=12 存储
- [ ] 登录失败详细日志（IP / UA / 时间）
- [ ] Session JWT HS256 / 8h 过期
- [ ] dev_login ADMIN_KEY env 注入（不进 git）
- [ ] M365 callback state 参数防 CSRF

### 5.3 文档验收

- [ ] TEST_REPORT_v4 出炉（08-08）
- [ ] MASTER_PLAN v1.0.2（已含本 checklist 摘要）
- [ ] TOP_LEVEL_PLAN v1.2.1 同步
- [ ] CHANGELOG 2026-07-17-01 标 ✅ 已批准

---

## 六、风险与解法

| 风险 | 概率 | 影响 | 解法 |
|---|---|---|---|
| T3 M365 mock 跑不通 | 中 | 中 | **dev 默认走账号密码主入口**（T5 优先于 T4 跑通），M365 mock 留 Sprint 3 末 |
| T4 callback state 防 CSRF 漏 | 低 | 高 | 用 `crypto.randomUUID()` + sessionStorage 存 state，callback 验证一致 |
| T6b admin 重置密码 UI 跳票 | 中 | 低 | API 跑通即可，UI 推到 Sprint 3 W3（S3-9）|
| Dev B 50% 时间被吃掉 | 中 | 中 | Dev A W3 收口期接管 UI 收尾；retro 调 W4 资源 |
| ADMIN_KEY 泄漏到 git | 低 | 高 | `.env.example` 写 placeholder；`.env` 加 `.gitignore`（已就绪）|

---

## 七、回滚方案

```bash
# 立即回滚到 ADR-0005 行为（仅 dev）
docker compose down mdm-api
git revert <commit-hash>
docker compose build mdm-api
docker compose up -d mdm-api

# 解除 dev_login ADMIN_KEY 限制（紧急）
# 临时方案：把 ADMIN_KEY 写入 .env，重启
echo "ADMIN_KEY=dev-admin-key-2026-mrdi" >> mdm-api/.env
docker compose restart mdm-api
```

---

## 八、与 SPRINT 2 收口时间线对齐

| 日期 | 节点 | Owner |
|---|---|---|
| 07-20 周一 | Sprint 2 启动会（用本 checklist）| 双方 |
| 07-24 周五 | W1 收口 demo（M365 mock 跑通）| Dev A 主 demo |
| 07-31 周五 | W2 收口 demo（账号密码主入口 + Profile 改密）| Dev B 主 demo |
| 08-05 周三 | W3 中段 review（集成测试进度）| Dev A |
| 08-07 周四 | TEST_REPORT v4 草案 | Dev A |
| 08-08 周五 | Sprint 2 review + retro | 全员 |

---

*维护人：Mavis（执行）/ Jerry（决策）*
*评审周期：每周五 + 变更发生时*
*下次 review：2026-07-24（W1 收口）*

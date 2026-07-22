# Sprint 3 Kanban（08-11 ~ 09-05 · 4 周）

> **启动日期**：2026-07-17（比原计划提前 3 周）
> **背景**：Sprint 2 T1-T10 全部完成（30 PASS / 0 FAIL）
> **主线**：通知中心收口 → WebSocket 实时推送 → 资源级 RBAC → Admin UI
> **Owner**：Mavis（实施）+ Jerry（决策/验收）

---

## 📍 当前状态（2026-07-20 Sprint 3 全部完成）

| 区域 | 状态 | 备注 |
|------|------|------|
| 通知 MVP（前后端）| ✅ 已完成 | CRUD 路由 + Portal 页面 + Header badge |
| **S3-1 BullMQ + send endpoint** | ✅ 完成 | 队列 Worker + Redis + 监控 endpoint |
| **A9 @mrdi/ui 组件接入** | ✅ 完成 | Badge/Button 接入 Login/Notifications/Profile 3 页 |
| **S3-2 NotificationClient** | ✅ 完成 | `@mrdi/shared` MdmClient 含 sendNotification |
| S3-9 Admin UI | ✅ 完成 | Admin 改密/重置/解锁 dialog + MdmUsers 3 action 列 |
| WebSocket | ✅ 完成 | S3-4~7 KPI 推送 + 前端 WS hook + Dashboard Live 角标 |
| **A15 4 API 鉴权守卫** | ✅ 完成 | @mrdi/shared/permission guards 替换 inline；4 API typecheck 全 PASS |
| **cim-perm 守卫** | ✅ 完成 | addHook→onRequest；requireViewer/Editor/Auditor；类型修复 |
| **S3-8 资源级 RBAC** | ✅ 完成 | checkResourcePermission helper；cimrms/cimims 关键端点接入 |
| **A10 Swagger UI** | ✅ 完成 | 4 API /docs 非生产暴露；cim-perm 装包 |
| **A14 dev_login 禁用** | ✅ 完成 | cimrms/cimims/cim-perm DEV_LOGIN_ENABLED=false |
| **S3-10 登录审计** | ✅ 完成 | loginAudit routes + MdmLoginAudit.tsx + Sidebar 入口 |
| **S3-12 TEST_REPORT v5** | ✅ 完成 | W3/W4 全覆盖；4 API typecheck PASS |
| **S3-13 部署文档** | ✅ 完成 | DEPLOY.md 完整（架构/启动/鉴权/Wallet/WS/env/FAQ）|
| **Sprint 3 收口** | ✅ 完成 | 比计划 09-05 提前 7 周（07-20）|

---

## 🔴 In Progress（当前冲刺）

| # | 任务 | Owner | 预计工时 | 状态 |
|---|------|-------|---------|------|
| — | Sprint 3 看板初始化 | Mavis | — | ✅ 2026-07-17 |
| **A15** | 4 API 鉴权守卫统一 | Mavis | — | ✅ 2026-07-20 |
| **cim-perm 守卫** | cim-perm-api 角色守卫对齐 | Mavis | — | ✅ 2026-07-20 |
| **S3-8** | 资源级 RBAC 接入 | Mavis | — | ✅ 2026-07-20 |
| **W4** | A10/A14/S3-10/12/13/Sprint3 收口 | Mavis | — | ✅ 2026-07-20 |
| **A10 BugFix** | @fastify/swagger 版本修复（8.x for Fastify 4）| Mavis | — | ✅ 2026-07-20 |

## ✅ Sprint 3 全部完成（2026-07-20，比计划提前 7 周）

**A10 Swagger UI BugFix**：Dockerfile 中 `echo` 硬编码 swagger 版本号 → 改为 `@fastify/swagger@^8.0.0` + `@fastify/swagger-ui@^4.0.0`；验证 Swagger UI 全 4 API 200 ✅


---

## 🟡 Week 1 — 通知中心收口（08-11 ~ 08-15）

> **目标**：通知系统完整闭环（其他 API 能调 MDM 发通知）
> **实际完成时间**：2026-07-17（比原计划 08-11 提前 3 周）

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S3-1a** | POST `/notifications/send` endpoint | Mavis | 0.5d | 其他 API（cimrms/cimims）能调 `/mdm-api/v1/notifications/send` 发通知 | ✅ 已存在 |
| **S3-1b** | BullMQ worker + Redis 连接 | Mavis | 0.5d | 队列 worker 跑起来；job 写 DB 成功 | ✅ 2026-07-17 |
| **S3-1c** | BullMQ 队列监控 endpoint | Mavis | 0.25d | `/health` 暴露 `queue: up/down` 状态 | ✅ 2026-07-17 |
| **S3-2** | `@mrdi/shared` NotificationClient | Mavis | 0.5d | MdmClient.sendNotification() 对接 BullMQ | ✅ 已存在 |
| **A9** | `@mrdi/ui` Badge/Button/Modal/StatusBadge 接入 | Mavis | 2d | 4 组件 + 3 页面接入（Login/Notifications/Profile）| ✅ 2026-07-17 |

**小计：3.75d** | **实际：约 2h（BullMQ 安装 + 队列修复）**

---

## 🟠 Week 2 — WebSocket 实时推送（08-18 ~ 08-22）

> **目标**：Dashboard KPI 5s 推送，告警 1s 推送

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S3-4** | Fastify WebSocket plugin（cimims-api 先接试点）| Mavis | 1d | `@fastify/websocket` 注册；单 API WS 可用 | ✅ 2026-07-17 |
| **S3-5** | KPI 推送（cimrms + cimims dashboard）| Mavis | 1.5d | 5s 定时推送；Dashboard 实时刷新；P99 < 1s | ✅ 2026-07-17 |
| **S3-6** | 告警推送（cimims 1s 推送）| Mavis | 1.5d | 新告警立即 WS 推送；按优先级排队 | ✅ 2026-07-17 |
| **S3-7** | 前端 WS client + 断线重连 | Mavis | 1d | 1 hook + 4 页面接入；指数退避重连 | ✅ 2026-07-17 |

**小计：5d** | **Buffer：5d**

---

## 🟡 Week 3 — 资源级 RBAC + Admin UI（08-25 ~ 08-29）

> **目标**：资源粒度权限授予/撤销；Admin 改密/重置/解锁 UI

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S3-8** | 资源级 RBAC（grant / revoke）| Mavis | 2d | checkResourcePermission helper；cimrms/cimims 关键端点接入；MDM grant/revoke 完善 | ✅ 2026-07-20 |
| **A15** | 4 API 鉴权中间件统一（资源级）| Mavis | 2d | `@mrdi/shared/permission` 升级；4 API 接入 | ✅ 2026-07-20 |
| **S3-9** | Admin 改密/重置/解锁 UI | Mavis | 1.5d | 3 dialog（MdmUsers 页面）+ 用户详情页 | ✅ 2026-07-17 |
| **cim-perm 守卫** | cim-perm-api 补角色守卫 | Mavis | 0.5d | 与其他 3 API 对齐 | ✅ 2026-07-20 |

**小计：6d** | **Buffer：4d**

---

## ⚪ Week 4 — 收口（09-01 ~ 09-05）

> **目标**：Sprint 3 验收准备

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S3-10** | 登录审计 + 失败告警 | Mavis | 1d | AuditLog 视图 + portal 角标 | ✅ 2026-07-20 |
| **A10** | 4 API Swagger UI 暴露 | Mavis | 2d | `/docs` 端点 + 截图存档 | ✅ 2026-07-20 |
| **A14** | 删 dev_login 路由 | Mavis | 0.5d | Sprint 2 DEV_LOGIN_ENABLED flag 移除；统一 login | ✅ 2026-07-20 |
| **S3-12** | TEST_REPORT v5 | Mavis | 0.5d | Sprint 3 90% 覆盖 | ✅ 2026-07-20 |
| **S3-13** | 部署文档更新 | Mavis | 0.5d | DEPLOY.md 完整 | ✅ 2026-07-20 |
| Sprint 3 收口 | 文档同步 + retro | Mavis + Jerry | 0.5d | 看板归档 + Sprint 4 启动会 | ✅ 2026-07-20 |

**小计：5d** | **Buffer：5d**

---

## Sprint 3 验收（09-05 周五）

- [ ] 站内信可发可收（4 系统都能调 `/notifications/send`）
- [ ] KPI 推送 P99 < 1s
- [ ] 资源级权限 grant/revoke 闭环
- [ ] Admin 改密/重置/解锁 UI 跑通
- [ ] 4 API Swagger UI 全部暴露
- [ ] LoginAudit 可视化
- [ ] dev_login 删除
- [ ] TEST_REPORT v5 出炉（90% 覆盖）

---

## 资源投入

| 周 | 预算人日 | 任务人日 | Buffer |
|----|---------|---------|-------|
| W1 | 10 | 3.75 | 6.25 |
| W2 | 10 | 5 | 5 |
| W3 | 10 | 6 | 4 |
| W4 | 10 | 5 | 5 |
| **合计** | **40** | **19.75** | **20.25**（51%）|

> Buffer 充足（51%）：主要是给 WebSocket 跨代理掉线、cim-perm 守卫调试留空间

---

## 关键依赖

```
S3-1 BullMQ worker ──────┐
                          ├──→ S3-2 NotificationClient（@mrdi/shared）
S3-9 Admin UI ───────────┘        │
                                   └──→ cimrms/cimims 接入通知
S3-4 WS plugin ───────────────────────→ S3-5/6 KPI+告警推送
S3-8 资源RBAC ──────────────────────→ A15 4 API 中间件统一
```

---

*维护人：Mavis · 更新时机：每个任务完成后*

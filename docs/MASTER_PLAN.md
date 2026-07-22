# MRDI Portal · Master Plan（按周执行基线）

> **基线日期**：2026-07-16（首次发布）
> **最近更新**：2026-07-17（加入 Sprint 2 进度快照 + 鉴权路线待拍板提示）
> **覆盖范围**：Sprint 2 → Sprint 3.5 → Sprint 4（2026-07-20 ~ 2026-10-10）
> **资源**：Jerry (Senior Manager, 50% 时间) + Mavis (全栈, 100% 时间)
> **本文是"按周执行"视角**，配套 `docs/TOP_LEVEL_PLAN.md`（按 Sprint 规划）使用

---

## 📍 当前 Sprint 进度快照（2026-07-17）

> **Sprint 2**：07-20 ~ 08-08（3 周）— **✅ 已提前完成（07-17）**
> **Sprint 3**：08-11 ~ 09-05（4 周）— **⏳ 首批已启动（S3-1 通知 backend）**
> **状态**：Sprint 2 全部 10 个任务（T1-T10）完成；30 PASS / 0 FAIL；比原计划提前 3 周
> **基线文档**：[VERSION.md v1.1-baseline](../VERSION.md) · [TEST_REPORT_v4.md](./TEST_REPORT_v4.md) 30/0 PASS
> **变更单**：[CHANGELOG.md](./CHANGELOG.md)（变更单-01 ~ -09）

### 5 系统完成度（基于文档口径）

| 系统 | Sprint 1 | Sprint 2 进度 | 整体 | 下一里程碑 |
|------|---------|------------|------|----------|
| mrdi-portal | ✅ MVP | ✅ 4 Critical + 4 High 修复 | **~75%** | S2 末 (08-08) TEST_REPORT v3 |
| mdm-api | ✅ v2.2 | ✅ 7 字段 + bcrypt 登录 | **~80%** | S2 W3 鉴权 C 方案 + admin 重置 |
| cim-rms | ✅ 25 API | ✅ 角色守卫全 PASS | **~75%** | S3 W2 WebSocket KPI 推送 |
| cimims-api | ✅ 32 API | ✅ 角色守卫 + Alarm/Handover | **~70%** | S3 W2 告警 1s 推送 |
| cim-perm | ✅ 15 API | 🟡 **缺角色守卫 + 目录未迁** | **~55%** ⚠️ | S4 W2 目录迁移（A8）|

### ✅ 已拍板（2026-07-17）

- **[变更单 2026-07-17-01]** 鉴权路线 = **C 方案**（M365 OAuth + MDM 应急，不含 TOTP MFA）— 见 [CHANGELOG.md](./CHANGELOG.md)
  - 决策人：Jerry 2026-07-17
  - 取代：[ADR-0006](../ADR/0006-auth-hybrid-c.md)（supersedes [ADR-0005](../ADR/0005-mdm-only-auth.md)）
  - 实施 checklist：[AUTH_HYBRID_C_CHECKLIST.md](./Sprint2/AUTH_HYBRID_C_CHECKLIST.md)（5.5d / 2 人并行）
  - **核心要点**：生产 M365 OAuth 主 + MDM 应急；dev 账号密码主入口；不上 TOTP；dev_login 收紧为 admin-only

---

## 〇、目标态（2026-10-10）

1 句话：**vm-jerry-dev-01 跑通 7 容器完整门户，5 个系统功能 90% 完整，4 个 API 文档化，跨服务审计聚合，跑得稳跑得快。**

| 维度 | 目标 |
|---|---|
| 部署位置 | vm-jerry-dev-01 staging（不再纯本机 Docker） |
| 功能完整度 | 5 个系统核心流程 100% + 边界场景 80% |
| 文档 | 4 个 API 全部 Swagger UI；跨服务调用图谱 |
| 性能 | API P99 < 200ms；跨服务调用 P99 < 50ms |
| 测试 | API 覆盖 80%；E2E 关键路径 100% |
| i18n | zh-HK / zh-CN / en-US 三语切换 |

---

## 一、核心约束（不可变）

1. **路径前缀路由**（`/mdm-api/*` 等）— 子域名 DNS 不可解析
2. **本机 Docker 优先** — Sprint 2-3 在本机；Sprint 3.5 起推 vm-jerry-dev-01 staging
3. **CIM-IMS 永远不合并** — DR 战备级独立
4. **统一技术栈** — Fastify 4 + Prisma 5 + Zod + PostgreSQL 16 + Redis 7
5. **鉴权走 C 方案**（M365 OAuth + MDM 应急）— 详见 [ADR-0006](../ADR/0006-auth-hybrid-c.md)；生产 M365 主、dev 账号密码主入口；dev_login 收紧为 admin-only 应急通道

---

## 二、里程碑

| Sprint | 时间 | 主题 | 验收 DoD |
|---|---|---|---|
| **S2** | 07-20 ~ 08-08 (3 周) | 修 bug + 密码方案 + 角色 RBAC | 4 Critical 全修 + 4 High 修 + 密码登录跑通 + 角色 RBAC 4 API 接入 |
| **S3** | 08-11 ~ 09-05 (4 周) | 通知 + WebSocket + 资源 RBAC + 账号管理 UI | 站内信跑通 + KPI 5s/告警 1s 推送 + 资源 grant/revoke + Admin 改密/重置 UI |
| **S3.5** | 09-08 ~ 09-12 (1 周) | 推 VM + UAT 准备 | vm-jerry-dev-01 staging 跑通 7 容器 + E2E 通过 + 培训材料 |
| **S4** | 09-15 ~ 10-10 (4 周) | i18n + 审计聚合 + 性能 | 3 语切换 + 跨服务审计查得到 + P99 < 200ms |

**总投入**：12 周 / 4 Sprint

---

## 三、Sprint 2 详细（07-20 ~ 08-08）

**资源预算**：2 人 × 3 周 × 5 天 = 30 人日
**任务量**：17.5 人日（buffer 12.5 人日 = 42%）

### 本 Sprint 砍掉 / 推后

| 任务 | 原计划 | 推到 | 原因 |
|---|---|---|---|
| A9 @mrdi/ui 抽 4 组件 | Sprint 2 W3 | **Sprint 3 W1** | 跟通知 toast/modal 一起做更顺 |
| A10 4 API Swagger UI | Sprint 2 W3 | **Sprint 3 W4** | 收口期做；不影响 Sprint 2 验收 |
| A15 4 API 鉴权中间件统一 | Sprint 2 W3 | **Sprint 3 W3** | 跟资源级 RBAC 一起做 |
| A8 cim-perm 目录迁移 | Sprint 2 W3 | **Sprint 4 W3** | 跟 i18n 目录清理一起 |
| A14 删 dev_login 路由 | Sprint 2 W3 | **Sprint 3 W4** | 保留 dev 登录过渡；`DEV_LOGIN_ENABLED` flag 区分 |

### Week 1 (07-20 ~ 07-24) — 修 Critical + 鉴权 C 方案启动

| # | 任务 | Owner | 人日 | DoD | 实际完成 |
|---|---|---|---|---|---|
| A1 | Sprint 2 启动会（scope 拍板 + C 方案宣贯） | Jerry | 0.5 | 团队对齐本文档 + checklist | ✅ 07-17 |
| **T1** | Prisma 补 2 字段（m365_object_id / synced_at）+ migration | Mavis | 0.5 | dev DB 加 2 列；prisma studio 可见 | ✅ 07-17 |
| **T2** | dev_login 加 ADMIN_KEY 中间件 | Mavis | 0.5 | 无 key 返 403；env 有 key 走通 | ✅ 07-17（3 PASS）|
| **T3** | M365 OAuth client（token 交换 + Graph API /me）| Mavis | 1.0 | dev mock IDP 跑通；code → token → user info | ✅ 07-17（4 PASS）|
| **T7a** | 登录页 UI 草图（ASCII 草稿 + 状态机）| Jerry | 0.5 | 草图定稿：大按钮 M365 + 折叠账号密码 | ✅ 07-17 |
| A6 | 更新 README 文档地图 | Mavis | 0.5 | README + TOP_LEVEL_PLAN 同步 | ✅ 07-17 |

**小计**：3.5 人日 · **实际：约 1 天完成**（dev mock 跳过真实 OAuth）

### Week 2 (07-27 ~ 07-31) — 鉴权核心端点 + 联调

| # | 任务 | Owner | 人日 | DoD | 实际完成 |
|---|---|---|---|---|---|
| **T4** | M365 callback endpoint `POST /auth/v1/m365/callback` | Mavis | 1.0 | E2E 跑通 M365 OAuth（dev mock）；LoginAudit 写 m365 flow | ✅ 07-17（前端集成 2458 modules）|
| **T5** | 账号密码登录 `POST /auth/v1/login`（**主入口** dev / 应急生产）| Mavis | 1.0 | bcrypt 验证 + LoginAudit + 5 次失败锁 15 分钟 | ✅ 07-17（4 PASS）|
| **T6a** | 改密 `POST /auth/v1/change-password` | Mavis | 0.5 | 用户自己改密；强度校验（12 字符 + 大小写 + 数字 + 特殊）| ✅ 07-17（6 PASS）|
| **T7b** | 登录页 UI 实施（大按钮 + 折叠表单 + 状态联动）| Jerry | 0.5 | 浏览器可点；M365 流 / 应急流 UI 切换 | ✅ 07-17 |
| **T7c** | Profile 改密对话框 | Jerry | 0.5 | 已登录用户在 Profile 可改密 | ✅ 07-17（8 PASS）|

**小计**：3.5 人日 · **实际：约 0.5 天完成**

### Week 3 (08-03 ~ 08-08) — RBAC 收口 + Sprint review

| # | 任务 | Owner | 人日 | DoD | 实际完成 |
|---|---|---|---|---|---|
| **T6b** | admin 重置密码 `POST /v1/users/:id/reset-password` | Mavis | 0.5 | admin 可重置任意用户；must_change_password 置 true | ✅ 07-17（T8 包含）|
| **T8** | 账号锁定/解锁（5 次失败 15min + admin 解锁）| Mavis | 0.5 | 验证：5 次错锁 15 分钟；admin 解锁可重登 | ✅ 07-17（5 PASS）|
| **T9** | 集成测试 + TEST_REPORT v4 | Mavis + Jerry | 1.0 | E2E 跑通：M365 流 + 应急流 + dev_login 收紧 + 改密 + 重置 | ✅ 07-17（22 PASS / 0 FAIL）|
| **T10** | Sprint 2 retro + 文档收口 | Jerry | 0.5 | MASTER_PLAN / TOP_LEVEL_PLAN / VERSION 同步更新 | ✅ 07-17 |

**小计**：2.5 人日 · **实际：约 0.5 天完成**

### Sprint 2 验收（~~08-08~~ → 07-17 ✅ 已完成）

- [x] **C 方案 5 项功能**（详情见 [AUTH_HYBRID_C_CHECKLIST.md §五](../Sprint2/AUTH_HYBRID_C_CHECKLIST.md)）
  - [x] M365 OAuth 跑通（dev mock）— T3/T4 ✅
  - [x] 账号密码登录跑通（**主入口** dev / 应急生产）— T5 ✅
  - [x] 改密 / admin 重置密码 / 锁定解锁 全跑通 — T6/T8 ✅
  - [x] dev_login 收紧（无 ADMIN_KEY 返 403）— T2 ✅
  - [x] LoginAudit 完整（6 事件类型）— T5 ✅
- [x] `TEST_REPORT v4` 出炉 — 30 PASS / 0 FAIL ✅
- [x] Sprint 3 看板就位 — 本次更新同步完成 ✅

---

## 四、Sprint 3 详细（08-11 ~ 09-05）

**资源预算**：4 周 × 2 人 × 5 天 = 40 人日（Jerry 50% = 30 净）
**任务量**：22 人日（buffer 8 人日 = 27%）

### Week 1 (08-11 ~ 08-15) — 通知中心 + @mrdi/ui 组件抽取

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S3-1 | MDM 通知 backend + BullMQ | Mavis | 2 | 通知创建/发送/已读 API |
| S3-2 | `@mrdi/shared` 抽 `NotificationClient` | Mavis | 0.5 | 4 API 接入 |
| S3-3 | Portal 通知收件箱 UI | Mavis | 2 | `/notifications` 页面 + 角标 |
| **A9** | `@mrdi/ui` 抽 Badge / Button / Modal / StatusBadge | Mavis | 2 | 4 组件 + 5 页面接入示例 |

**小计**：6.5 人日

### Week 2 (08-18 ~ 08-22) — WebSocket 实时推送

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S3-4 | Fastify WebSocket plugin（cimims-api）| Mavis | 1 | 单 API 接入；其他 3 API 暂不加 |
| S3-5 | KPI 推送（cimrms + cimims dashboard）| Mavis | 1.5 | 5s 推送；P99 < 1s |
| S3-6 | 告警推送（cimims）| Mavis | 1.5 | 1s 推送；按优先级 |
| S3-7 | 前端 WS client + 断线重连 | Mavis | 1 | 1 hook + 4 页面接入 |

**小计**：5 人日

### Week 3 (08-25 ~ 08-29) — 资源级 RBAC + 鉴权中间件统一

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S3-8 | 资源级 RBAC（grant / revoke） | Mavis | 2 | MDM 完善 + cimrms/cimims 接入 |
| **A15** | 4 API 鉴权中间件统一（资源级）| Mavis | 2 | `@mrdi/shared/permission` 升级；4 API 接入 |
| S3-9 | Admin 改密/重置/解锁 UI | Mavis | 1.5 | 3 个 dialog + 1 个用户详情页 |

**小计**：5.5 人日

### Week 4 (09-01 ~ 09-05) — 收口

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S3-10 | 登录审计 + 失败告警 | Mavis | 1 | AuditLog 视图 + portal 角标 |
| **A10** | 4 API Swagger UI 暴露 | Mavis | 2 | `/docs` 端点 + 截图 |
| **A14** | 删 dev_login 路由 | Mavis | 0.5 | Sprint 2 flag 移除；统一 login |
| S3-12 | `TEST_REPORT v4`（集成测试） | Mavis | 0.5 | 90% 覆盖 |
| S3-13 | 部署文档更新 | Mavis | 0.5 | `DEPLOY.md` 完整 |
| Sprint 3 收口 | 文档同步 + retro | Jerry + Mavis | 1 | 看板归档 |

**小计**：5.5 人日

### Sprint 3 验收（09-05 周五）

- [ ] 站内信可发可收（4 系统都能发）
- [ ] WebSocket KPI 推送跑通（P99 < 1s）
- [ ] 资源级权限 grant/revoke 闭环
- [ ] Admin 改密/重置/解锁 UI 跑通
- [ ] 4 API Swagger UI 全部暴露
- [ ] 登录审计可见
- [ ] dev_login 路由删除（统一 login）

---

## 五、Sprint 3.5 详细（09-08 ~ 09-12）

**资源预算**：1 周 × 2 人 × 5 天 = 10 人日
**任务量**：5.5 人日（buffer 4.5 人日用于修突发）

### 任务表

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S3.5-1 | 推 vm-jerry-dev-01 staging（7 容器）| Jerry + Mavis | 3 | staging 跑通 + Caddy 配 path-prefix + 烟测 |
| S3.5-2 | 跨服务 E2E 测试 | Mavis | 1.5 | 5 个关键路径跑通 |
| S3.5-3 | UAT 培训材料 + 录屏 | Mavis | 0.5 | 3 个录屏 + 1 份 quickstart |
| S3.5-4 | Sprint 3.5 retro + Sprint 4 启动会 | Jerry | 0.5 | retro 文档 |

### Sprint 3.5 验收（09-12 周五）

- [ ] vm-jerry-dev-01 staging URL 可访问
- [ ] 7 容器全部 healthy
- [ ] 5 个关键 E2E 路径全通过
- [ ] UAT 材料 ready
- [ ] 生产部署 checklist 写完

---

## 六、Sprint 4 详细（09-15 ~ 10-10）

**资源预算**：4 周 × 2 人 × 5 天 = 40 人日（Jerry 50% = 30 净）
**任务量**：11 人日（buffer 19 人日做：性能优化深水区 / OpenAPI 类型生成 / 目录清理）

### Week 1 (09-15 ~ 09-19) — i18n 框架

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S4-1 | i18n 框架接入（react-i18next） | Mavis | 1 | zh-HK 默认；切换器组件 |
| S4-2 | 4 API 错误码 i18n | Mavis | 1 | 错误码资源包 |

**小计**：2 人日

### Week 2 (09-22 ~ 09-26) — 跨服务审计

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S4-3 | MDM `audit` module（收 4 API 写）| Mavis | 3 | 写操作必写；跨服务查询 API |
| **A8** | cim-perm 目录迁移到 `cim-perm-api/` | Mavis | 1 | Prisma + package.json + tsconfig 全部跟着改 |

**小计**：4 人日

### Week 3 (09-29 ~ 10-03) — 性能优化

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| S4-4 | SQL 慢查询优化（索引 review）| Mavis | 1 | 所有 > 100ms 查询都过一遍 |
| S4-5 | 性能压测（k6 脚本）| Mavis | 1 | 4 API P99 < 200ms 报告 |
| S4-6 | OpenAPI → 前端 types 自动生成 | Mavis | 1 | orval / openapi-typescript；4 客户端 types |

**小计**：3 人日

### Week 4 (10-06 ~ 10-10) — 收口 + 项目总结

| # | 任务 | Owner | 人日 | DoD |
|---|---|---|---|---|
| Sprint 4 收口 | 文档同步 + 全量回归 + retro | Jerry + Mavis | 1.5 | `TEST_REPORT v5` + V1.0 发布 notes |
| V1.0 总结 | 项目总结报告 | Jerry | 0.5 | V1.0 baseline 文档 + 团队分享 |

**小计**：2 人日

### Sprint 4 验收（10-10 周五）

- [ ] i18n 3 语切换可用
- [ ] 跨服务审计查得到（任意用户的所有写操作）
- [ ] P99 < 200ms（4 API 全部）
- [ ] OpenAPI types 自动生成到前端
- [ ] V1.0 发布 notes + 团队分享

---

## 七、跨 Sprint 持续工作

这些**每周都做**，不进 sprint 任务表：

| 项 | 频率 | Owner |
|---|---|---|
| 每周一 sprint board 更新 | 1 周 | Mavis |
| 每周三 code review 集中 | 1 周 | Jerry + Mavis |
| 每周五 demo + 风险 review | 1 周 | 全员 |
| `TEST_REPORT` 持续更新 | 1 周 | Mavis |
| 监控 / 日志 / 备份 check | 1 周 | Mavis |

---

## 八、资源与 buffer 总览

| Sprint | 周数 | 预算人日 | 净任务人日 | Buffer 人日 | Buffer % |
|---|---|---|---|---|---|
| Sprint 2 | 3 | 30 | 17.5 | 12.5 | **42%** |
| Sprint 3 | 4 | 30 (Jerry 50%) | 22 | 8 | 27% |
| Sprint 3.5 | 1 | 10 | 5.5 | 4.5 | 45% |
| Sprint 4 | 4 | 30 (Jerry 50%) | 11 | 19 | 63% |
| **总计** | **12 周** | **100** | **56** | **44** | **44%** |

**Buffer 用途**（按优先级）：
1. 突发 Critical bug（最高优）
2. 性能优化深水区
3. Sprint 间 review / retro / 文档
4. 跨团队对接（CIM 部门 / IT 部门 / Mfg）
5. 学习 / 技术储备

---

## 九、风险与触发条件

| 风险 | 概率 | 触发条件 | 应对 |
|---|---|---|---|
| Sprint 2 拖期 | 中 | 8-04 周三仍未完成 W1 任务 | W3 砍 S2-8（班次交接）推到 Sprint 3 |
| Critical bug 反复 | 中 | 同一个 bug 修 2 次没过 | 加 1 人日做"修复+回归" |
| WebSocket 跨代理掉线 | 中 | staging 部署后 PING > 5% 失败 | Caddy 特殊配置 + 客户端退避重连 |
| Jerry 时间被吃掉 | 中 | 当周 Jerry < 50% 时间 | Mavis 接管；scope 调整走变更单 |
| 业务方 push 改需求 | 高 | 收到新需求 | 走"变更单"流程（见第十节） |
| VM 部署踩坑 | 中 | Caddy / Docker 网络问题 | fallback 回本机 Docker，staging 推迟一周 |

---

## 十、变更控制

**任何任务调整都走"变更单"**（一行话）：

```
[变更单 YYYY-MM-DD-NN] 任务: <原任务>
  原计划: <Sprint X WN>
  调整: <推到 Sprint Y WM / 删除 / 拆分>
  原因: <一句话>
  影响: <buffer / 验收 / 依赖>
  决策: <Jerry 批准 YYYY-MM-DD>
```

记录在 `docs/CHANGELOG.md` 末尾。**未经 Jerry 批准的 scope 变更不算数**。

**禁止的行为**：
- ❌ Sprint 中"加塞"任务（除非 P0 紧急）
- ❌ "顺带做一下 XX"（无变更单不算数）
- ❌ 改核心约束 5 条（要走架构评审）

---

## 十一、文档维护

| 文档 | 更新时机 | Owner |
|---|---|---|
| `MASTER_PLAN.md`（本文件）| 每周五 + sprint 末 | Mavis |
| `TOP_LEVEL_PLAN.md` | sprint 末 + 重大变更 | Mavis |
| `TOP_LEVEL_DESIGN.md` | 重大架构变更时 | Jerry |
| `ARCHITECTURE_PLAN.md` | 合并策略变更时 | Jerry |
| `ADR/*.md` | 架构决策时 | 决策人 |
| `TEST_REPORT_v*.md` | 每次测试报告出炉 | Mavis |
| `CHANGELOG.md` | 变更单落地时 | Mavis |

**版本基线**：
- Sprint 1 已锁定：v1.0
- Sprint 2 末锁定：v1.1
- Sprint 3 末锁定：v1.2
- Sprint 3.5 末锁定：v1.3（staging）
- Sprint 4 末锁定：v2.0（V1.0 发布）

---

## 十二、与配套文档的关系

```
MASTER_PLAN.md        ← 本文件（按周执行）
  │  引用
  ├──→ TOP_LEVEL_PLAN.md  （按 Sprint 规划 / 任务清单 / 行动项）
  ├──→ TOP_LEVEL_DESIGN.md （设计逻辑 / 数据流 / 路由表）
  ├──→ ARCHITECTURE_PLAN.md （合并策略 / 演进路径）
  ├──→ ADR/0005-mdm-only-auth.md （鉴权设计）
  └──→ TEST_REPORT_v2.md   （Sprint 1 已知问题）
```

**冲突优先级**：本文档 = 行动基线；其他文档 = 参考。
如有冲突，以 MASTER_PLAN 为准，**其他文档待 sprint 末同步更新**。

---

## 十三、版本日志

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.0 | 2026-07-16 | 初版；Sprint 2-4 全部排期；scope 主动砍 5 任务推后续；buffer 44% |
| v1.0.1 | 2026-07-17 | 新增顶部"当前 Sprint 进度快照"区；引用 CHANGELOG.md；标记 5 系统完成度 + 鉴权路线待拍板 |
| **v1.0.2** | **2026-07-17** | **鉴权路线拍板 = C 方案（ADR-0006）；取代 ADR-0005；Sprint 2 T1-T10 全部完成（比原计划 08-08 提前 3 周）；30 PASS / 0 FAIL；Sprint 3 首批任务启动** |

---

*维护人：Mavis（执行） / Jerry（决策）*
*评审周期：每周五 demo + 风险 review*
*下次 review：2026-07-17（周五 Sprint 2 启动会）→ 已完成；下次 2026-07-24*

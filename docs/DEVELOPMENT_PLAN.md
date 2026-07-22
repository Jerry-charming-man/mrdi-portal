# MRDI Portal · 开发计划

> **基线日期**：2026-07-17（v1.1-baseline）
> **覆盖范围**：未来 12 周（Sprint 2-4）
> **资源**：Jerry (Senior Manager, 50%) + Mavis (全栈, 100%)
> **基线依据**：[VERSION.md](../VERSION.md) v1.1-baseline · [MASTER_PLAN.md](./MASTER_PLAN.md) · [TEST_REPORT_v3.md](./TEST_REPORT_v3.md) 6/6 PASS
> **版本**：v1.1 · 2026-07-17（A 路线锁定 + 鉴权 C 方案拍板 + SDK 冻结）

---

## 〇、TL;DR（一句话）

**当前 v1.1-baseline：5 系统核心流程全跑通；接下来 12 周聚焦"补 P0 缺口 + 实时推送 + i18n + 性能"，10-10 推到 V1.0 发布。**

---

## 一、5 系统当前完成度（2026-07-17）

| 系统 | Sprint 1 | Sprint 2 已修 | 整体 | 关键缺口 |
|------|---------|------------|------|---------|
| **mrdi-portal** | ✅ MVP | ✅ 4 Critical + 4 High 修复 + 4 组件抽取 | **~75%** | 通知收件箱、WS client、i18n、Admin UI |
| **mdm-api** | ✅ v2.2 | ✅ 7 字段 + bcrypt 登录 + 站内信子系统 | **~80%** | 审计 API、用户详情、PIV 异常 |
| **cim-rms** | ✅ 25 API | ✅ 角色守卫全 8 操作 | **~75%** | WebSocket KPI 推送、资源级 RBAC |
| **cimims-api** | ✅ 32 API | ✅ 角色守卫 7 操作 + Alarm/Handover | **~70%** | WebSocket 告警 1s 推送、资源级 RBAC |
| **cim-perm** | ✅ 15 API | 🟡 **缺角色守卫 + 目录未迁** | **~55%** ⚠️ | 角色守卫、目录迁 `cim-perm-api/`、Swagger UI |

**平均 ~71%**。Sprint 2 6/6 任务全部 PASS。**cim-perm 是唯一掉队系统，需要在 Sprint 2 末抢救**。

---

## 二、未来 12 周 Sprint 拆分

| Sprint | 时间 | 主题 | DoD |
|--------|------|------|-----|
| **Sprint 2** | 07-20 ~ 08-08（3 周） | 修 bug + 鉴权 C 方案落地 + 角色 RBAC | 鉴权 5 项 + 4 API 守卫齐 + TEST_REPORT v4 |
| **Sprint 3** | 08-11 ~ 09-05（4 周） | 通知 + WebSocket + 资源 RBAC + Admin UI | 站内信 + KPI 5s/告警 1s + grant/revoke + Admin 改密/重置/解锁 |
| **Sprint 3.5** | 09-08 ~ 09-12（1 周） | **本机 E2E + UAT 准备**（路线 A：VM 暂不推） | 5 E2E 路径 + 4 录屏 + `docs/VM_DEPLOY_CHECKLIST.md`（文档就绪，不执行） |
| **Sprint 4** | 09-15 ~ 10-10（4 周） | i18n + 审计聚合 + 性能 | 3 语切换 + 跨服务审计 + P99 < 200ms |

详细任务表见 [MASTER_PLAN.md](./MASTER_PLAN.md) §三-§六。

> **路线 A 说明**：Jerry 明确现阶段禁用 VM 部署。Sprint 3.5 改成本机端到端 E2E + UAT 录屏 + VM deploy checklist 文档先写好，等 V1.0 后评估是否解禁。

---

## 三、Sprint 2 详细（07-20 ~ 08-08）

### Week 1（07-20 ~ 07-24）— 修 Critical + 密码 schema

| # | 任务 | Owner | 人日 | DoD | 状态 |
|---|------|-------|------|-----|------|
| A1 | Sprint 2 启动会 | Jerry | 0.5 | 团队对齐 | 🟡 本周五 |
| A2 | mdm-api 补 `GET /v1/roles` | Mavis | 0.5 | curl 200 | ⏳ 待启动 |
| A3 | cimrms `/auth/me` → `/v1/auth/me` | Mavis | 0.5 | 端到端 | ⏳ |
| A4 | Portal Dashboard 三栏布局 | Mavis | 1 | 顶部 KPI + 3 列 | ⏳ |
| A5 | Portal Header 告警 badge 动态 | Mavis | 1 | Zustand + 5min 轮询 | ⏳ |
| A7 | 建 ADR-0001 / 0003 | Mavis | 0.5 | 2 个 ADR | ⏳ |
| **A11** | mdm.User 加 7 字段 | Mavis | 1 | Prisma migration + 4 API 跑通 | ⏳ |
| A6 | 更新 README 文档地图 | Mavis | 0.5 | README 同步 | ⏳ |

**小计**：6 人日 / Buffer 8 人日

### Week 2（07-27 ~ 07-31）— 修 High + 密码登录

| # | 任务 | Owner | 人日 | DoD | 状态 |
|---|------|-------|------|-----|------|
| S2-5 | MDM 页面接真实 API | Mavis | 1.5 | Users/Dashboard 真后端 | ⏳ |
| S2-6 | SPC CSV 导出 + 规则违反 | Mavis | 1 | CSV + 规则提示 | ⏳ |
| S2-7 | 告警确认/关闭状态联动 | Mavis | 1 | Alarms + store | ⏳ |
| S2-8 | 班次交接通知 | Mavis | 1 | Handover + API | ⏳ |
| **A12** | `/auth/v1/login` 改造 | Mavis | 2 | bcrypt + 5 次锁 15 分钟 | ⏳ |
| A14 | `DEV_LOGIN_ENABLED` flag | Mavis | 0.5 | dev/prod 区分 | ⏳ |
| **🎯 鉴权决策** | **C 方案**拍板（见 CHANGELOG 2026-07-17-01）| **Jerry** | ✅ DONE | ADR-0006 生效 + CHANGELOG 标 ✅ |

**小计**：7 人日

### Week 3（08-03 ~ 08-08）— RBAC + 收口

| # | 任务 | Owner | 人日 | DoD | 状态 |
|---|------|-------|------|-----|------|
| S2-9 | 角色级 RBAC（4 API 都加） | Mavis | 2 | middleware + 403 验证 | ⏳ |
| S2-10 | `@mrdi/shared` 抽 `permission.guard.ts` | Mavis | 1 | 共享中间件 | ⏳ |
| **A13** | Admin 改密/重置/解锁 API | Mavis | 2 | 3 endpoint + AuditLog | ⏳ |
| **🆕 P0-补** | cim-perm 角色守卫补齐 | Mavis | 0.5 | 与其他 3 API 一致 | ⏳ |
| **🆕 P0-补** | mdm-api 补 `GET /audit` 路由 | Mavis | 0.5 | MdmAudit 切真 | ⏳ |
| **🆕 P0-补** | MdmUsers 赋予角色真接 API | Mavis | 0.5 | 弹窗调真 | ⏳ |
| Sprint 2 收口 | 文档 + E2E + retro | Jerry + Mavis | 1.5 | TEST_REPORT v3 + retro | ⏳ |

**小计**：6.5 人日

### Sprint 2 验收（08-08）

- [ ] 4 个 Critical 全修
- [ ] 6 个 High 修完 ≥ 4 个
- [ ] 角色级 RBAC 跑通（dev_login 切角色测试）
- [ ] 密码登录跑通（dev + prod 各 1 次）
- [ ] **cim-perm 角色守卫补齐**（新增）
- [ ] **mdm-api P0 2 件修复**（新增）
- [ ] **鉴权路线决策落地**（新增）
- [ ] TEST_REPORT v3 出炉
- [ ] 任何推后任务在 Sprint 3 看板就位

---

## 四、Sprint 3 详细（08-11 ~ 09-05）

### Week 1（08-11 ~ 08-15）— 通知 + 组件抽取

| # | 任务 | Owner | 人日 | DoD |
|---|------|-------|------|-----|
| S3-1 | MDM 通知 backend + BullMQ | Mavis | 2 | 通知创建/发送/已读 API |
| S3-2 | `@mrdi/shared` 抽 `NotificationClient` | Mavis | 0.5 | 4 API 接入 |
| S3-3 | Portal 通知收件箱 UI | Mavis | 2 | `/notifications` + 角标 |
| A9 | `@mrdi/ui` 抽 4 组件 | Mavis | 2 | 4 组件 + 5 页面示例 |

**小计**：6.5 人日

### Week 2（08-18 ~ 08-22）— WebSocket 实时推送

| # | 任务 | Owner | 人日 | DoD |
|---|------|-------|------|-----|
| S3-4 | Fastify WebSocket plugin（cimims-api）| Mavis | 1 | 单 API 接入 |
| S3-5 | KPI 推送（cimrms + cimims dashboard）| Mavis | 1.5 | 5s 推送；P99 < 1s |
| S3-6 | 告警推送（cimims）| Mavis | 1.5 | 1s 推送；按优先级 |
| S3-7 | 前端 WS client + 断线重连 | Mavis | 1 | 1 hook + 4 页面接入 |

**小计**：5 人日

### Week 3（08-25 ~ 08-29）— 资源级 RBAC + 鉴权中间件统一

| # | 任务 | Owner | 人日 | DoD |
|---|------|-------|------|-----|
| S3-8 | 资源级 RBAC（grant/revoke）| Mavis | 2 | MDM 完善 + cimrms/cimims 接入 |
| A15 | 4 API 鉴权中间件统一（资源级）| Mavis | 2 | `@mrdi/shared/permission` 升级 |
| S3-9 | Admin 改密/重置/解锁 UI | Mavis | 1.5 | 3 dialog + 1 用户详情页 |

**小计**：5.5 人日

### Week 4（09-01 ~ 09-05）— 收口

| # | 任务 | Owner | 人日 | DoD |
|---|------|-------|------|-----|
| S3-10 | 登录审计 + 失败告警 | Mavis | 1 | AuditLog 视图 + 角标 |
| A10 | 4 API Swagger UI 暴露 | Mavis | 2 | `/docs` 端点 + 截图 |
| A14 | 删 dev_login 路由 | Mavis | 0.5 | flag 移除 |
| S3-12 | `TEST_REPORT v4`（集成测试）| Mavis | 0.5 | 90% 覆盖 |
| S3-13 | 部署文档更新 | Mavis | 0.5 | `DEPLOY.md` 完整 |
| Sprint 3 收口 | 文档 + retro | Jerry + Mavis | 1 | 看板归档 |

**小计**：5.5 人日

### Sprint 3 验收

- [ ] 站内信可发可收（4 系统都能发）
- [ ] WebSocket KPI 推送 P99 < 1s
- [ ] 资源级 grant/revoke 闭环
- [ ] Admin 改密/重置/解锁 UI 跑通
- [ ] 4 API Swagger UI 全部暴露
- [ ] 登录审计可见
- [ ] dev_login 路由删除（统一 login）

---

## 五、Sprint 3.5 详细（09-08 ~ 09-12）— 路线 A：本机 E2E + UAT

> 1 周 / 10 人日 / 任务 5.5 / Buffer 4.5
> **VM 部署暂不执行**，`docs/VM_DEPLOY_CHECKLIST.md` 文档先写好，等 V1.0 后评估解禁

| # | 任务 | Owner | 人日 | DoD |
|---|------|-------|------|-----|
| S3.5-1 | **本机端到端 5 路径 E2E**（登录 / RBAC / WS / 通知 / 审计）| Mavis | 2.0 | 5 路径全部跑通 |
| S3.5-2 | UAT 录屏（4 系统各 1）| Mavis | 1.0 | 4 录屏 + 1 quickstart |
| S3.5-3 | 写 `docs/VM_DEPLOY_CHECKLIST.md`（**文档就绪，不执行**）| Mavis | 0.5 | 等解禁直接用 |
| S3.5-4 | retro + Sprint 4 启动会 | Jerry | 0.5 | retro 文档 |

**验收**：本机 5 E2E 全过 + 4 录屏 + VM checklist 文档 ready（**不推 VM**）

---

## 六、Sprint 4 详细（09-15 ~ 10-10）

> 4 周 / 30 人日 / 任务 11 / Buffer 19（63%）

| # | 任务 | Owner | 人日 | DoD |
|---|------|-------|------|-----|
| S4-1 | i18n 框架（react-i18next）| Mavis | 1 | zh-HK 默认 + 切换器 |
| S4-2 | 4 API 错误码 i18n | Mavis | 1 | 错误码资源包 |
| S4-3 | MDM `audit` module（收 4 API 写）| Mavis | 3 | 写操作必写 + 跨服务查询 |
| A8 | cim-perm 目录迁移到 `cim-perm-api/`| Mavis | 1 | Prisma + package.json + tsconfig |
| S4-4 | SQL 慢查询优化（索引 review）| Mavis | 1 | > 100ms 全过一遍 |
| S4-5 | 性能压测（k6 脚本）| Mavis | 1 | 4 API P99 < 200ms 报告 |
| S4-6 | OpenAPI → 前端 types 自动生成 | Mavis | 1 | orval / openapi-typescript |
| Sprint 4 收口 | 文档 + 全量回归 + retro | Jerry + Mavis | 1.5 | TEST_REPORT v5 + V1.0 notes |
| V1.0 总结 | 项目总结报告 | Jerry | 0.5 | V1.0 baseline 文档 |

**验收**：i18n 3 语 + 跨服务审计 + P99 < 200ms + OpenAPI types + V1.0 发布 notes

---

## 七、跨 Sprint 持续工作（每周都做）

| 项 | 频率 | Owner |
|----|------|-------|
| 每周一 sprint board 更新 | 1 周 | Mavis |
| 每周三 code review 集中 | 1 周 | Jerry + Mavis |
| 每周五 demo + 风险 review | 1 周 | 全员 |
| `TEST_REPORT` 持续更新 | 1 周 | Mavis |
| 监控 / 日志 / 备份 check | 1 周 | Mavis |

---

## 八、资源与 buffer 总览

| Sprint | 周数 | 预算人日 | 净任务人日 | Buffer 人日 | Buffer % |
|--------|------|---------|----------|----------|---------|
| Sprint 2 | 3 | 30 | 19.5 | 10.5 | **35%** |
| Sprint 3 | 4 | 30 | 22 | 8 | 27% |
| Sprint 3.5 | 1 | 10 | 5.5 | 4.5 | 45% |
| Sprint 4 | 4 | 30 | 11 | 19 | 63% |
| **总计** | **12 周** | **100** | **58** | **42** | **42%** |

> **注**：Sprint 2 净任务从 17.5 → 19.5（+2 补 cim-perm + mdm-api P0）

---

## 九、本周必做（07-17 ~ 07-24）

| # | 任务 | Owner | 截止 | 状态 |
|---|------|-------|------|------|
| **D0** | **路线 A 锁定 + DEVELOPMENT_PLAN v1.1** | Mavis | 07-17 今天 | ✅ DONE |
| **D1** | **鉴权 C 方案拍板** | Jerry | 07-17 今天 | ✅ DONE（CHANGELOG 2026-07-17-01）|
| **D2** | **cim-perm 角色守卫补齐** | Mavis | 07-24 | 🟢 立即启动 |
| D3 | Sprint 2 启动会（07-20 周一）| Jerry | 07-20 | ⏳ |
| D4 | mdm-api 补 `GET /audit` 路由 | Mavis | 07-24 | ⏳ |
| D5 | MdmUsers 赋予角色真接 API | Mavis | 07-24 | ⏳ |
| D6 | Sprint 2 W1 任务启动 | Mavis | 07-24 | ⏳ |

---

## 十、风险与触发条件

| 风险 | 概率 | 触发条件 | 应对 |
|------|------|---------|------|
| Sprint 2 拖期 | 中 | 8-04 仍未完成 W1 | W3 砍班次交接推到 Sprint 3 |
| Critical bug 反复 | 中 | 同 bug 修 2 次没过 | +1 人日做"修复+回归" |
| WebSocket 跨代理掉线 | 中 | PING > 5% 失败 | Caddy 特殊配置 + 客户端退避重连 |
| 业务方 push 改需求 | 高 | 收到新需求 | 走"变更单"流程（见 CHANGELOG.md）|
| VM 部署踩坑（Sprint 3.5 不执行但 Sprint 4 末可能重评）| 中 | V1.0 后评估解禁时遇到 Caddy/Docker 网络问题 | Fallback 回本机 Docker；buffer 留 45% |

---

## 十一、不做什么（明确划界）

- ❌ **不部署 VM**（**现阶段锁定**，本机 Docker 优先；Sprint 3.5 只做本机 E2E + 文档）
- ❌ **不拆 DB**（单 PG 多 schema 已够，2027+ 议题）
- ❌ **不合并 cim-ims-api**（DR 战备，永远独立）
- ❌ **不换 ORM**（Prisma 5 锁死）
- ❌ **不引入 Kubernetes**（Docker Compose + 本机已够用）
- ❌ **不接 Teams webhook**（等 v2.0，先做站内信）
- ❌ **不接 teams-notify-sdk**（**永久冻结**，等 V2.0 评估；见 CHANGELOG 2026-07-17-03）
- ❌ **不搞多租户**（单租户 MRDI，部门级隔离足够）

---

## 十二、版本日志

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-07-17 | 初版；基于 v1.1-baseline + MASTER_PLAN + Sprint 2 6/6 PASS 整合 |
| **v1.1** | **2026-07-17** | **4 处冲突修复**：①鉴权路线拍板=C 方案（CHANGELOG 2026-07-17-01）②Sprint 3.5 改本机 E2E（路线 A，VM 暂不推）③teams-notify-sdk 永久冻结（CHANGELOG 2026-07-17-03）④§十一加 VM 现阶段禁用 + SDK 冻结边界；同步更新 §二/§五/§九/§十 |

---

*维护人：Mavis（执行） / Jerry（决策）*
*评审周期：每周五 demo + 风险 review*
*下次 review：2026-07-24（周五 Sprint 2 W1 收口）*

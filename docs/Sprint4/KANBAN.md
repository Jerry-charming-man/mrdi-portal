# Sprint 4 Kanban（W13–W16 · 09-15 ~ 10-10 · v1.0 收口）

> **启动日期**：2026-07-20（比原计划 09-15 提前 8 周）
> **主题**：i18n + 审计聚合 + 性能优化 + 前端 types 同步
> **Owner**：Mavis（实施）+ Jerry（验收）

---

## 📍 当前状态（2026-07-21 · v1.0 GA）

| 区域 | 状态 | 备注 |
|------|------|------|
| S4-1 i18n 框架 | ✅ 完成 | react-i18next + i18next-browser-languagedetector；Header Globe 切换器；Sidebar/Header/Login 全 i18n 化 |
| S4-2 API 错误码 i18n | ✅ 完成 | Zod error → i18nKey 结构；4 API 统一 + portal locale 加 keys |
| S4-3 审计聚合 | ✅ 完成 | MDM audit module + cimrms/cimims/cim-perm auditEvent + portal 页面 |
| S4-4 SQL 慢查询 | ✅ 完成 | `computeSlaPercent` N+1 → batch load |
| S4-5 性能压测 | ✅ 完成 | 4 API k6 脚本 + P99/P95 report；修复 cim-perm 403/500 根因（JWT role/MDM_BASE_URL/seq/itReview SQL） |
| S4-6 OpenAPI types | ✅ 完成 | 4 API openapi.yaml + orval 生成 TypeScript types + React Query hooks（`src/api/generated/`） |
| S4-7 TEST_REPORT_v6 | ✅ 完成 | 27/27 PASS（S4-1~6 全覆盖）；TypeScript 0 错误 |
| **S4-8 文档收口** | ✅ 完成 | README.md 同步 Sprint 4 状态；变更单-28 记录；KANBAN 归档 |

---

## ✅ Sprint 4 收口完成

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S4-1a** | 安装 `react-i18next` + `i18next` + `react-i18next` | Mavis | 0.5d | `src/i18n/index.ts` + locale 文件夹结构 | ✅ 2026-07-20 |
| **S4-1b** | zh-HK（繁中）locale 文件 + 翻译框架 | Mavis | 1d | 关键文案 100% 繁中化 | ✅ 2026-07-20 |
| **S4-1c** | zh-CN（简体）locale 文件 | Mavis | 0.5d | 关键文案 100% 简体化 | ✅ 2026-07-20 |
| **S4-1d** | en-US locale 文件 | Mavis | 0.5d | 关键文案 100% 英文化 | ✅ 2026-07-20 |
| **S4-1e** | Portal 语言切换器（Header Globe 图标）| Mavis | 1d | 3 种语言可切换；language 持久化 localStorage | ✅ 2026-07-20 |

---

## 🟡 Week 2 — 后端 i18n + 审计聚合（09-22 ~ 09-26）

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S4-2** | 4 API Zod error → i18n key | Mavis | 1d | `@mrdi/shared/errors` 加 `zodIssuesToI18n()`；4 API errorHandler 统一；portal locale 加 keys | ✅ 2026-07-21 |
| **S4-3a** | MDM audit module（`routes/audit.ts`）| Mavis | 1d | `POST /v1/audit/events` + `GET /v1/audit` | ✅ 2026-07-20 |
| **S4-3b** | `@mrdi/shared` `MdmClient.auditEvent()` | Mavis | 0.5d | 统一 audit 写入接口 | ✅ 2026-07-20 |
| **S4-3c** | cimrms `auditEvent()` 调用 | Mavis | 0.5d | `performTransition` 中写入 audit | ✅ 2026-07-20 |
| **S4-3d** | cimims / cim-perm `auditEvent()` 调用 | Mavis | 1d | incidents + requests 关键状态变更 | ✅ 2026-07-20 |
| **S4-3e** | Portal `MdmAudit.tsx` 接真实 API | Mavis | 1d | 替换 mock；分页/筛选 | ✅ 2026-07-20 |

---

## 🟠 Week 3 — 性能优化（09-29 ~ 10-03）

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S4-4** | SQL 慢查询优化（索引 review）| Mavis | 1.5d | 关键 query `explain`；加索引；P99 < 200ms | ✅ |
| **S4-5** | k6 性能压测 | Mavis | 1.5d | 场景脚本 + P99/P95 report | ✅ 2026-07-21 |

---

## 🟣 Week 4 — v1.0 收口（10-06 ~ 10-10）

| # | 任务 | Owner | 预计工时 | DoD | 状态 |
|---|------|-------|---------|-----|------|
| **S4-6** | OpenAPI → 前端 types（orval）| Mavis | 1.5d | 4 API → `src/api/generated/{api}/` TypeScript types + React Query hooks | ✅ 2026-07-21 |
| **S4-7** | TEST_REPORT_v6（v1.0 全面覆盖）| Mavis | 0.5d | 全部 6 个 S4 任务 90% 覆盖 | ✅ 2026-07-21 |
| **S4-8** | v1.0 文档收口 + CHANGELOG | Mavis | 0.5d | CHANGELOG 更新；README 同步 | ✅ 2026-07-21 |
| **Sprint 4 收口** | Retro + v1.0 交付 | Mavis + Jerry | 0.5d | Sprint 4 看板归档 | ✅ 2026-07-21 |

**Sprint 4 验收（2026-07-21）**：
- [x] 繁中 + 简体 + 英文字面化（i18n）覆盖全 portal
- [x] 跨服务审计可见（audit trail 统一）
- [x] API P99 < 200ms（k6 实测 P95 list < 10ms / create < 60ms）
- [x] 前端 types 与后端 OpenAPI 同步（orval generated hooks）
- [x] **v1.0 完成（MRDI Portal v1.0 GA）** ✅

---

## 资源投入

| Week | 日期 | 主题 | 预算人日 | Buffer |
|------|------|------|---------|-------|
| W13 | 09-15 ~ 09-19 | i18n 框架 + 繁中 | 10 | 4d |
| W14 | 09-22 ~ 09-26 | 英文 + 审计聚合 | 10 | 4d |
| W15 | 09-29 ~ 10-03 | 慢查询 + k6 压测 | 10 | 4d |
| W16 | 10-06 ~ 10-10 | types 同步 + v1.0 收口 | 10 | 4d |
| **合计** | | | **40** | **16d（40%）** |

---

*维护人：Mavis · 更新时机：每个任务完成后*

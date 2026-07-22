# AUTH_HYBRID_PRD v1.0 状态标记

> **原文件**：`AUTH_HYBRID_PRD.md`（v1.0 草案 · 2026-07-16）— 已知存在双重 UTF-8 编码问题（中文乱码），未修复
> **本文件作用**：标明原 PRD 已被决策采纳，避免误读

---

## ✅ 状态：已采纳 C 方案（2026-07-17）

**决策详情**：[ADR-0006 · 鉴权路线 C 方案（M365 OAuth + MDM 应急，不含 TOTP MFA）](../ADR/0006-auth-hybrid-c.md)
**实施 checklist**：[AUTH_HYBRID_C_CHECKLIST.md](./AUTH_HYBRID_C_CHECKLIST.md)

---

## C 方案 vs PRD v1.0 草案差异

| 维度 | v1.0 草案 | C 方案（已采纳）|
|---|---|---|
| M365 OAuth | ✅ | ✅ |
| MDM 应急登录 | ✅ | ✅ |
| TOTP MFA | ✅ | ❌（推 V2）|
| forgot-password 邮件 | ✅ | ❌（改用 admin 重置）|
| reset-password token | ✅ | ❌（同上）|
| dev_login 收紧 | dev 临时 | admin-only 永久（`ADMIN_KEY` env）|
| Prisma 补字段 | 6 字段 | **2 字段**（m365_object_id / synced_at）|
| Sprint 2 工作量 | 12.5d 从零起 | **5.5d**（schema 已 80% 就绪）|

---

## 为什么不选 B（含 TOTP）

- 港府非营利受资助方审计核心 = **SSO 登录来源可追溯**，M365 OAuth 已满足
- DR 断 M365 时用户手机可能也无网，TOTP 反而卡死自己
- 5.5d 装得下，TOTP 推 V2 评估

---

## 决策记录

- 决策人：Jerry（架构）+ Mavis（实施）
- 决策日期：2026-07-17
- 决策依据：港府审计硬约束 + DR 战备级可用性 + Sprint 2 buffer 容量
- 取代：[ADR-0005](../ADR/0005-mdm-only-auth.md) → Superseded

---

## 原 PRD 文件处置

- **不删除**：保留作为 v1.0 草案历史记录
- **不修复编码**：双重 UTF-8 编码修复工作量大，且 ADR-0006 已完整覆盖 C 方案
- **未来 Sprint**：如果需要回看 PRD 原文（dev 流 / TOTP 设计等），以 ADR-0006 + AUTH_HYBRID_C_CHECKLIST 为准

---

*维护人：Mavis*
*关联文档：[ADR-0006](../ADR/0006-auth-hybrid-c.md) · [AUTH_HYBRID_C_CHECKLIST.md](./AUTH_HYBRID_C_CHECKLIST.md) · [CHANGELOG.md](../../CHANGELOG.md) 2026-07-17-01*

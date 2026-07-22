# CIM-RMS + CIM-IMS 子系统深度 Review

> **评审日期**：2026-07-17
> **评审基线**：v1.1-baseline (Sprint 2 收口)
> **评审范围**：cimrms-api (需求工作流) + cimims-api (報案/工單) — 业务设计 / 数据模型 / 行业对齐
> **评审人**：Mavis（以半导体行业 CIM 资深专家视角）
> **承接文档**：[CIM-EXPERT-REVIEW-2026-07-17.md](./CIM-EXPERT-REVIEW-2026-07-17.md) — 整体 review
> **落地约束**：现阶段仅本机 Docker

---

## 〇、TL;DR — 给 Jerry 的 4 句话

1. **CIM-RMS(需求工作流)8/10 分** — 状态机设计、RBAC、SLA、通知四件套都齐了,**对内部 IT 需求场景是合格的**,但**对"产线驱动的需求"(如 MES 报警 → 设备改造)缺 Equipment/Lot 关联**,会成为"产线需求单"的瓶颈。
2. **CIM-IMS(報案/工單)7.5/10 分** — 业务流做对(待接单 → 处理中 → 转派 → 待确认 → 关闭),**值班轮换 + 工程师分类 + 升级机制**都按行业做法做了,但**知识沉淀 / RCA 闭环 / 复发跟踪**三大行业标配功能**完全缺失**——这是半导体 CIM 行业的"必备"。
3. **两个子系统之间的关联只做了"事件→需求"的单向上报**,CIM-RMS 文档里 §7.1 写的"事件→需求(根因改进)"在代码里只看到一个 `relatedIncidentId` 字符串字段,**没有自动重发、自动反向链接、复发统计**——1 年后你会发现"上次解决过的问题又来了 3 次"却查不到。
4. **最大风险不是技术债,是"知识"不会沉淀**。CIM-IMS 关单后,什么都没留下;CIM-RMS 关单后,同样什么都没留下。**Sprint 5 之前必须建知识库(KB)子系统或者先在 cimims-api 加 KB 字段**。

---

## 一、CIM-RMS 子系统分析(需求工作流)

### 1.1 总体评分

| 维度 | 评分 | 评语 |
|---|---|---|
| 状态机设计 | 9.0/10 | 11 状态覆盖完整,转换矩阵清晰 |
| 数据模型 | 8.0/10 | 9 张表合理,**缺 Equipment / Lot 关联** |
| 业务流程 | 8.5/10 | submit → approve → pool → schedule → dev → uat → deploy → accept 完整 |
| SLA / 升级 | 8.0/10 | 按紧急度配 SLA 小时,50% 警告 + 100% 突破**只设计没实现** |
| RBAC | 8.5/10 | 5 角色,8 守卫动作全 PASS |
| 通知链 | 7.0/10 | NotificationOutbox + Rule 实现,**实际触发没看到 cron** |
| WebSocket | 7.0/10 | broadcast/sendTo 实现,**无订阅过滤** |
| 行业对齐 | 6.5/10 | ECN / NCMR 概念弱,缺 Equipment 关联 |
| **综合** | **8.0/10** | **合格,但离半导体行业"产线驱动"还有差距** |

### 1.2 数据模型分析(对照 schema.prisma)

**做得对**:
- 9 张表(Request/RequestEvent/RequestAttachment/RequestEscalation/TodoItem/NotificationOutbox/NotificationRule/SlaConfig/AuditLog)结构合理
- 业务编号 `NC-YYYY-NNNN` 计数器用 `RequestNoSeq` 表 + Prisma upsert 原子自增 ✓
- RequestEvent 软关联 actor + role + fromStatus/toStatus + metadata,审计链完整
- AuditLog 用 JsonB payload,可扩展
- 软删除(`deletedAt`)全局一致

**需要补充的字段**:

| 缺什么 | 行业基线 | 建议 |
|---|---|---|
| `equipment_ids String[]` | 设备改造必须关联设备 | 加 `equipmentIds: String[]` 字段(Sprint 4) |
| `lot_id` / `wafer_count` | 半导体必须可追溯到 lot | 加 `affectedLots: JsonB`(Sprint 4) |
| `change_type`(ECN / NCMR / DEV / OPS) | 半导体行业 4 类变更 | 加 enum(Sprint 4) |
| `risk_level` | 跟 SEC 类似的变更必须评估风险 | 加 enum(low/med/high/SEC-critical)(Sprint 4) |
| `rollback_plan` | 任何 deploy 都要有回滚方案 | 加 `rollbackPlan: Text?`(Sprint 4) |
| `cab_approved_at` / `cab_approved_by` | 重大变更需 CAB 审批 | 加 2 字段(Sprint 4) |
| `priority_score`(自动算) | 行业用 RPN = S × O × D | 加 `priorityScore: Int?`(Sprint 5) |

**缺失的表**:
- ❌ **CabApproval 表**(变更评审委员会)— 半导体行业重大变更必须 CAB 批准
- ❌ **ChangeImpact 表**(变更影响范围)— 跟 MES / EAP 联动时必填
- ❌ **KpiSnapshot 表**(变更前后对比)— Fab 行业证明"变更有效"的硬证据
- ❌ **RequestLink 表**(需求间关联,如"被分解自"/"阻塞")— Sprint 5

### 1.3 业务流程分析(对照 requestService.ts)

**做得对**:
- 11 状态(11 状态不冗余)✓
- `computeAvailableActions` 按 status + role + submitter/assignee 计算可见操作 ✓
- 转换矩阵集中在 `TRANSITIONS` 对象,易维护 ✓
- 每个 transition 写 `requestEvent` + `audit_log` 双轨记录 ✓
- 通知 / WS / Teams Notify 三路并行推送(设计完整)

**需要补充**:
- ❌ **SLA 升级 cron 任务**:`computeSlaPercent` 函数有,但**没看到定时扫描器**(看 package.json / dist 都没有 cron 文件)。半导体行业要求"超 SLA 50% 自动升级"必须自动触发
- ❌ **撤回 / cancel 流程**:当前 11 状态没有 `cancelled` 状态,提交人想撤回只能 `manager_rejected → resubmit`,这是绕路
- ❌ **批量审批**:审计 100 个 P3 需求时,没有 `POST /v1/requests/batch-approve` 端点
- ❌ **报表导出**: Dashboard 只有数字,没有"按月统计 / 按团队统计"的导出
- ❌ **回滚(deploy 失败)**:没有"deploy 失败 → in_development"的状态回退

### 1.4 WS 推送分析(对照 websocket.ts)

**做得对**:
- JWT 鉴权升级 WS ✓
- broadcast / sendTo / sendToRole 三种粒度 ✓
- heartbeat 25s 清理死连接 ✓
- ping/pong 实现 ✓

**需要补充**:
- ❌ **没有订阅过滤**: 当前 broadcast 给所有连接,**Sprint 3 接入 100+ 设备时,一个用户会被数百条事件淹没**
  - 建议:加 `subscribe` 消息,客户端订阅 `equipment:E02`、`urgency:P1` 等 channel
  - 行业基线:WS 推送必须支持 channel 订阅,WS 1k 并发是基本盘
- ❌ **没有"在线用户列表"业务化**:`getOnlineUsers()` 有,但 UI 没用到 —— Sprint 3 末应该加"@在线工程师"
- ❌ **没有消息持久化 / 离线消息**:关浏览器就丢 —— 重要事件必须落库 + 重连拉取

### 1.5 角色 × 状态可见性

**行业对照表**(对照设计文档 §4.4 + 当前代码):

| 状态 | viewer(提交人) | editor | auditor | admin |
|---|---|---|---|---|
| submitted | 仅看自己 | ✓ | ✓ | ✓ |
| pending_manager | 仅看自己 | ✓ | ✓ | ✓ |
| manager_rejected | 仅看自己 | ✓ | ✓ | ✓ |
| pool | 仅看自己 | ✓ | ✓ | ✓ |
| scheduled | 仅看自己 | ✓ | ✓ | ✓ |
| in_development | 仅看自己 | ✓ | ✓ | ✓ |
| pending_uat | 仅看自己 | ✓ | ✓ | ✓ |
| pending_deploy | 仅看自己 | ✓ | ✓ | ✓ |
| deployed | 仅看自己 | ✓ | ✓ | ✓ |
| pending_acceptance | 仅看自己 | ✓ | ✓ | ✓ |
| closed | 仅看自己 | ✓ | ✓ | ✓ |

**当前实现是对的**,但**没有"按 team 隔离"**(一个 editor 团队 A 能看到团队 B 的需求)。Sprint 3 W3 资源级 RBAC 要补 `scope: 'team:A'`。

---

## 二、CIM-IMS 子系统分析(報案/工單)

### 2.1 总体评分

| 维度 | 评分 | 评语 |
|---|---|---|
| 状态机设计 | 8.5/10 | 5 主状态 + reopened,流程清晰 |
| 数据模型 | 7.5/10 | 8 张表合理,**缺 KB / RCA / recurrence** |
| 业务流程 | 8.0/10 | 4 类工程师 + duty 轮换 + 5 状态 + 升级 |
| SLA / 升级 | 7.5/10 | 按 (type, urgency) 二维配,**SLA cron 没看到实现** |
| RBAC | 8.0/10 | 7 守卫动作全过 |
| 值班轮换 | 8.5/10 | DutyRoster 表 + 班次字段完整 |
| 知识沉淀 | **2.0/10** ⚠️ | **完全缺失** |
| RCA / 复发跟踪 | **0/10** ⚠️⚠️ | **完全缺失** |
| 行业对齐 | 6.5/10 | 没看到 FMEA / 8D / 5-Why 流程 |
| **综合** | **7.5/10** | **核心功能齐,但知识沉淀是大坑** |

### 2.2 数据模型分析(对照 schema.prisma)

**做得对**:
- 8 张表(Incident/IncidentTimeline/IncidentEscalation/AuditLog/SlaConfig/EscalationRule/DutyRoster/EngineerMember)结构清晰
- `beforeSnapshot` / `afterSnapshot` JsonB —— 比 cimrms 的 audit 更强,能记录变更前后 ✓
- `DutyRoster` 含 `shift` / `shiftStart` / `shiftEnd` / `backupEmail` —— 值班轮换设计完整 ✓
- `EscalationRule` 模板化设计,可按 (triggerType, urgency, impact) 配升级规则 ✓
- `notifiedEmails String[]` 记录每次升级的抄送列表 ✓
- `slaResponseAt` + `slaCloseAt` 二级 SLA(响应 + 闭环)—— 行业标配 ✓
- `rejectCount` 字段支持 reopen loop 限制 ✓

**需要补充的字段**:

| 缺什么 | 行业基线 | 建议 |
|---|---|---|
| `root_cause` Text | 半导体行业 RCA 必填 | 加 `rootCause: Text?`(Sprint 4) |
| `resolution_category` enum | 便于统计 | 加 enum(hardware/software/config/process/external)(Sprint 4) |
| `recurrence_count` Int | 跟踪复发 | 加 + 自动 +1(Sprint 4) |
| `related_kb_id` UUID? | 知识库关联 | 加(Sprint 4) |
| `equipment_id` String? | 设备关联(可加可不加) | 加(Sprint 5) |
| `lot_id` String? | Lot 关联 | 加(Sprint 5) |
| `severity_after` enum | 复发升级 | 加 enum(Sprint 4) |
| `fmea_score` JsonB | FMEA 评分(RPN) | 加(Sprint 5) |
| `attachments String[]` | 已经是 String[] | OK |

**缺失的表(关键)**:

- ❌ **KnowledgeArticle 表** —— 半导体 CIM 行业的"知识库",关单时沉淀解决方案
  - 字段:`id, title, content, category, related_incident_ids[], created_by, created_at, last_used_at, use_count`
  - **这是 Sprint 4 必须加的表**
- ❌ **RecurrenceLink 表** —— 复发跟踪
  - 字段:`id, root_incident_id, related_incident_id, similarity_score`
- ❌ **RCAReport 表** —— 根因分析报告
  - 字段:`id, incident_id, five_why[], fishbone_category, prevention_actions, signed_off_by`
- ❌ **ShiftHandover 表** —— 班次交接记录
  - 设计文档 §5 写过,但代码里**没看到** —— 是个隐性缺口

### 2.3 业务流程分析(对照 incidents.ts + incidentService.ts)

**做得对**:
- 5 状态清晰(pending_takeover → processing → transferred → pending_confirm → closed)✓
- `take_over` 自动 / 手动都支持(handlerType=duty/engineer)✓
- `mark_resolved` 触发"待用户确认"流程,`requireUserConfirm: boolean` 可关掉确认 ✓
- `user_reject` 回到 processing,`rejectCount` 自动 +1 ✓
- `force_close` SLA 突破时强制关闭 ✓
- `reopen` 已关闭工单可重开 ✓
- `transfer_back` 支持 duty 接回转出的工单 ✓
- `link_request` 支持关联需求(用于根因改进)—— **但**:**只有字段,没有反向自动重发**

**需要补充**:

- ❌ **auto-assign 逻辑**:`take_over` 当前是手动接单(运维点按钮),没看到**自动派单给当前 duty 工程师**的逻辑。半导体行业 7x24 oncall 必须支持"工单来了自动推给值班人"
- ❌ **批量操作**:值班早上一看 30 个待接单,只能一个一个点
- ❌ **SLA 倒计时 UI 增强**:目前是 `minutesRemaining`,没看到"红色脉动""黄色警告"等视觉化(UI 那边可能做了,要核)
- ❌ **SLA 升级 cron 任务**:`EscalationRule` 配了,但**没看到定时扫描器**(同样问题)
- ❌ **shift handover 流程**:设计文档 §5 写了,但代码**没有**——目前 S2-8 的"班次交接"只接了"看当前 duty",没做"两班人对话 / 交接事项"
- ❌ **统计报表 / SLA compliance**:关闭率、平均处理时长、SLA 达成率——半导体行业管理层必看
- ❌ **recurring incident 检测**:同设备 + 同 type + 30 天内 3 次,自动标"复发"并升级

### 2.4 工程师轮换与排班(对照 DutyRoster / EngineerMember)

**做得对**:
- 4 类工程师(network / dba / system / security)分得清 ✓
- DutyRoster 支持多班次 + 备份人 + 有效日期 ✓
- EngineerMember 含 `currentLoad` + `isAvailable` —— 支持按负载派单 ✓
- `specializations String[]` 支持多技能 ✓

**需要补充**:
- ❌ **节假日 / 调休机制**:目前只配了班次,没看到"国庆假期用特殊排班表"
- ❌ **oncall rotation 自动化**:目前 duty 录入是手动的,没看到自动"周一到周五 9-18 工程师 A,18-9 工程师 B,周末工程师 C"的轮换生成器
- ❌ **oncall 通知链**:值班换了人,系统怎么通知?目前没看到自动 push
- ❌ **oncall 接班演练**:行业里季度要做"oncall 演练"测试响应时间,系统没支持

### 2.5 SLA 升级机制(对照 EscalationRule + Schema)

**做得对**:
- 二维 SLA(type × urgency)+ 响应 / 闭环 / 警告百分比 ✓
- EscalationRule 模板化 ✓
- IncidentEscalation 表记录每次升级 ✓
- `slaSnapshot JsonB` 记录升级时的 SLA 快照 ✓

**需要补充(关键)**:
- ❌ **SLA cron 扫描器**:`package.json` 里没看到 cron / scheduler 任务,`src/` 也没看到 `cron/` 目录。**这是设计有但实现没有的** —— 必须 Sprint 3 W2 补,否则 SLA 升级不触发
- ❌ **Fab 级自动 P1 提升**:`incidents.ts` CREATE 里实现了(`finalUrgency = 'P1' if impactScope === 'fab'`),但**没看到自动通知 IT Manager + IT 总监**的逻辑
- ❌ **升级链路可视化**:用户看不到"我的工单升级到谁了",只能问
- ❌ **SLA breach 自动报告**:每周 / 每月发一份 SLA 达成率报告给 IT Manager(目前没看到)

### 2.6 Audit 链(对照 AuditLog)

**做得对**:
- beforeSnapshot / afterSnapshot JsonB,变更前后可对比 ✓
- ipAddress / userAgent 记录(港府审计需要)✓

**需要补充**:
- ❌ **审计日志归档策略**:半导体行业要求"操作日志 7 年",没看到归档机制
- ❌ **审计日志查询 API**:设计文档 §8 写了,但当前只有 incident 内的 audit,没看到"全公司工单 audit 查询"端点(Sprint 4 W2 补)

---

## 三、跨子系统关联分析(最弱的一环)

### 3.1 现状

| 关联方向 | 设计文档 | 代码实现 | 差距 |
|---|---|---|---|
| **Incident → Request(根因改进)** | CIM-IMS §7.1 | cimims-api 有 `relatedRequestId` 字段;cimrms-api 有 `relatedIncidentId` 字段 | **手工填,没自动重发;无反向链接** |
| **Request → Incident(接收方)** | CIM-RMS §7.1 | cimrms-api 有 `relatedIncidentId` 字段 | **单向字符串关联,无事件流同步** |
| **状态同步** | CIM-IMS §7.3 | **没有** | **完全没实现** |

### 3.2 缺失的关键流程

#### 流程 A:Incident 关单时,如标记"需根因改进",自动建一个 Request

```
[CIM-IMS 工程师 mark_resolved]
   ↓
[resolution = "需要改进工艺 X", 触发"建需求"按钮]
   ↓
[自动 POST /cimrms-api/v1/requests]
   - title: "[改进] INC-2026-0287 工艺 X 调整"
   - type: "process"
   - urgency: 根据 incident 紧急度自动推
   - relatedIncidentId: INC-2026-0287
   - submitterEmail: incident.assignedEngineerEmail
   ↓
[CIM-RMS 创建需求,初始 status = submitted]
   ↓
[CIM-IMS 在 incident timeline 写"已转需求 NC-YYYY-NNNN"]
```

**当前实现**:用户在两个系统手动建两次,**很容易忘,而且没有反向链接**。

#### 流程 B:Request 创建时,如选择"由 incident 触发",自动反向链接

```
[CIM-RMS 用户创建需求]
   ↓
[选 relatedIncidentId (下拉框或搜)]
   ↓
[自动 POST /cimims-api/v1/incidents/:id/link]
   ↓
[CIM-IMS 写 timeline "已关联需求 NC-YYYY-NNNN"]
```

**当前实现**:字段有,但**前端没做反向同步,后端没建反向链接**。

#### 流程 C:复发跟踪

```
[CIM-IMS 工程师看 incident]
   ↓
[看到 "30 天内同 equipment + 同 type 有 3 次" 提示]
   ↓
[点"复发详情" → 看历史 incidents 列表]
   ↓
[如决定"开需求做根因改进",一键创建 RCAReport + Request]
```

**当前实现**:**完全没有**。复发跟踪在半导体行业是基础,8D Report / 5-Why 是行业方法论。

### 3.3 数据流缺失

```
        ┌──────────┐         ┌──────────┐
        │ 设备/产线 │         │  MES     │
        └─────┬────┘         └────┬─────┘
              │ (没接)            │ (没接)
              ▼                   ▼
        ┌──────────────────────────────┐
        │  期望:自动 alarm/incident    │  ← 缺失
        └──────────────────────────────┘
              │                   │
              ▼                   ▼
       ┌──────────┐         ┌──────────┐
       │ cimims   │ ──?──>  │ cimrms   │
       │ 工单     │ <──?──   │ 需求     │
       └──────────┘         └──────────┘
              ↑ 关联弱        ↑ 关联弱
              │                   │
              └────────┬──────────┘
                       ▼
                ┌──────────────┐
                │  知识库 (缺) │  ← 缺失
                └──────────────┘
```

---

## 四、跟 CIM 行业基线对比(查漏)

### 4.1 半导体 CIM 行业标准方法论

| 方法论 | 行业基线 | MRDI 当前 | 评分 |
|---|---|---|---|
| **8D Report**(8 Disciplines) | 八步骤 RCA,行业标配 | **没有** | 0/10 |
| **5-Why 分析** | 简单实用 | **没有** | 0/10 |
| **Fishbone(Ishikawa)图** | 6M 分类根因 | **没有** | 0/10 |
| **FMEA**(失效模式分析) | RPN = S × O × D | **没有** | 0/10 |
| **Pareto 分析** | 80/20 找主因 | **没有** | 0/10 |
| **CAPA**(纠正/预防措施) | 行业强制 | **没有** | 0/10 |
| **Runbook / Playbook** | 知识沉淀 | **没有** | 0/10 |
| **Shift Handover**(班次交接) | 7x24 必备 | 设计有,代码**没实现** | 3/10 |
| **Oncall Rotation** | 行业标配 | DutyRoster 有了,**自动轮换没** | 5/10 |
| **Recurring Incident** | 复发跟踪 | **没有** | 0/10 |
| **SLA 升级** | 50%/100% 自动升级 | 设计有,**cron 没实现** | 4/10 |

**结论**: **6/11 行业方法论完全缺失**,这是 2 年后回头看的最大痛点。

### 4.2 半导体 CIM 行业必备字段

| 字段 | 行业基线 | MRDI 现状 | 缺失度 |
|---|---|---|---|
| Equipment ID | 必填,跟 MES/EAP 关联 | ❌ 没有 | 🔴 严重 |
| Lot ID / Wafer Count | 必填,可追溯 | ❌ 没有 | 🔴 严重 |
| Recipe ID | 设备/工艺配比 | ❌ 没有 | 🟡 中等 |
| Tool Group | 设备分组 | ❌ 没有 | 🟡 中等 |
| Product / Family | 产品族 | ❌ 没有 | 🟡 中等 |
| Process Step | 工艺步骤 | ❌ 没有 | 🟡 中等 |
| Change Type(ECN/NCMR/...) | 行业 4 类变更 | ❌ 没有 | 🔴 严重 |
| Risk Level(SEC-critical) | 安全评估 | ❌ 没有 | 🟡 中等 |
| Rollback Plan | 必填 | ❌ 没有 | 🟡 中等 |
| CAB Approved | 变更审批 | ❌ 没有 | 🟡 中等 |
| Priority Score(RPN) | 自动算 | ❌ 没有 | 🟢 可选 |

### 4.3 SPC(统计过程控制)

当前 cimrms-api 实现了 `/v1/spc` 端点,**但**:
- 没看到自动数据采集机制(应该是从 MES 拉,不是手工录)
- 没看到 Control Chart(X-bar / R chart)绘制
- 没看到 Western Electric Rules / Nelson Rules(异常判定规则)
- 没看到 Out-of-Control-Action(异常时自动建 incident)

**这是 Sprint 5 集成接口层的核心工作**。

---

## 五、需要补充的内容(P0 / P1 / P2)

### 🔴 P0 — Sprint 3-4 必做(否则影响生产)

#### P0-1 · SLA 升级 cron 任务(两个 API 都要)

**为什么**:`computeSlaPercent` 和 `EscalationRule` 都有,但**没看到定时扫描器**——这是"有设计没实现"的最大风险,1 周后产线出问题没人升级。
**下一步**:
- 在 `cimrms-api` 和 `cimims-api` 加 `src/cron/slaScanner.ts`
- 每 60s 扫一次,查 `status_entered_at + sla_total_hours` 计算百分比
- 50% 写 warning,100% 写 escalation + 通知升级人
- Sprint 3 W2 启动,共 1 人日

#### P0-2 · KnowledgeArticle 表 + 工单关单时沉淀知识

**为什么**:关单后什么都没留下,1 年后同样问题又来。半导体行业"知识库"是基础设施。
**下一步**:
- cimims-api 加 `KnowledgeArticle` 表(9 字段)
- 工单 mark_resolved 时,如勾"沉淀为 KB",自动建 KB
- 工单 list / detail 页面加"搜历史类似"按钮 → 查 KB
- Sprint 3 W3,共 2 人日

#### P0-3 · 跨子系统自动重发(Incident → Request)

**为什么**:根因改进是半导体 CIM 行业"投诉 → 改进"的闭环,没做 = 同样的问题反复出现。
**下一步**:
- cimims-api 在 `mark_resolved` 时,接受 `triggerRequest: { type, urgency, title }` 参数
- 自动调 cimrms-api `POST /v1/requests` 建需求,带 `relatedIncidentId`
- 在 incident timeline 写"已转需求 NC-YYYY-NNNN"
- Sprint 3 W3,共 1.5 人日

#### P0-4 · Equipment / Lot 关联字段

**为什么**:半导体行业所有需求/工单必须能追溯到设备/批次,否则审计过不了。
**下一步**:
- cimrms-api Request 表加 `equipmentIds: String[]` + `affectedLots: JsonB`
- cimims-api Incident 表加 `equipmentId: String?` + `lotId: String?`
- 不接 EAP/MES,先空着,等 Sprint 5 集成接口层
- Sprint 4 W1,共 1 人日

### 🟡 P1 — Sprint 4-5 必做(影响业务深度)

#### P1-1 · RecurrenceLink 表 + 自动复发检测

**为什么**:同问题反复出现 = 没根因分析。8D Report / 5-Why 是行业方法论。
**下一步**:
- 加 `RecurrenceLink` 表,工单关单时跑"近 30 天同 equipment + 同 type"匹配
- 复发计数 ≥ 2 自动升级,标"recurring"
- Sprint 4 W2,共 1.5 人日

#### P1-2 · WS 订阅过滤(channel 模式)

**为什么**:当前 broadcast 给所有人,Sprint 5 设备接入后会刷屏。
**下一步**:
- WS 协议加 `subscribe: { channel: 'equipment:E02' }` 消息
- 服务端按订阅过滤推送
- Sprint 4 W3,共 1 人日

#### P1-3 · 值班轮换自动化 + oncall 通知链

**为什么**:半导体行业 7x24 oncall 是基础,手动排班扛不住。
**下一步**:
- 加 oncall 模板(周一至周日 × 三班)
- 自动生成下月排班表(每月 25 日跑)
- 值班换了人自动 Teams 推送
- Sprint 4 W3,共 2 人日

#### P1-4 · 报表 + 统计 endpoint

**为什么**:管理层必看 SLA 达成率 / 平均处理时长 / 复发率,目前 Dashboard 只有数字。
**下一步**:
- cimims-api 加 `GET /v1/incidents/stats` — 按周/月/季度统计
- cimrms-api 加 `GET /v1/requests/stats` — 同上
- Sprint 4 W3,共 1 人日

#### P1-5 · CAB 审批表(变更评审委员会)

**为什么**:半导体行业重大变更(影响生产)必须 CAB 批准,跟 IT 变更流程独立。
**下一步**:
- cimrms-api 加 `CabApproval` 表
- Request 加 `cabRequired: Boolean`(自动判定,影响 ≥ 2 部门 = 必 CAB)
- CAB 审批通过才能进 `scheduled` 状态
- Sprint 4 W4,共 2 人日

### 🟢 P2 — V2 评估

#### P2-1 · 8D Report 完整流程

8 个步骤全建表单,生成 PDF 报告归档。半导体行业供应商准入必备。

#### P2-2 · FMEA 评分自动化

新增需求时自动算 RPN = Severity × Occurrence × Detection。

#### P2-3 · SPC 自动采集 + Control Chart

接 MES/EAP 自动拉数据,实时画 X-bar / R chart,异常自动建 incident。

---

## 六、Jerry 你必须做的决策(开放项)

### Q1 · 知识库(KB)建在哪个系统?

- A. cimims-api(关联 incident) — **我推荐**
- B. cimrms-api(关联 request)
- C. mdm-api(作为主数据一部分)
- D. 独立系统 KB-api

**我的判断**:**A**。原因:80% KB 来自工单解决经验,cimims 关单沉淀最自然。cimrms 需求端复用 KB 即可,不必单建。V2 复用率高了再独立。

### Q2 · Sprint 3 补"跨子系统自动重发"还是 Sprint 4?

- A. Sprint 3 W3 — **我推荐**
- B. Sprint 4
- C. 不做,推 V2

**我的判断**:**A**。根因改进闭环是"投诉→改"的最后一公里,不做 = 同样问题反复出现 = 用户对系统失去信任。1.5 人日,Sprint 3 能消化。

### Q3 · Equipment / Lot 关联字段,本周加还是 Sprint 4?

- A. **Sprint 4 W1(我推荐)**
- B. Sprint 5 集成接口层一起做

**我的判断**:**A**。字段先加,不接 EAP/MES,等 Sprint 5 集成。理由:审计/追溯用字段,集成是数据源,两件事分开做。

### Q4 · 值班轮换自动化,优先级?

- A. Sprint 4 W3 — **我推荐**
- B. 排到 Sprint 5 之后
- C. 继续手动,等出问题再说

**我的判断**:**A**。手动排班 1 个月就会乱,Sprint 4 W3 必做。

### Q5 · 8D Report / FMEA 行业方法论,要不要在 Sprint 5+ 做?

- A. **做(独立项目)— 我推荐**
- B. 推 V2 永远不做
- C. 简化做,只做 5-Why

**我的判断**:**A**。但**不强求一次到位**,可以先 5-Why(Sprint 5),8D Report + FMEA(Sprint 6+)。半导体行业供应商准入会查,1-2 年内必面对。

### Q6 · `cimrms-api/README.md` 和 `cimims-api/README.md` 是 mdm-api 的内容(文档 bug),现在改还是 Sprint 末?

- A. **本周改(我推荐)**
- B. Sprint 末

**我的判断**:**A**。5 分钟事,别拖。

---

## 七、变更单建议

```
[变更单 2026-07-17-03] CIM-RMS + CIM-IMS 子系统补充内容
  原计划: Sprint 3-4 任务表
  调整:   新增 4 项 P0 + 5 项 P1
    P0-1 SLA 升级 cron(2 API 各 0.5d,Sprint 3 W2)
    P0-2 KnowledgeArticle 表(cimims-api,Sprint 3 W3,2d)
    P0-3 跨子系统自动重发(cimims-api,Sprint 3 W3,1.5d)
    P0-4 Equipment/Lot 关联(2 API 各 0.5d,Sprint 4 W1,1d)
    P1-1 RecurrenceLink(cimims-api,Sprint 4 W2,1.5d)
    P1-2 WS 订阅过滤(2 API,Sprint 4 W3,1d)
    P1-3 值班自动化(cimims-api,Sprint 4 W3,2d)
    P1-4 报表 endpoint(2 API,Sprint 4 W3,1d)
    P1-5 CAB 审批(cimrms-api,Sprint 4 W4,2d)
  原因:   CIM 资深专家 review 发现 4 项设计有但实现没有 + 5 项行业标配缺失
  影响:   Sprint 3 + Sprint 4 各 +3.5 人日
          Sprint 3 buffer 27% → 17%
          Sprint 4 buffer 63% → 49%(仍然充裕)
  决策:   待 Jerry 拍板(本文 §六)
```

---

## 八、与配套文档的关系

- [`CIM-EXPERT-REVIEW-2026-07-17.md`](./CIM-EXPERT-REVIEW-2026-07-17.md) — 整体 review(本文是其子系统专项)
- [`MASTER_PLAN.md`](./MASTER_PLAN.md) — Sprint 2-4 任务表(待 §七 变更单落地)
- [`docs/archive/cim-rms-v1.0/CIM-RMS-V1.0-系统逻辑说明.md`](./archive/cim-rms-v1.0/CIM-RMS-V1.0-系统逻辑说明.md) — CIM-RMS 设计基线
- [`docs/archive/cim-ims-v1.0/CIM-IMS-V1.0-系统逻辑说明.md`](./archive/cim-ims-v1.0/CIM-IMS-V1.0-系统逻辑说明.md) — CIM-IMS 设计基线
- [`docs/archive/cim-ims-v1.0/CIM-IMS-V1.0-状态机实现.md`](./archive/cim-ims-v1.0/CIM-IMS-V1.0-状态机实现.md) — CIM-IMS 状态机详设

---

## 九、最终打分

| 子系统 | 现状 | 行业基线 | 差距 | 主要短板 |
|---|---|---|---|---|
| **CIM-RMS** | 8.0 | 8.5 | 0.5 | Equipment 关联 / CAB 审批 / Rollback |
| **CIM-IMS** | 7.5 | 9.0 | **1.5** | KB / RCA / 复发 / Shift Handover |
| **跨子系统关联** | 4.0 | 8.0 | **4.0** | 双向同步 / 自动重发 / 复发统计 |
| **行业方法论对齐** | 2.0 | 7.0 | **5.0** | 8D / 5-Why / FMEA / CAPA 全缺 |
| **综合** | **6.0** | **8.0** | **2.0** | 知识沉淀 + 行业方法论是最大短板 |

**总评**:**CIM-RMS 接近合格,CIM-IMS 差半档,跨子系统关联 + 行业方法论是大坑**。Sprint 3-4 补完 P0+P1(约 17 人日),能到 7.5/10;V2 补完 P2(8D / FMEA / SPC)能到 8.5/10。

---

*维护人*:Mavis(评审)
*评审周期*:每个 sprint 末
*下次 review*:Sprint 3 末(2026-08-08)

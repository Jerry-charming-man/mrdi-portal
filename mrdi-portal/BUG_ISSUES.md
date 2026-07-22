# MRDI Portal · 开发任务单

> 状态：待处理 · 来源：测试比对（prd.md vs 代码） · 生成：2026-07-14

---

## 一、🔴 P0 — Sprint 1 必须修（阻塞验收）

---

### ISSUE-001 · Dashboard 布局不符合 PRD — 告警 Top 5 未放入三栏

**严重度**：🔴 High
**类型**：布局 / 样式偏差
**状态**：✅ **已修（2026-07-16）** · col-span 5-5-2 对齐 PRD §3.1
**PRD 依据**：PRD §3.1 "中部三栏：左栏·产线矩阵 / 中栏·Lot甘特图 / 右栏·实时告警 Top 5"

**改动**：`Dashboard.tsx` 三栏 col-span 从 5-4-3 调整为 5-5-2（三栏并排，告警在右侧）

**涉及文件**：`src/pages/Dashboard.tsx`

---

### ISSUE-002 · Header 告警 Badge 数量写死为 3

**严重度**：🔴 High
**类型**：功能缺陷 / 数据绑定
**状态**：✅ **已修（2026-07-16）** · store 接真实 API + 5min polling
**PRD 依据**：PRD §3.4 "右上铃铛图标在有新告警时脉动一次（红点 + 数字 badge）"

**改动**：
- `store/index.ts`：mock 数据替换为 `GET /incidents` 真实 API + 5 分钟轮询
- `Header.tsx`：接入 `startAlarmPolling()` / `stopAlarmPolling()` 生命周期
- `activeCount = alarms.filter(a => a.status !== 'closed')` 动态计算

**涉及文件**：`src/components/Header.tsx`、`src/store/index.ts`

---

## 二、🟡 P1 — Sprint 1 建议修（影响体验）

---

### ISSUE-003 · SPC 导出 CSV 按钮无点击处理

**严重度**：🟡 Medium
**PRD 依据**：PRD §3.3 "工具栏：导出 CSV……"

**现状**：`SpcTrend.tsx` 中"导出 CSV"按钮无 `onClick` handler，数据也无法导出。

**预期**：点击后将 `spcData` 转换为 CSV 并触发下载。

**涉及文件**：`src/pages/SpcTrend.tsx`

---

### ISSUE-004 · SPC 规则违反只实现了 Rule 1

**严重度**：🟡 Medium
**PRD 依据**：PRD §3.3 "规则违反清单（Western Electric Rules 1–8）"

**现状**：
```tsx
// SpcTrend.tsx - generateData
ooc: val > 108 || val < 92  // 只判断了 Rule 1
```

**预期**：至少标注违反的规则编号（Rule 1–8），可参考：
- Rule 1：单点超出 UCL/LCL
- Rule 2：连续 9 点在中心线同一侧
- Rule 3：连续 6 点递增或递减
- Rule 4：连续 14 点交替上下
- Rule 5：连续 3 点中有 2 点在同一侧 UCL±2σ 区间外
- Rule 6：连续 5 点中有 4 点在同一侧 UCL±1σ 区间外
- Rule 7：连续 15 点全部落在 UCL±1σ 区间内（中心化）
- Rule 8：连续 8 点全部不在 UCL±1σ 区间内

**涉及文件**：`src/pages/SpcTrend.tsx`

---

### ISSUE-005 · 告警"确认"按钮点击后无状态联动

**严重度**：🟡 Medium
**PRD 依据**：PRD §3.4 "表格：……操作 — 确认/关闭"

**现状**：`Alarms.tsx` 中"确认"按钮存在但无 `onClick`，点击后告警状态不变。

**预期**：点击后告警状态由 `active` → `acknowledged`，按钮消失。

**涉及文件**：`src/pages/Alarms.tsx`

---

### ISSUE-006 · 告警"关闭"按钮点击后无状态联动

**严重度**：🟡 Medium
**PRD 依据**：PRD §3.4 告警表格操作列

**现状**：`Alarms.tsx` 中"关闭"按钮无 `onClick`，点击无反应。

**预期**：点击后告警状态由 `active`/`acknowledged` → `closed`，行灰显。

**涉及文件**：`src/pages/Alarms.tsx`

---

### ISSUE-007 · 班次交接"确认"后无通知逻辑

**严重度**：🟡 Medium
**PRD 依据**：PRD Flow 3 "点击'确认交接' → 系统自动通知接班人"

**现状**：
```tsx
// Handover.tsx - handleConfirm
setConfirmLoading(true)
setTimeout(() => { setSubmitted(true) }, 1500)
// 纯 UI 延时，无任何通知 API 调用
```

**预期**：确认成功后调用通知 API（飞书/邮件/内部消息），具体方式待产品确认。

**涉及文件**：`src/pages/Handover.tsx`

---

### ISSUE-008 · Dashboard 底部缺"最近 7 天 Yield sparkline"

**严重度**：🟡 Medium
**PRD 依据**：PRD §3.1 "底部信息带：……最近 7 天 Yield 趋势小图（sparkline）"

**现状**：Dashboard 底部只有时间戳和在线状态。

**预期**：增加一个小尺寸折线图展示最近 7 天 Yield 趋势。

**涉及文件**：`src/pages/Dashboard.tsx`

---

## 三、⚪ P2 — Sprint 2/3 范围（可规划）

---

### ISSUE-009 · KPI Strip 无 5s 自动刷新轮询
- PRD：Sprint 2
- 当前：静态渲染，无 `setInterval`

### ISSUE-010 · SPC 无 WebSocket 实时数据
- PRD：Sprint 3 "SPC 实时（WebSocket）"
- 当前：纯 Mock 静态数据

### ISSUE-011 · 告警无 1s 内实时推送
- PRD：Sprint 2 "告警 1s 内推送"
- 当前：无任何推送机制

### ISSUE-012 · 无权限控制 / RBAC
- PRD：Sprint 3
- 当前：无角色概念，"跨厂对比"功能也不存在

### ISSUE-013 · 无多语言 i18n
- PRD：Sprint 3
- 当前：全部硬编码中文

---

## 四、✅ 无问题项（已验收通过）

| 模块 | 状态 |
|------|------|
| 项目构建（npm run build） | ✅ 通过 |
| 技术栈（React19 + Vite + Tailwind） | ✅ 符合 |
| 品牌色系（MRDI 规范） | ✅ 全部自定义颜色正确注册 |
| 字体（Outfit + Noto Sans CJK） | ✅ |
| Sidebar（7个导航项 + Logo + 用户区） | ✅ |
| Header（面包屑 + 搜索 + 交接快捷） | ✅ |
| Dashboard KPI Strip（4项 + 涨跌 + 强调色） | ✅ |
| 产线矩阵（5 Area + 4色 + Tooltip） | ✅ |
| Lot 甘特图（工序色块 + 当前时间线） | ✅ |
| 子系统卡片（3张 + 统计数据 + 外部跳转） | ✅ |
| SPC 控制图（UCL/CL/LCL + Recharts + Tooltip） | ✅ |
| 告警 Tab 切换 + Badge + 搜索过滤 | ✅ |
| 告警表格（7字段 + 操作按钮 UI） | ✅ |
| 班次交接（本班小结 + 待办 + 新增 + 确认流程 UI） | ✅ |
| 路由（7个页面 + 404 重定向） | ✅ |

---

## 五、处理优先级建议

| 批次 | Issue | 建议 | 预计工时 |
|------|-------|------|---------|
| **本次修复** | 001、002 | 布局调整 + 动态告警数量 | ~1h |
| Sprint 1 补齐 | 003~008 | SPC导出 + 规则 + 告警联动 + 交接通知 + Yield趋势 | ~3h |
| Sprint 2 | 009~011 | 实时推送 | 待定 |
| Sprint 3 | 012~013 | 权限 + i18n | 待定 |

---

*任务单版本：v1.0 · 配套测试用例：TEST_CASES.md · 落差报告：GAP_ANALYSIS.md*

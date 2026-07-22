# MRDI Portal · 设计落差分析报告

> 比对范围：`prd.md` (v1.0 Demo) + `mdm-frontend-design.md` vs 当前代码
> 生成时间：2026-07-14

---

## 一、概览

| 分类 | 数量 | 说明 |
|------|------|------|
| 🔴 布局差异（Sprint 1 范围） | 2 项 | Dashboard 三栏布局、告警位置 |
| 🟡 功能缺失（Sprint 1 范围） | 5 项 | Yield趋势、交接通知等 |
| ⚪ 性能/实时缺失（Sprint 2/3 范围） | 5 项 | WebSocket 推送、权限等 |
| ✅ 已符合设计 | 约 20 项 | KPI、Heatmap、甘特图基本正确 |

---

## 二、🔴 布局差异（Sprint 1 范围）

### GAP-001 · Dashboard 三栏布局不对

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| 中部三栏 | **并排三栏**：产线矩阵(col-5) + Lot甘特图(col-7) + **告警Top5作为右栏** | 产线矩阵+甘特图一行(col-5+col-7)，**告警Top5单独一行** | 🔴 高 |

**PRD 原话**：
> 中部三栏：左栏 · 产线状态矩阵 / 中栏 · 今日 Lot 进度甘特图 / 右栏 · 实时告警 Top 5

**代码实际情况**（`Dashboard.tsx`）：
```tsx
// 第一行：产线矩阵 + 甘特图
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-5"><EquipmentHeatmap /></div>
  <div className="col-span-7"><LotGantt /></div>
</div>
// 告警 Top 5 独立成行
<AlarmTop5 />   // ← 不在三栏内
```

**应该改成**：三栏并排，告警 Top 5 缩小放到右栏。

---

### GAP-002 · 告警数量 Badge 固定为 3，非动态

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| Header 告警数字 | 实时推送有新告警时脉动一次 + 显示数字 | `const [alarmCount] = useState(3)` 写死 | 🔴 高 |

**PRD 原话**：
> 右上铃铛图标在有新告警时**脉动一次**（红点 + 数字 badge）

**代码**（`Header.tsx:27`）：
```tsx
const [alarmCount] = useState(3) // 写死，永远是3
```
应改为从告警数据中动态计算。

---

## 三、🟡 功能缺失（Sprint 1 范围）

### GAP-003 · Dashboard 缺少"最近 7 天 Yield 趋势图"

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| 底部信息带 | 本班次生产日报快捷入口 + **最近 7 天 Yield 趋势小图（sparkline）** + 跨厂对比 | 只有时间戳+在线状态，**无 Yield sparkline** | 🟡 中 |

**PRD 原话**：
> 底部信息带：……最近 7 天 Yield 趋势小图（sparkline）

---

### GAP-004 · SPC 趋势页面导出 CSV 未实现

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| SPC 导出 | 点击"导出 CSV"触发文件下载 | 按钮存在但**无点击处理逻辑** | 🟡 中 |

**代码**（`SpcTrend.tsx`）：
```tsx
<button className="flex items-center gap-1.5 text-sm text-ink-3 border border-progress
  rounded-lg px-3 py-1.5 hover:bg-module transition-colors">
  <Download size={14} /> 导出 CSV
</button>
// onClick 完全缺失
```

---

### GAP-005 · SPC 趋势规则违反只有 Rule 1

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| Western Electric Rules | **8 条规则**全部违反时有清单 | 只判断 `val > 108 || val < 92`（Rule 1 单点超出），其他 7 条规则**未实现** | 🟡 中 |

**PRD 原话**：
> 工具栏：导出 CSV、规则违反清单（Western Electric Rules 1–8）

**代码**（`SpcTrend.tsx:generateData`）：
```tsx
ooc: val > 108 || val < 92,  // 只有 Rule 1
```
缺少 Rules 2–8（连续 9 点在中心线同一侧、连续 6 点递增/递减等）。

---

### GAP-006 · 告警"确认"按钮点击后状态不变

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| 告警确认操作 | 点击"确认"→状态变为"已确认"→按钮消失 | 点击后**无任何状态变更**（UI 未联动） | 🟡 中 |

**代码**（`Alarms.tsx`）：
```tsx
<button className="text-xs px-3 py-1.5 border border-progress rounded-lg text-ink-3
  hover:border-ignite hover:text-ignite transition-colors">
  确认
</button>
// onClick 完全缺失
```

---

### GAP-007 · 班次交接通知功能未实现

| 项 | PRD 设计 | 当前代码 | 严重度 |
|----|---------|---------|--------|
| 交接通知 | 点击"确认交接" → **系统自动通知接班人** | 只有 UI 成功页，**无任何通知逻辑**（飞书/邮件/内部消息） | 🟡 中 |

**PRD Flow 3**：
> 点击"确认交接" → 系统自动通知接班人

**代码**（`Handover.tsx:handleConfirm`）：
```tsx
const handleConfirm = () => {
  setConfirmLoading(true)
  setTimeout(() => {   // ← 只有纯 UI 延时，无通知 API
    setConfirmLoading(false)
    setSubmitted(true)
  }, 1500)
}
```

---

## 四、⚪ Sprint 2/3 范围（非本次验收阻塞项）

### GAP-008 · KPI Strip 无自动刷新（PRD 要求 5s 轮询）
- PRD：`KPI Strip 5s 轮询`
- 当前：完全静态，无轮询逻辑
- 建议 Sprint 2 补 `setInterval`

### GAP-009 · SPC 数据无 WebSocket 实时推送（PRD Sprint 3）
- PRD：`SPC 实时（WebSocket）`
- 当前：纯静态 Mock 数据
- 建议 Sprint 3 补 WebSocket

### GAP-010 · 告警无 1s 内推送（PRD Sprint 2）
- PRD：`告警 1s 内推送`
- 当前：无任何推送机制
- 建议 Sprint 2 补 WebSocket / Server-Sent Events

### GAP-011 · 无权限控制 / RBAC（PRD Sprint 3）
- PRD：`按角色 RBAC，Manager 才能看到"跨厂对比"`
- 当前：无角色概念，无条件显示所有菜单
- "跨厂对比"功能也不存在（GAP-012）

### GAP-012 · "跨厂对比"功能缺失
- PRD（Manager 专属）：`跨厂对比（仅 Manager 角色可见）`
- 当前：代码和 UI 均无此模块

### GAP-013 · 无多语言 i18n（PRD Sprint 3）
- PRD：`中文（简体）主，英文预留`
- 当前：全部硬编码中文，无 i18n 框架

---

## 五、✅ 符合设计的部分

| 模块 | 符合项 |
|------|--------|
| 整体架构 | React 19 + Vite + Tailwind + React Router ✓ |
| 品牌色系 | `ignite/ink/pure/module/progress` + 辅助色全部配置正确 ✓ |
| 字体 | Outfit + Noto Sans CJK SC ✓ |
| Sidebar | 7 个导航项全部实现，Logo + 用户区 ✓ |
| Header | 面包屑 + 搜索 + 交接快捷 + 告警铃铛 ✓ |
| Dashboard KPI | 4 项全部显示，涨跌幅 / 强调色正确 ✓ |
| 产线矩阵 | 5 个 Area，4 色状态，热区 Tooltip ✓ |
| Lot 甘特图 | 5 条 Lot，工序色块，当前时间线 ✓ |
| 子系统卡片 | 3 张卡片，统计数据，在线人数，外部跳转 ✓ |
| CIM-RMS 入口 | 统计卡片 + 最近活动列表 + 状态标签 ✓ |
| CIM-IMS 入口 | 统计卡片 + 最近事件列表 + 等级指示 ✓ |
| MDM 入口 | 注意事项横幅 + 统计卡片 + 功能卡片 ✓ |
| SPC 控制图 | UCL/CL/LCL 参考线 + Recharts + Tooltip ✓ |
| 告警 Tab | 4 个 Tab + Badge 数量 + 搜索过滤 ✓ |
| 告警表格 | 7 字段 + 操作按钮 ✓ |
| 班次交接 | 本班小结 + 待办列表 + 新增 + 确认流程 ✓ |

---

## 六、优先级建议

| 优先级 | Gap | 建议处理 |
|--------|-----|---------|
| **P0** | GAP-001（Dashboard布局）、GAP-002（告警Badge写死） | 本次 Sprint 修复 |
| **P1** | GAP-003~007（共5项） | 本次 Sprint 视情况修复 |
| **P2** | GAP-008~010（实时推送） | Sprint 2 |
| **P3** | GAP-011~013（权限/i18n） | Sprint 3 |

---

*报告版本：v1.0 · 对比依据：prd.md + mdm-frontend-design.md + prototype/index.html*

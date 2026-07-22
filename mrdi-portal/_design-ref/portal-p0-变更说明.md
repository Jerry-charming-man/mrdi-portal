# MRDI Portal 主页 · P0 改版交接说明

| 项 | 值 |
|---|---|
| 文件 | `C:\Users\JerrySun\.mavis\sessions\mvs_0cf87753f6d44cbdad4f0a3986676606\workspace\prototype\index.html` |
| Review 标注 | 同目录 `portal-preview.html`（浏览器打开看 P0 标注） |
| 改动类型 | 视觉重构 · 无 API 变更 |
| 涉及文件 | 1 个（`index.html` 单文件） |
| 改动量 | +200 行 / -180 行（净 +20） |
| 风险等级 | 🟢 低（纯展示层，不改数据源） |
| 验收者 | 设计师 / PM / 班长代表 |

---

## TL;DR — 改了什么

| # | 位置 | 原 | 改 | 解决 |
|---|---|---|---|---|
| **P0-1** | BOTTOM 8+4 网格 | 「业务子系统入口」4 卡片 + 「待办/公告」侧栏 | 12 列「**今日目标达成**」hero + 12 列「待办(8) + 系统消息(4)」 | 路由重复 + 给主页"差多少能交差"的灵魂 |
| **P0-2** | 顶部右侧按钮 | 「新建工单」单按钮 | 「**快速操作 ⚡**」下拉（4 actions） | 站位对齐 + 班长常用操作一站 |
| **P0-3** | header + sidebar | header 主题按钮 / sidebar user 单行 | header 主题按钮**删除** → sidebar user 菜单 dropdown（4 项） | header 降噪 + user 菜单丰满 |

---

## P0-1 · 子系统入口 → 今日目标达成

### 改动详情

**原结构**（`BOTTOM` 区，行 ~632-826）：
```html
<div class="grid grid-cols-12 gap-5">
  <div class="col-span-8">  <!-- 业务子系统入口 (4 cards) -->
    <a href="pages/cimrms.html">...</a>
    <a href="pages/cimims.html">...</a>
    <a href="pages/perm.html">...</a>
    <a href="pages/mdm.html">...</a>
    <div>...7 日 Yield sparkline...</div>
  </div>
  <div class="col-span-4 space-y-5">  <!-- 待办 + 公告 -->
    <div>...3 个 todo items...</div>
    <div>...2 条公告...</div>
  </div>
</div>
```

**新结构**：
```html
<!-- Row 1: 今日目标达成 + 7 日趋势 (col-span-12, mb-5) -->
<div class="bg-pure rounded-2xl ... p-5 mb-5">
  <h3>今日目标达成</h3>
  <p>截至 10:42 · 距下班交接还剩 5h 18m</p>
  <!-- 4 个 goal bar: OEE / 在制 Lot / Yield / 稼动率 -->
  <div class="grid grid-cols-4 gap-4">
    <!-- 每条: chip(已达/接近/未达) + 数值/目标 + 进度条 + 达成率% -->
  </div>
  <!-- 7 日 Yield sparkline (原样下移) -->
</div>

<!-- Row 2: 待办 (col-span-8) + 系统消息 (col-span-4) -->
<div class="grid grid-cols-12 gap-5">
  <div class="col-span-8">
    <h3>我的待办</h3>
    <div class="grid grid-cols-3 gap-3">
      <!-- 3 个 todo cards: 来源 chip (CIM-RMS/告警/系统) + 时间 + hover ignite-soft -->
    </div>
  </div>
  <div class="col-span-4">
    <h3>系统消息</h3>  <!-- 原"公告/系统"改名为"系统消息" -->
  </div>
</div>
```

### 验收标准
- [ ] 4 个 goal bar 颜色对应：绿(#15803D) 已达 / 黄(#B45309) 接近 / 红(#B91C1C) 未达
- [ ] 达成率 = 当前值 / 目标值（百分比）
- [ ] 进度条颜色 = chip 颜色（成功用 ignite、警告用 warn、失败用 danger）
- [ ] 「待办」从单列 3 项 → 3 列 3 卡，每张含来源 chip + 时间戳
- [ ] 「公告」改名为「系统消息」
- [ ] 整段无 console error

### 数据来源（无变化）
4 个 KPI 数值原封不动用现成 4 个 KPI 卡片的数据源，**不调新 API**。

---

## P0-2 · 新建工单 → 快速操作下拉

### 改动详情

**原**：
```html
<button class="px-4 py-2 ... bg-ignite text-pure ...">
  <svg>...</svg>
  新建工单
</button>
```

**新**：
```html
<div class="relative" id="quick-actions-wrap">
  <button onclick="toggleQuickActions()" class="px-4 py-2 ... bg-ignite ...">
    <svg>⚡</svg>
    快速操作
    <svg>▼</svg>
  </button>
  <div id="quick-actions-menu" class="hidden absolute right-0 top-full mt-2 w-60 ...">
    <button onclick="quickAction('lot-pause')">...Lot 暂停 (P)</button>
    <button onclick="quickAction('equipment-roll')">...设备点名 (E)</button>
    <button onclick="quickAction('report-repair')">...一键报修 (R)</button>
    <div class="my-1 border-t"></div>
    <button onclick="quickAction('notify-leader')">...通知值班长 (N)</button>
  </div>
</div>
```

### JS 函数（新增）

```js
function toggleQuickActions() {
  const menu = document.getElementById('quick-actions-menu');
  menu.classList.toggle('hidden');
  // 关闭 user menu
  const um = document.getElementById('user-menu');
  if (um && !um.classList.contains('hidden')) um.classList.add('hidden');
}

function quickAction(name) {
  const map = {
    'lot-pause':      { msg: 'Lot 暂停面板在 Sprint 2 上线', type: 'info' },
    'equipment-roll': { msg: '设备点名面板在 Sprint 2 上线', type: 'info' },
    'report-repair':  { msg: '已发起报修工单 #WO-2026-0418', type: 'success' },
    'notify-leader':  { msg: '已通知值班长 (张志豪) · 飞书推送', type: 'success' },
  };
  const it = map[name] || { msg: '未知操作', type: 'info' };
  showToast(it.msg, it.type);
  toggleQuickActions();
}
```

### 交互规则
- ✅ 点按钮 → 展开下拉
- ✅ 再点按钮 → 收起
- ✅ 点外部 / 按 Esc → 收起
- ✅ 打开时如 user 菜单在展开 → 自动关闭 user 菜单
- ✅ 每个 action 右侧灰色字 monospace 快捷键（**仅展示，不绑键盘**）

### 验收标准
- [ ] 4 个 action 都能点出对应 toast
- [ ] 打开后点页面空白处能关
- [ ] Esc 能关
- [ ] 在 4 个 action 中点击会触发 `quickAction()` 并收起菜单

### 未来 Sprint 2 接入
4 个 action 当前都是 stub，Sprint 2 接 Sprint 2 的 Lot 暂停面板 / 设备点名面板 / 报修表单（可能直接跳 CIM-IMS）/ 飞书 webhook。

---

## P0-3 · 主题按钮 → user 菜单

### 改动详情

**Step 1**：从 header 删除整个太阳按钮

```diff
- <button class="w-9 h-9 ..." title="切换主题" onclick="toggleTheme()">
-   <svg id="icon-sun">...</svg>
- </button>
```

**Step 2**：扩展 sidebar 底部 user 区域为 dropdown

**原**：
```html
<div class="border-t border-white/10 px-3 py-3">
  <div class="flex items-center gap-2.5 px-2 py-2 ...">
    <div>张</div>
    <div>张志豪 / Shift Leader</div>
    <svg>▼</svg>
  </div>
</div>
```

**新**：
```html
<div class="border-t border-white/10 px-3 py-3 relative" id="user-menu-wrap">
  <div onclick="toggleUserMenu()" class="flex items-center gap-2.5 px-2 py-2 ...">
    <div>张</div>
    <div>张志豪 / Shift Leader</div>
    <svg>▼</svg>
  </div>
  <!-- 新增 dropdown -->
  <div id="user-menu" class="hidden absolute left-3 right-3 bottom-full mb-2 bg-pure rounded-xl ... py-1.5 z-40">
    <div class="px-4 py-2.5 border-b border-progress">
      <div class="text-[13px] font-medium text-ink">张志豪</div>
      <div class="text-[11px] text-ink-3 mt-0.5">zhang.zh@mrdi.example</div>
    </div>
    <button onclick="toggleTheme();toggleUserMenu()">☀️ 切换主题 (T)</button>
    <button onclick="showToast('个人设置在 Sprint 2 上线','info');toggleUserMenu()">👤 个人设置</button>
    <button onclick="showToast('快捷键面板在 Sprint 2 上线','info');toggleUserMenu()">⚡ 快捷键 (?)</button>
    <div class="my-1 border-t border-progress"></div>
    <button onclick="showToast('已退出登录','success');toggleUserMenu()">⏏ 退出登录</button>
  </div>
</div>
```

### JS 函数（新增）

```js
function toggleUserMenu() {
  const menu = document.getElementById('user-menu');
  menu.classList.toggle('hidden');
  // 关闭 quick actions
  const qa = document.getElementById('quick-actions-menu');
  if (qa && !qa.classList.contains('hidden')) qa.classList.add('hidden');
}

// 通用 click-outside 关闭 (P0-2/P0-3 共用)
document.addEventListener('click', (e) => {
  const qaWrap = document.getElementById('quick-actions-wrap');
  const umWrap = document.getElementById('user-menu-wrap');
  if (qaWrap && !qaWrap.contains(e.target)) {
    const qa = document.getElementById('quick-actions-menu');
    if (qa && !qa.classList.contains('hidden')) qa.classList.add('hidden');
  }
  if (umWrap && !umWrap.contains(e.target)) {
    const um = document.getElementById('user-menu');
    if (um && !um.classList.contains('hidden')) um.classList.add('hidden');
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('#quick-actions-menu, #user-menu').forEach(m => m.classList.add('hidden'));
  }
});
```

### `toggleTheme()` 函数（保留，无修改）

```js
function toggleTheme() {
  const body = document.body;
  body.classList.toggle('theme-dark');
  showToast(body.classList.contains('theme-dark') ? '已切换至深色模式' : '已切换至浅色模式', 'info');
}
```

### 验收标准
- [ ] header 区域无主题按钮
- [ ] sidebar 底部点「张志豪」→ dropdown 从**上方**展开（不是下方，因为 `bottom-full`）
- [ ] dropdown 4 项 + 用户信息 header 共 5 行
- [ ] 点「切换主题」→ 整页变深色 + 关闭 dropdown
- [ ] 点「退出登录」→ 弹 toast + 关闭 dropdown（实际未退出，演示用）
- [ ] 点 dropdown 外部 / Esc → 关闭

---

## 完整变更清单（按文件位置）

| 行号区间（旧→新） | 改动 | 类型 |
|---|---|---|
| ~274 (header 太阳按钮) | 删除 | 移除 |
| ~275-282 (P0-2 wrapper) | 重写 | 新结构 |
| ~320-340 (sidebar user) | 重写 | 新结构 |
| ~632-826 (整个 BOTTOM 块) | 重写 | 新结构 |
| JS 块开头 | 追加 4 个函数 | 新增 |

---

## 回归测试 checklist

- [ ] 顶部 KPI 4 卡片正常显示（OEE / 在制 Lot / 稼动率 / Yield）
- [ ] 3 列网格（产线状态 / Lot 甘特 / 告警）正常
- [ ] 顶部 header 主题按钮已**消失**
- [ ] 顶部「**快速操作**」按钮可点出下拉
- [ ] 顶部「本班日报」按钮**保留不变**
- [ ] 底部「**今日目标达成**」4 goal bar 正常
- [ ] 底部「**我的待办**」3 卡 + 「**系统消息**」2 条
- [ ] sidebar user dropdown 可展开
- [ ] sidebar nav「CIM-RMS / IMS / 权限 / MDM」4 个数字 badge 还在
- [ ] toast 系统正常（所有 action 都触发）
- [ ] 设备矩阵点击 cell 仍有 toast 反馈
- [ ] dark theme 切换仍有效果

---

## 回滚方案

```bash
# 如需回滚到 P0 之前，用 git 或手动还原
git checkout HEAD~1 -- prototype/index.html
```

或：portal-preview.html 内是**带标注的最新版**；原 P0 之前版本需要从 git/backup 取（这次改动未单独备份，**强烈建议提交 git 后再动**）。

---

## 设计师注

P0 改版的核心是给主页"灵魂"：从"展示现状"升级到"目标驱动"。后续 Sprint 1 的值班长看主页时，第一眼应该是「**今天差多少能交差**」而不是「**现在多少**」。

如果 P0 验收通过，下一步可考虑 P1：
- KPI 2「在制 Lot」加 mini sparkline（24h 进出趋势）
- 「系统消息」拆 tab：「系统通知 / 今日事件 / 维护窗口」
- 顶部 header 班次 pill 加「剩余时长 5h 18m」

**不做的事**（设计师已收口）：
- ❌ 顶部 header 主题按钮不再保留，user 菜单是唯一入口
- ❌ 不再做子系统入口卡片，sidebar 已经是导航唯一来源
- ❌ 4 个 KPI 数值/字段不变，只在 BOTTOM 区加「目标达成」做差异补充

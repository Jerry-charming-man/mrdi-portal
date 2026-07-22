# `_design-ref/` · 设计参考

> ⚠️ **这个目录不进 build。** 这里是设计师交付的 HTML 原型与变更说明，**不是** React 项目源码。
> 源码在 `../src/`。本目录用 `_` 前缀，约定：下划线开头 = 工具/参考资产，不参与打包。

---

## 文件清单

| 文件 | 用途 | 谁看 |
|---|---|---|
| `index.html` | 干净的最终版主页原型（Tailwind CDN，可双击在浏览器直接打开） | 设计师 / PM / 验收 |
| `portal-preview.html` | **带 P0 review 标注的预览版**（右上角浮动「P0 改版」按钮，点开跳到对应改动区） | 设计师 / 改版 review |
| `portal-p0-变更说明.md` | 2026-07-15 P0 改版的开发交接说明（含代码 diff、JS、验收 checklist、回滚方案） | 前端开发 |

---

## 跟 `src/` 的关系

```
mrdi-portal/
├── _design-ref/         ← 设计师交付的 HTML 原型（你在这里）
│   ├── index.html
│   ├── portal-preview.html
│   └── portal-p0-变更说明.md
│
├── src/                 ← 真实源码（Vite + React + TS）
│   ├── pages/
│   │   └── Dashboard.tsx       ← 当前的主页实现（27KB）
│   ├── components/
│   └── ...
│
├── package.json
├── vite.config.ts
└── tailwind.config.js
```

`_design-ref/` 里的 HTML 是**设计稿**，不是真实运行的代码。
当前 React 主页实现见 `src/pages/Dashboard.tsx`，**P0 改版（2026-07-16 起）已对齐**——4 张主卡都是生产 KPI（OEE/在制 Lot/Yield/稼动率）+ Plant 标签 `Fab-1 · MEC`。

---

## 同步规则（约定）

未来如果 P0 / P1 改版要落地到 React：

1. 设计师先改 `index.html`（设计稿更新）
2. 设计师更新 `portal-p0-变更说明.md`（新增 1 个 section）
3. 设计师复制 `index.html` → 改名为 `portal-preview.html` + 加新标注
4. 设计师把 3 个文件覆盖到本目录
5. **开发** 根据 `portal-p0-变更说明.md` 改 `src/pages/Dashboard.tsx`

设计师不动 React 源码，开发不直接改 HTML 原型。
中间靠 `portal-p0-变更说明.md` 做契约。

---

## 建议 .gitignore

如果你的 `mrdi-portal/.gitignore` 还没处理这个目录，加：

```gitignore
# 设计参考资产（不打包，但 commit 进 git 留档）
# 如果不想 commit，取消下一行注释
# _design-ref/
```

默认行为：**本目录提交 git**（作为设计历史留档），但 Vite build 不会打包它（Vite 只看 `public/` 和 `src/`，`_` 前缀也不影响 — 关键是路径在 `src/` 外）。

---

## 版本

| 日期 | 改版 | 内容 |
|---|---|---|
| 2026-07-15 | P0 | 3 处改动：子系统入口 → 今日目标达成 hero · 新建工单 → 快速操作 · 主题按钮 → user 菜单 |
| 2026-07-16 | P0.1 sync | 业务子系统卡 → 生产 KPI 卡（OEE/在制 Lot/Yield/稼动率）；Plant Fab-1 · 上海松江 → Fab-1 · MEC |

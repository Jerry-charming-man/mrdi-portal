# MRDI Portal Sprint 5 · CI/CD Pipeline

> **Sprint 主题**：自动化构建 + 镜像分发 + VM 自动部署
> **启动日期**：2026-07-22
> **目标**：代码 push → 自动 build → 镜像推送 ghcr.io → vm-jerry-dev-01 自动拉起

---

## 一、架构总览

```
GitHub Repo (github.com/MRDI/mrdi-portal)
       │
       │  push / PR
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GitHub Actions                                              │
│                                                              │
│  ci.yml ──► Build ──► TypeScript check ──► Push → ghcr.io  │
│       │                                                        │
│       │  (main branch only)                                   │
│       ▼                                                        │
│  cd.yml ──► Webhook POST → vm-jerry-dev-01 → docker compose  │
└──────────────────────────────────────────────────────────────┘
       │
       │  container images
       ▼
  ghcr.io/mrdi/mdm-api
  ghcr.io/mrdi/cimrms-api
  ghcr.io/mrdi/cimims-api
  ghcr.io/mrdi/cim-perm-api
  ghcr.io/mrdi/mrdi-portal
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  vm-jerry-dev-01 (Azure)                                     │
│                                                              │
│  Webhook receiver (port 9000)                               │
│       │                                                      │
│       ▼                                                      │
│  docker compose -f /opt/mrdi/docker-compose.prod.yml pull    │
│  docker compose -f /opt/mrdi/docker-compose.prod.yml up -d   │
└──────────────────────────────────────────────────────────────┘
```

---

## 二、决策

| # | 决策 | 结论 |
|---|------|------|
| D1 | Git 平台 | GitHub（Jerry 拍板）|
| D2 | Registry | ghcr.io（GitHub Container Registry，免费 + 与 GitHub Actions 原生集成）|
| D3 | CI 触发 | PR → build + test；main merge → build + test + push |
| D4 | CD 触发 | main merge 后 GitHub Actions POST webhook → vm-jerry-dev-01 |
| D5 | VM 部署方式 | Webhook receiver（比 SSH key 更轻量，密码不存 GitHub）|
| D6 | VM 现阶段 | 仅 dev-01 接收 webhook；生产 VM 另规划 |

---

## 三、任务分解

### S5-1 · GitHub Repo 初始化

| 子任务 | 输出 | 状态 |
|--------|------|------|
| 本地 git init | `.git/` | ⬜ |
| 写 `.gitignore` | 排除 node_modules / dist / .env 等 | ⬜ |
| 初始 commit + push | GitHub remote | ⬜ |
| 开启 GitHub repo 设置 | Branch protection（main）+ Actions secrets | ⬜ |

**交付物**：GitHub repo URL + Actions secrets 列表

---

### S5-2 · CI Pipeline（`ci.yml`）

| 子任务 | 输出 | 状态 |
|--------|------|------|
| `pnpm install` 依赖安装 | workspace 依赖 | ⬜ |
| `pnpm build:shared` shared 包编译 | `@mrdi/shared` + `@mrdi/ui` | ⬜ |
| `pnpm --filter mrdi-portal build` Portal 编译 | TypeScript 0 错误 | ⬜ |
| `pnpm typecheck` 全项目类型检查 | 类型报告 | ⬜ |
| 构建 Docker 镜像（5 个）| 镜像 tag: `pr-<PR#>` 或 `sha-<short>` | ⬜ |
| Push 镜像到 ghcr.io | `ghcr.io/mrdi/<image>:sha-<short>` | ⬜ |
| PR comment 报告结果 | GitHub PR check | ⬜ |

**触发条件**：
- `pull_request`（PR 打开 / push / reopen）
- `push` 到 `main`

**分支策略**：
- `main`：受保护分支，所有 PR 需通过 CI 才能 merge
- `feat/*` / `fix/*` 等 feature 分支，通过 CI 后 merge main

---

### S5-3 · CD Pipeline（`cd.yml`）

| 子任务 | 输出 | 状态 |
|--------|------|------|
| 接收 `push` 到 `main` 事件 | `cd.yml` 触发 | ⬜ |
| 发送 webhook 到 vm-jerry-dev-01 | curl POST | ⬜ |
| VM 端 webhook receiver | Python/Node 轻量服务 | ⬜ |
| VM 执行 `docker compose pull` | 最新镜像拉取 | ⬜ |
| VM 执行 `docker compose up -d` | 容器重启 | ⬜ |
| VM 端部署日志输出 | CI Action 日志可见 | ⬜ |

**触发条件**：`push` 到 `main` branch **only**

**部署确认**：
- CI job 里验证 `curl http://localhost:3000/v1/health` 健康检查

---

### S5-4 · VM Webhook Receiver 脚本

| 子任务 | 输出 | 状态 |
|--------|------|------|
| 写 webhook receiver（监听 9000）| `webhook-receiver.js` | ⬜ |
| systemd service 注册 | `/etc/systemd/system/mrdi-webhook.service` | ⬜ |
| VM 端 docker-compose.prod.yml | 生产配置（与 dev 共用 docker-compose.yml）| ⬜ |
| VM 端 `.env` 配置 | 生产密钥（不 commit）| ⬜ |
| VM 端防火墙开放 9000 | Azure NSG 规则 | ⬜ |
| 测试 webhook 手动触发 | 端到端验证 | ⬜ |

---

### S5-5 · 文档收口

| 子任务 | 输出 | 状态 |
|--------|------|------|
| 更新 `DEPLOY.md` 加 CD 部分 | 新章节 | ⬜ |
| 更新 `README.md` 加 GitHub Actions badge | badge | ⬜ |
| 写 `.github/README.md` | Actions 使用说明 | ⬜ |
| 更新 `CHANGELOG.md` | S5-1~5 变更单 | ⬜ |

---

## 四、DoD（Definition of Done）

> Sprint 5 验收通过的条件：

1. [ ] 代码 push 到 GitHub repo main 分支后，**所有 5 个镜像**自动 build 并 push 到 ghcr.io
2. [ ] CI 检查 TypeScript 编译 0 错误
3. [ ] vm-jerry-dev-01 在 webhook 触发后**自动拉起新容器**（无需手动 SSH）
4. [ ] `docker compose ps` 显示所有 7 容器 healthy
5. [ ] `curl http://localhost:3000/v1/health` 返回 200
6. [ ] `curl http://localhost:8089` 返回 Portal 首页

---

## 五、预计工时

| # | 任务 | 预计 | 实际 |
|---|------|------|------|
| S5-1 | GitHub Repo 初始化 | 1h | |
| S5-2 | CI Pipeline | 2h | |
| S5-3 | CD Pipeline | 1.5h | |
| S5-4 | VM Webhook Receiver | 2h | |
| S5-5 | 文档收口 | 0.5h | |
| **合计** | | **7h** | |

---

## 六、风险登记

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| ghcr.io 镜像拉取慢（墙外）| 中 | 低 | VM 在 Azure 香港，ghcr.io 访问 OK |
| VM webhook 端口被 Azure NSG 拦 | 中 | 高 | 提前确认 9000 端口开放 |
| docker compose pull 拉旧镜像 | 低 | 中 | CI 用 `--pull always` 或 tag 用 `latest` + force pull |
| GitHub Actions 权限不足 | 低 | 高 | 用 `GITHUB_TOKEN` + `packages: write` |
| VM 磁盘空间不足 | 低 | 高 | 监控 + 定时 `docker image prune` |

---

## 七、后续 Sprint 6 规划（Playwright E2E）

Sprint 5 收口后，Playwright E2E 依赖 CI 的基础（需先有镜像可用）：

| # | 任务 | 依赖 |
|---|------|------|
| S6-1 | Playwright 安装 + 配置 | S5-2 |
| S6-2 | 写 Login E2E | S5-2 |
| S6-3 | 写 MDM Dashboard E2E | S5-2 |
| S6-4 | 写 CIM-RMS 提交 E2E | S5-2 |
| S6-5 | 集成到 CI（PR block）| S6-1~4 |
| S6-6 | 全部 27 个测试用例自动化 | S6-2~4 |

---

*维护人：Mavis · 2026-07-22*

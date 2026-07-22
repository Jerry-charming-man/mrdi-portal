# MRDI Portal Monorepo

> 5 个业务系统的统一工作区，v1.0 GA（2026-07-21）。

## 系统架构

| 服务 | 端口 | 说明 |
|------|------|------|
| `mrdi-portal` | 8089 | 入口门户，纯前端 SPA |
| `mdm-api` | 3000 | 主数据 + 权限权威源 |
| `cimrms-api` | 3001 | Fab IT 需求工作流（RMS）|
| `cimims-api` | 3002 | 工单系统（IMS）|
| `cim-perm` | 3003 | 资源权限申请 + 审批 + 过期回收 |
| `mrdi-postgres` | 5432 | PostgreSQL（shared DB）|
| `mrdi-redis` | 6379 | Redis（cimrms notifications）|

## 目录结构

```
Portal/
├── docker-compose.yml           # 本机一键起 PG + Redis + 所有 API + Portal
├── pnpm-workspace.yaml
├── package.json                 # monorepo 根（scripts）
├── tsconfig.base.json
├── .env.example
├── packages/
│   ├── shared/                  # @mrdi/shared — errors, mdm-client, enums, permission
│   └── ui/                      # @mrdi/ui — 共享 React 组件
├── mdm-api/                     # MDM API（Fastify + Prisma）
├── cimrms-api/                  # CIM-RMS API（Fastify + Prisma）
├── cimims-api/                  # CIM-IMS API（Fastify + Prisma）
├── cim-perm/                    # 权限申请 API（Fastify + pg）
├── mrdi-portal/                 # 入口门户（React SPA + Vite）
├── load-tests/                  # k6 性能压测脚本
└── docs/                        # 规划 + CHANGELOG + Sprint 看板
```

## 快速启动

### 1. 环境准备

- Node.js 20+
- pnpm 9+（`npm install -g pnpm`）
- Docker Desktop（本地 PostgreSQL + Redis）

### 2. 启动全部服务

```bash
# 复制环境变量（按需调整端口和密钥）
cp .env.example .env

# 一键起所有容器
docker compose up -d

# 或仅起基础设施（DB + Redis）
docker compose up -d postgres redis
```

### 3. 开发调试

```bash
# 安装依赖
pnpm install

# build shared packages
pnpm build:shared

# 启动 portal（默认 8089）
pnpm dev:portal

# 启动单个 API（需先起 PG + Redis）
pnpm dev:mdm      # → localhost:3000
pnpm dev:cimrms   # → localhost:3001
pnpm dev:cimims   # → localhost:3002
pnper dev:cimperm  # → localhost:3003
```

## Sprint 路线图

| Sprint | 时间 | 主题 | 状态 |
|--------|------|------|------|
| Sprint 1 | 07-14 ~ 07-17 | 4 API + Portal MVP（7 容器全 healthy）| ✅ 完成 |
| Sprint 2 | 07-17 ~ 07-20 | M365 OAuth mock + RBAC + bcrypt + Profile | ✅ 完成 |
| Sprint 3 | 07-17 ~ 07-20 | WebSocket 实时推送 + 通知 BullMQ + Admin UI | ✅ 完成 |
| Sprint 4 | 07-20 ~ 07-21 | i18n + 审计聚合 + SQL 优化 + k6 压测 + OpenAPI types | ✅ 完成 |
| **v1.0 GA** | **2026-07-21** | **全系统上线** | **✅** |

## Sprint 4 完成清单

| 任务 | 说明 | 状态 |
|------|------|------|
| S4-1 i18n 框架 | react-i18next + 3 语言（zh-HK/zh-CN/en-US）+ Globe 切换器 | ✅ |
| S4-2 API 错误码 i18n | Zod error → i18nKey；4 API 统一 errorHandler；portal tError fallback | ✅ |
| S4-3 审计聚合 | MDM AuditLog + 3 系统 auditEvent + Portal 审计页面 | ✅ |
| S4-4 SQL 慢查询 | computeSlaPercent N+1 → batch load | ✅ |
| S4-5 k6 性能压测 | 4 API 压测脚本；P95 list < 10ms / create < 60ms；cim-perm 403/500 bugfix | ✅ |
| S4-6 OpenAPI types | 4 API openapi.yaml + orval 生成 TypeScript + React Query hooks | ✅ |
| S4-7 TEST_REPORT_v6 | 27/27 PASS（S4-1~6 全覆盖）；TypeScript 0 错误 | ✅ |
| S4-8 文档收口 | CHANGELOG + README 同步 | ✅ |

## 核心文档

| 文档 | 说明 |
|------|------|
| [`docs/CHANGELOG.md`](./docs/CHANGELOG.md) | 所有变更单 + 决策记录 |
| [`docs/Sprint4/KANBAN.md`](./docs/Sprint4/KANBAN.md) | Sprint 4 看板 + DoD |
| [`docs/TEST_REPORT_v6.md`](./docs/TEST_REPORT_v6.md) | Sprint 4 全面测试报告 |
| [`docs/TEST_REPORT_v5.md`](./docs/TEST_REPORT_v5.md) | Sprint 3 测试报告 |
| [`docs/TEST_REPORT_v4.md`](./docs/TEST_REPORT_v4.md) | Sprint 3 鉴权测试报告 |
| [`load-tests/README.md`](./load-tests/README.md) | k6 压测说明 |

## 关键设计决策

| ADR | 主题 | 状态 |
|-----|------|------|
| ADR-0005 | MDM-only 鉴权路线 | ⚠️ Superseded |
| ADR-0006 | M365 OAuth + MDM 应急（C 方案）| ✅ 生效 |
| ADR-0007 | 统一审计日志（MDM AuditLog）| ✅ 生效 |
| ADR-0008 | OpenAPI + orval 前端类型同步 | ✅ 生效 |

## 路径前缀约定（VM 部署用）

> Azure cloudapp 子域名 DNS 不可解析，VM 上所有服务走 path-prefix。

| 服务 | 路径前缀 |
|------|---------|
| mrdi-portal | `/` |
| mdm-api | `/mdm-api/*` |
| cimrms-api | `/cimrms-api/*` |
| cimims-api | `/cimims-api/*` |
| cim-perm | `/cimrms/*` |

## 团队

- **Jerry** — Senior Manager / 架构 / 业务主导
- **Mavis** — 实施协助（portal 设计 + 后端实现 + 部署）

---

**版本**：v1.0 GA · 2026-07-21

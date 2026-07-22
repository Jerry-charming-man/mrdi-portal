# MRDI Portal — 部署文档

> 本文档：Sprint 3 W4（S3-13）
> 版本：v1.1-baseline（2026-07-20）
> 环境：本地 Docker（开发）/ vm-jerry-dev-01（staging，待启用）

---

## 一、系统架构概览

```
┌─────────────────────────────────────────────────────────────┐
│  mrdi-portal  (port 8089)  React SPA + Vite               │
│  入口：http://localhost:8089                                 │
└────────────────┬──────────────────────────────────────────┘
                 │ HTTP / WebSocket
    ┌────────────┼────────────┬─────────────┐
    │            │            │             │
  mdm-api    cimrms-api   cimims-api  cim-perm-api
  :3000       :3001        :3002        :3003
  MDM          CIM-RMS     CIM-IMS      CIM-PERM
  (Prisma)   (Prisma)    (Prisma)     (PG pool)

  ┌────────────┬────────────┬──────────────────────────────┐
  │  mrdi-postgres  (port 5432)                           │
  │  3 schemas: mdm / cimrms / cimims                    │
  └─────────────────────────────────────────────────────┘
  ┌────────────────┐
  │  mrdi-redis (:6379) BullMQ notification queue       │
  └───────────────┘
```

### 端口分配（当前）

| 容器 | 端口 | 用途 |
|------|------|------|
| mrdi-portal | 8089 | Portal SPA（生产用 Nginx，本机开发用 Vite 5173）|
| mdm-api | 3000 | MDM 主数据 + 认证 + 通知 |
| cimrms-api | 3001 | 需求管理 + WebSocket KPI 推送 |
| cimims-api | 3002 | 事件管理 + WebSocket 告警推送 |
| cim-perm-api | 3003 | 权限请求管理 |
| mrdi-postgres | 5432 | PostgreSQL（3 schema）|
| mrdi-redis | 6379 | Redis（BullMQ 队列）|

---

## 二、快速启动（本地 Docker）

### 前提
- Docker Desktop 运行中
- PostgreSQL 5432 / Redis 6379 未被占用

### 步骤

```bash
cd <repo-root>

# 1. Rebuild 所有镜像（代码变化后执行）
docker build -f mdm-api/Dockerfile         -t mrdi/mdm-api:latest        .
docker build -f cimrms-api/Dockerfile     -t mrdi/cimrms-api:latest      .
docker build -f cimims-api/Dockerfile     -t mrdi/cimims-api:latest      .
docker build -f cim-perm/Dockerfile       -t mrdi/cim-perm-api:latest    .
docker build -f mrdi-portal/Dockerfile    -t portal-mrdi-portal:latest   .

# 2. 启动全部容器
docker compose up -d

# 3. 验证健康状态
docker compose ps

# 4. 查看日志
docker compose logs -f mdm-api
docker compose logs -f cimrms-api
```

### 验证

| 端点 | 验证 | 预期 |
|------|------|------|
| Portal | http://localhost:8089 | Portal 页面 |
| mdm-api health | http://localhost:3000/v1/health | `{"status":"ok","database":"up","queue":"up"}` |
| cimrms-api health | http://localhost:3001/v1/health | `{"status":"ok","database":"up","ws":"ok"}` |
| cimims-api health | http://localhost:3002/v1/health | `{"status":"ok","database":"up","ws":"ok"}` |
| cim-perm-api health | http://localhost:3003/perm-api/v1/health | `{"status":"ok"}` |
| mdm Swagger UI | http://localhost:3000/docs | Swagger UI |
| cimrms Swagger UI | http://localhost:3001/docs | Swagger UI |
| cimims Swagger UI | http://localhost:3002/docs | Swagger UI |
| cim-perm Swagger UI | http://localhost:3003/docs | Swagger UI |

---

## 三、Swagger UI（新增 · Sprint 3 W4 A10）

4 个 API 非生产环境（`NODE_ENV !== 'production'`）自动暴露 Swagger UI。

| API | Swagger URL | 说明 |
|-----|-------------|------|
| mdm-api | http://localhost:3000/docs | MDM + 认证 + 通知 |
| cimrms-api | http://localhost:3001/docs | 需求管理 |
| cimims-api | http://localhost:3002/docs | 事件管理 |
| cim-perm-api | http://localhost:3003/docs | 权限请求 |

生产环境（`NODE_ENV=production`）不注册 Swagger（安全）。

---

## 四、API 鉴权设计（Sprint 3 W3 A15）

### 角色体系
| 角色 | 说明 | 层级 |
|------|------|------|
| admin | 全权限 | 4（最高）|
| auditor | 跨系统读 + 审计 | 3 |
| editor | 系统写操作 | 2 |
| viewer | 系统读操作 | 1 |
| duty（仅 IMS）| 值班工程师 | 2（映射到 editor+）|

### 守卫覆盖

**cimrms-api**
| 端点 | 守卫 |
|------|------|
| POST `/requests` | viewer+ |
| GET `/requests` | viewer+ |
| POST `/requests/:id/approve` | auditor+ OR `cimrms:request:approve` grant |
| POST `/requests/:id/reject` | auditor+ OR `cimrms:request:approve` grant |
| POST `/requests/:id/schedule` | editor+ OR `cimrms:request:schedule` grant |
| POST `/requests/:id/escalate` | editor+ OR `cimrms:request:schedule` grant |

**cimims-api**
| 端点 | 守卫 |
|------|------|
| POST `/incidents/:id/take-over` | duty/editor/admin |
| POST `/incidents/:id/transfer` | duty/editor/admin |
| POST `/incidents/:id/force-close` | auditor+ OR `cimims:incident:admin` grant |
| GET `/incidents/:id/audit` | auditor+ OR `cimims:incident:audit` grant |

**cim-perm-api**
| 端点 | 守卫 |
|------|------|
| POST/GET `/requests` | viewer+ |
| POST `/requests/:id/it-review` | editor+ |
| POST `/requests/:id/owner-review` | auditor+ |
| POST `/requests/:id/revoke` | auditor+ |
| POST `/requests/:id/extend` | auditor+ |
| GET `/audit` | auditor+ |

**mdm-api**
| 端点 | 守卫 |
|------|------|
| `PATCH /v1/users/:id/password` | admin |

### dev_login 状态

| API | `DEV_LOGIN_ENABLED` | 说明 |
|-----|---------------------|------|
| mdm-api | `true` | MDM 保留本地开发入口 |
| cimrms-api | `false` | JWT Bearer 认证 |
| cimims-api | `false` | JWT Bearer 认证 |
| cim-perm-api | `false` | JWT Bearer 认证 |

---

## 五、登录审计（Sprint 3 W4 S3-10）

### 后端 API

| 端点 | 方法 | 权限 | 用途 |
|------|------|------|------|
| `/v1/login-audit` | GET | admin | 分页审计日志 |
| `/v1/login-audit/failed-logins` | GET | admin | 7 天失败登录聚合 |
| `/v1/login-audit/summary` | GET | admin | 今日摘要 |

### Portal 入口
路径：`/mdm/login-audit`（MDM → 运维 → 登录审计）
权限：仅 admin

### 审计事件

| 事件 | 触发 |
|------|------|
| `auth.login.success` | 登录成功（密码 / M365 mock）|
| `auth.login.fail` | 密码错误 / 用户不存在 |
| `auth.login.lock` | 5 次失败后账号锁定 |
| `auth.login.locked` | 锁定状态下登录尝试 |
| `auth.password.changed` | 用户改密成功 |
| `auth.password.change.fail` | 改密失败 |
| `auth.password.reset` | admin 重置密码 |
| `auth.user.unlocked` | admin 解锁账号 |

---

## 六、WebSocket KPI 推送（Sprint 3 W2 S3-5/6）

| API | 事件 | 频率 | 内容 |
|-----|------|------|------|
| cimrms-api | `kpi:rms:update` | 5s | totalActive / inProgress / pendingUat / pendingAcceptance / closed / newToday |
| cimims-api | `kpi:ims:update` | 5s | newToday / openTotal / slaWarn / slaBreach / processing |
| cimims-api | `alarm:ims:new` | 1s | P1/P2 新增事件广播（duty+ / admin）|

### Portal WS URL
- cimrms：`ws://localhost:3001/v1/ws?token=<JWT>`
- cimims：`ws://localhost:3002/v1/ws?token=<JWT>`

---

## 七、环境变量参考

### mdm-api (.env）

```bash
# 数据库
DATABASE_URL=postgresql://mrdi:mrdi_dev@postgres:5432/mrdi

# 端口
PORT=3000
NODE_ENV=development

# JWT
JWT_SECRET=dev-jwt-secret-change-in-production-mrdi-2026
JWT_EXPIRES_IN=8h

# 认证
DEV_LOGIN_ENABLED=true          # MDM 保留本地开发
ADMIN_KEY=mrdi-dev-admin-key-2026
M365_MOCK_ENABLED=true

# Redis
REDIS_URL=redis://redis:6379

# 日志
LOG_LEVEL=info
```

### cimrms-api / cimims-api / cim-perm-api

```bash
DATABASE_URL=postgresql://mrdi:mrdi_dev@postgres:5432/mrdi?schema=<schema>
PORT=<3001|3002|3003>
NODE_ENV=development
JWT_SECRET=dev-jwt-secret-change-in-production-mrdi-2026
JWT_EXPIRES_IN=8h
DEV_LOGIN_ENABLED=false         # 非 MDM API 已禁用

# MDM 调用
MDM_BASE_URL=http://mdm-api:3000/v1
SERVICE_TOKEN=mrdi-dev-service-token-2024
```

---

## 八、容器重启清单

代码变更后重建对应镜像：

```bash
# 方式 A：单个重建
docker build -f mdm-api/Dockerfile          -t mrdi/mdm-api:latest         .
docker build -f cimrms-api/Dockerfile      -t mrdi/cimrms-api:latest       .
docker build -f cimims-api/Dockerfile      -t mrdi/cimims-api:latest       .
docker build -f cim-perm/Dockerfile        -t mrdi/cim-perm-api:latest     .
docker build -f mrdi-portal/Dockerfile     -t portal-mrdi-portal:latest    .

# 重启
docker compose up -d --force-recreate <service-name>

# 方式 B：全部重建（代码大变更后）
docker compose build --no-cache
docker compose up -d
```

---

## 九、数据库 Schema

| Schema | API | 说明 |
|--------|-----|------|
| mdm | mdm-api | 用户 / 角色 / 通知 / 权限授予 / 登录审计 |
| cimrms | cimrms-api | 需求 / 事件时间线 / 升级 / SLA |
| cimims | cimims-api | 事件 / 时间线 / 工程师 / 值班表 |

Prisma migrate（仅 schema 变更后）：
```bash
docker exec -it mdm-api pnpm exec prisma db push --skip-generate
docker exec -it cimrms-api pnpm exec prisma db push --skip-generate
docker exec -it cimims-api pnpm exec prisma db push --skip-generate
```

---

## 十、常见问题

| 问题 | 解决 |
|------|------|
| BullMQ 不发通知 | 确认 Redis 健康：`docker compose logs mdm-api \| grep bullmq` |
| WS 连接失败 | 确认 token 未过期（8h）；检查 `DEV_LOGIN_ENABLED=false`（需 JWT）|
| Swagger UI 404 | 确认 `NODE_ENV !== 'production'`；检查容器日志 |
| cim-perm API 500 | 确认 `cim-perm/scripts/schema.sql` 已通过 init-db 加载 |
| TypeScript 编译错误 | `pnpm install` + `pnpm --filter <api> typecheck` |

---

*维护人：Mavis · 更新时机：Sprint 3 末（2026-07-20）*
*关联：Sprint 3 KANBAN / TEST_REPORT_v5 / CHANGELOG 变更单-14/-15/-16*

# MRDI Portal Load Tests (S4-5 · k6)

4 个 API 的压测场景 — Spring 4 W13 收口。

## 环境要求

- k6 v0.55+（项目根目录已有 `k6.exe`）
- 4 个 API 容器运行中（`docker compose up -d`）
- 端口：mdm-api 3000 / cimrms-api 3001 / cimims-api 3002 / cim-perm-api 3003

## 用法

```bash
# 单个 API
./k6.exe run --out json=results/mdm-api.json load-tests/scenarios/mdm-api.js

# 全部 4 个 API（顺序执行）
./k6.exe run load-tests/scenarios/mdm-api.js
./k6.exe run load-tests/scenarios/cimrms-api.js
./k6.exe run load-tests/scenarios/cimims-api.js
./k6.exe run load-tests/scenarios/cim-perm-api.js
```

## 场景

| 文件 | API | 流量模型 | VU | 时长 |
|------|-----|---------|----|----|
| `mdm-api.js` | mdm-api (3000) | read-heavy (user/role/notification/audit) | 50 | 100s |
| `cimrms-api.js` | cimrms-api (3001) | list + dashboard + create + transition | 30 | 100s |
| `cimims-api.js` | cimims-api (3002) | list + dashboard + create + take-over | 30 | 100s |
| `cim-perm-api.js` | cim-perm-api (3003) | list + dashboard + create + IT review | 30 | 100s |

## 阈值（Thresholds）

- **p95 < 300-600ms**（按端点）
- **p99 < 500-1000ms**（按端点）
- **http_req_failed < 1-2%**

## 输出

- `results/<api>-summary.json` — 聚合数据
- 终端实时 P95/P99 报告

## 调优建议（压测后看）

如果哪个端点 P95 超阈值，重点排查：
- Prisma query 缺索引（跑 `EXPLAIN ANALYZE`）
- N+1 查询
- 同步外部 HTTP 调用（audit / notification）
- JWT 验证开销

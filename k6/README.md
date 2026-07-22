# k6 Load Test Scripts

## 快速运行

```powershell
# 单个 API
.\k6.exe run k6/cimrms-api.js

# 指定 URL（CI/远程环境）
$env:CIMRMS_API_URL="http://your-host:3001"
.\k6.exe run k6/cimrms-api.js

# 4 个 API 串行
.\k6.exe run k6/mdm-api.js
.\k6.exe run k6/cimrms-api.js
.\k6.exe run k6/cimims-api.js
.\k6.exe run k6/cim-perm-api.js
```

## 测试场景

| API | S1 | S2 | S3 |
|-----|----|----|----|
| mdm-api | List users | Get user profile | List registered systems |
| cimrms-api | List requests | Create request | List my requests |
| cimims-api | List incidents | Create incident | List my incidents |
| cim-perm-api | List perm requests | Create perm request | List my requests |

## 配置参数

| ENV | 默认值 | 说明 |
|-----|--------|------|
| `CIMRMS_API_URL` | `http://localhost:3001` | cimrms-api base URL |
| `CIMIMS_API_URL` | `http://localhost:3002` | cimims-api base URL |
| `CIMPERM_API_URL` | `http://localhost:3003` | cim-perm-api base URL |
| `MDM_API_URL` | `http://localhost:3000` | mdm-api base URL |

## 压测配置

- **Stages**: 10 VUs warmup → 20 VUs load → hold → ramp-down
- **Duration**: ~50s per script
- **Thresholds**:
  - p(95) < 500ms
  - p(99) < 1000ms
  - Error rate < 5%

## 输出

运行后输出：
- stdout 彩色摘要（p50/p95/p99/max）
- 可导出 JSON 格式：`--out json=results.json`

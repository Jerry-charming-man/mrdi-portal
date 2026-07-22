# GitHub Actions · MRDI Portal

## 概览

| Workflow | 触发 | 用途 |
|----------|------|------|
| [`ci.yml`](workflows/ci.yml) | PR / push to `main` | Build + TypeScript check + push images to ghcr.io |
| [`cd.yml`](workflows/cd.yml) | push to `main` / manual | 触发 vm-jerry-dev-01 webhook，自动拉起新容器 |

## CI Pipeline（`ci.yml`）

```
push main / PR
    │
    ▼
typecheck ──► build-images (5 parallel)
    │           │
    │           ├── mdm-api
    │           ├── cimrms-api
    │           ├── cimims-api
    │           ├── cim-perm-api
    │           └── mrdi-portal
    │
    ▼
pr-summary (PR comment)
```

**镜像地址**：`ghcr.io/<owner>/mrdi/<service>:sha-<short>`
**Latest tag**：仅 `main` 分支推送时打

## CD Pipeline（`cd.yml`）

```
push main
    │
    ▼
deploy ──► webhook POST → vm-jerry-dev-01:9000
    │          │
    │          ▼
    │     docker compose pull
    │     docker compose up -d
    │
    ▼
notify (status in PR / Actions UI)
```

## GitHub Secrets（需在 repo Settings → Secrets 配置）

| Secret | 说明 | 必需 |
|--------|------|------|
| `GITHUB_TOKEN` | 自动提供，无需手动设置 | ✅ |
| `MRDI_WEBHOOK_SECRET` | webhook 签名密钥，VM 端一致 | ✅ |
| `VM_HOST` | vm-jerry-dev-01 的公网域名/IP（放 Settings → Variables）| ✅ |

## VM 端要求

vm-jerry-dev-01 需提前安装：
1. **Webhook receiver**：`scripts/webhook-receiver.py`
2. **Systemd service**：`/etc/systemd/system/mrdi-webhook.service`
3. **Production compose**：`/opt/mrdi/docker-compose.prod.yml`
4. **环境变量**：`.env`（生产密钥，**不 commit**）
5. **Caddy 反代**：`/api/deploy` → `localhost:9000`

## 添加新 API 到 CI

编辑 `ci.yml` → `build-images` → `strategy.matrix.include`，加一行：

```yaml
- service: my-new-api
  dockerfile: my-new-api/Dockerfile
  image_name: my-new-api
```

镜像自动注册到 ghcr.io。

## 手动触发 CD

在 GitHub Actions UI → `CD · Deploy to vm-jerry-dev-01` → Run workflow。

## 本地测试 Actions

```bash
# 安装 act（GitHub Actions local runner）
brew install act   # macOS
winget install open-containers.act  # Windows

# Dry run（不实际执行）
act -n

# 本地运行 CI
act -j typecheck
```

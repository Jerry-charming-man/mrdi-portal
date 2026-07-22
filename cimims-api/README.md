# mdm-api

MRDI Master Data Management — 权限权威源 + 主数据 API。

## 快速开始

```bash
# 起基础设施（PG + Redis）
cd .. && docker compose up -d postgres redis

# 安装依赖（已在 monorepo pnpm install 中装好）
pnpm install

# 建 schema（dev）
pnpm db:push

# 启动
pnpm dev
```

API 在 `http://localhost:3000` 上，Swagger UI: `http://localhost:3000/docs`

## Dev Login

```bash
# 获取 JWT token
curl "http://localhost:3000/auth/v1/dev/login?email=jerry@mrdi.com&role=admin"
```

## API 路径前缀

生产环境走 Caddy 反代，路径前缀 `/mdm-api/v1`

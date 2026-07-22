# ─── Builder stage: build the portal from monorepo source ───────────────────
FROM node:24-alpine AS builder

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION:-9.0.0} --activate

# Copy monorepo source (entire repo so workspace deps resolve)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages/
COPY tsconfig.base.json ./
COPY mrdi-portal mrdi-portal/

# Install all dependencies (workspace links)
RUN pnpm install

# Build shared + ui (needed by mrdi-portal)
RUN pnpm exec tsc -p packages/shared/tsconfig.json
RUN pnpm --filter @mrdi/ui build

# Build the portal
RUN pnpm --filter mrdi-portal build

# ─── Runtime stage: serve with nginx ────────────────────────────────────────
FROM nginx:alpine

# Copy built portal assets from builder
COPY --from=builder /app/mrdi-portal/dist/ /usr/share/nginx/html/

# Copy nginx config
COPY --from=builder /app/mrdi-portal/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

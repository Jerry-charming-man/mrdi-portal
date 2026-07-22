ï»¿# ============================================================
# cimrms-api Dockerfile
# Strategy: rebuild everything inside Docker (pnpm + prisma generate)
# Build context: monorepo root (40-Minimax/Portal/)
# ============================================================
FROM node:22-bullseye AS builder
WORKDIR /app
ENV NODE_ENV=development

# 1. Install pnpm globally
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION:-9.0.0} --activate

# 2. Copy monorepo package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src/
COPY packages/shared/tsconfig.json ./packages/shared/tsconfig.json
COPY tsconfig.base.json ./tsconfig.base.json
COPY packages/teams-notify/package.json ./packages/teams-notify/
COPY packages/teams-notify/src ./packages/teams-notify/src/
COPY cimrms-api/package.json ./cimrms-api/
COPY cimrms-api/tsconfig.json ./cimrms-api/
COPY cimrms-api/src ./cimrms-api/src/
COPY cimrms-api/prisma ./cimrms-api/prisma/

# 3. Install all deps (no workspace protocol â€” use actual installed packages)
# shamefully-hoist=true: flat node_modules so COPY to runtime works
RUN pnpm install --shamefully-hoist=true

# 4. Build shared packages first (use pnpm exec for reliable bin path resolution)
RUN pnpm exec tsc -p packages/shared/tsconfig.json

# 5. Build teams-notify
RUN pnpm exec tsc -p packages/teams-notify/tsconfig.json 2>/dev/null || true

# 6. Generate Prisma client for cimrms
RUN pnpm --filter cimrms-api exec prisma generate

# 7. Build cimrms-api
RUN pnpm --filter cimrms-api build

# â”€â”€ Runtime stage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
FROM node:22-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=development

# Copy node_modules from builder (flat with shamefully-hoist=true)
COPY --from=builder /app/node_modules ./node_modules

# Copy built artifacts from builder
COPY --from=builder /app/cimrms-api/dist ./dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/teams-notify/dist ./packages/teams-notify/dist 2>/dev/null || true

# Write standalone package.json for @mrdi/shared (no workspace protocol)
RUN echo '{"name":"@mrdi/shared","version":"1.0.0","type":"module","main":"./dist/index.js","exports":{".":{"import":"./dist/index.js"},"*":"./dist/*"}}' > ./packages/shared/package.json

# Write standalone package.json for cimrms-api (prisma in deps)
RUN echo '{"name":"cimrms-api","version":"1.0.0","type":"module","dependencies":{"@fastify/cors":"^9.0.1","@fastify/jwt":"^8.0.1","@fastify/swagger":"^8.0.0","@fastify/swagger-ui":"^4.0.0","@fastify/websocket":"^10.0.0","@mrdi/shared":"file:./packages/shared","@prisma/client":"5.22.0","fastify":"^4.28.0","fastify-plugin":"^4.5.1","http-errors":"^2.0.1","pino":"^9.4.0","pino-pretty":"^11.2.0","prisma":"5.22.0","zod":"^3.23.8"}}' > ./package.json

# Verify PrismaClient loads
RUN node -e "const{PrismaClient}=require('@prisma/client');console.log('PrismaClient OK:',typeof PrismaClient)"

EXPOSE 3001
CMD ["node", "dist/server.js"]

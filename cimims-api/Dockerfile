# ============================================================
# cimims-api Dockerfile
# Strategy: rebuild everything inside Docker (pnpm + prisma generate)
# Build context: monorepo root (40-Minimax/Portal/)
# ============================================================
FROM node:22-bullseye AS builder
WORKDIR /app
ENV NODE_ENV=production

# 1. Install pnpm globally
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

# 2. Copy monorepo package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/shared/src ./packages/shared/src/
COPY cimims-api/package.json ./cimims-api/
COPY cimims-api/tsconfig.json ./cimims-api/
COPY cimims-api/prisma ./cimims-api/prisma/

# 3. Install all deps
RUN pnpm install --frozen-lockfile

# 4. Build @mrdi/shared first
RUN pnpm --filter @mrdi/shared build

# 5. Generate Prisma client for cimims (standard @prisma/client, no custom name)
RUN pnpm --filter cimims-api db:generate

# 6. Build cimims-api
RUN pnpm --filter cimims-api build

# ── Runtime stage ────────────────────────────────────────────
FROM node:22-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built artifacts from builder
COPY --from=builder /app/cimims-api/dist ./dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Write standalone package.json for @mrdi/shared (no workspace: protocol)
RUN echo '{"name":"@mrdi/shared","version":"1.0.0","type":"module","main":"./dist/index.js","exports":{".":{"import":"./dist/index.js"},"*":"./dist/*"}}' > ./packages/shared/package.json

# Write standalone package.json for cimims-api (prisma in deps for runtime)
RUN echo '{"name":"cimims-api","version":"1.0.0","type":"module","dependencies":{"@fastify/cors":"^9.0.1","@fastify/jwt":"^8.0.1","@fastify/swagger":"^8.0.0","@fastify/swagger-ui":"^4.0.0","@fastify/websocket":"^10.0.0","@mrdi/shared":"file:./packages/shared","@prisma/client":"^5.22.0","fastify":"^4.28.0","fastify-plugin":"^4.5.1","http-errors":"^2.0.1","pino":"^9.4.0","pino-pretty":"^11.2.0","zod":"^3.23.8"}}' > ./package.json

# Install runtime deps only
RUN npm install --legacy-peer-deps --omit=dev 2>&1 | tail -3

# Verify PrismaClient
RUN node -e "const{PrismaClient}=require('@prisma/client');console.log('PrismaClient OK:',typeof PrismaClient)"

EXPOSE 3002
CMD ["node", "dist/server.js"]

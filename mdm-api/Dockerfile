# ============================================================
# mdm-api Dockerfile
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
COPY mdm-api/package.json ./mdm-api/
COPY mdm-api/tsconfig.json ./mdm-api/
COPY mdm-api/src ./mdm-api/src/
COPY mdm-api/prisma ./mdm-api/prisma/

# 3. Install all deps (workspace:* resolved to local packages)
RUN pnpm install

# 4. Build @mrdi/shared first (use pnpm exec for reliable bin path resolution)
RUN pnpm exec tsc -p packages/shared/tsconfig.json

# 5. Generate Prisma client for mdm-api
# pnpm hoists @prisma/client to monorepo root, so prisma binary is at /app/node_modules/.bin/prisma
RUN pnpm exec prisma generate --schema mdm-api/prisma/schema.prisma

# 6. Build mdm-api
RUN pnpm --filter mdm-api build

# ── Runtime stage ────────────────────────────────────────────
FROM node:22-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy entire mdm-api node_modules (contains both @prisma/client npm pkg + .prisma generated)
COPY --from=builder /app/mdm-api/node_modules ./node_modules

# Copy built artifacts from builder
COPY --from=builder /app/mdm-api/dist ./dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Write standalone package.json for @mrdi/shared (no workspace: protocol)
RUN echo '{"name":"@mrdi/shared","version":"1.0.0","type":"module","main":"./dist/index.js","exports":{".":{"import":"./dist/index.js"},"*":"./dist/*"}}' > ./packages/shared/package.json

# Write standalone package.json for mdm-api (prisma in deps for runtime)
RUN echo '{"name":"mdm-api","version":"1.0.0","type":"module","dependencies":{"@fastify/cors":"^9.0.1","@fastify/jwt":"^8.0.1","@fastify/swagger":"^8.0.0","@fastify/swagger-ui":"^4.0.0","@mrdi/shared":"file:./packages/shared","@prisma/client":"^5.22.0","bcryptjs":"^2.4.3","bullmq":"^5.30.0","fastify":"^4.28.0","fastify-plugin":"^4.5.1","http-errors":"^2.0.1","ioredis":"^5.4.1","pino":"^9.4.0","pino-pretty":"^11.2.0","zod":"^3.23.8"}}' > ./package.json

# Install runtime deps only
RUN npm install --legacy-peer-deps --omit=dev 2>&1 | tail -3

# Verify PrismaClient
RUN node -e "const{PrismaClient}=require('@prisma/client');console.log('PrismaClient OK:',typeof PrismaClient)"

EXPOSE 3000
CMD ["node", "dist/src/server.js"]

# ============================================================
# cimims-api Dockerfile
# Strategy: pre-built dist + prisma generate in-container
# Build context: monorepo root (40-Minimax/Portal/)
# ============================================================
FROM node:22-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1. Copy pre-built dist and prisma schema
COPY packages/shared/dist ./packages/shared/dist
COPY cimims-api/dist ./dist
COPY cimims-api/prisma/schema.prisma ./prisma/schema.prisma

# 2. Write standalone package.json for @mrdi/shared
RUN echo '{"name":"@mrdi/shared","version":"1.0.0","type":"module","main":"./dist/index.js","module":"./dist/index.js","exports":{".":{"import":"./dist/index.js"},"./errors":{"import":"./dist/errors/index.js"},"./duration":{"import":"./dist/duration/index.js"},"./enums":{"import":"./dist/enums/index.js"},"./mdm-client":{"import":"./dist/mdm-client/index.js"},"./request-no":{"import":"./dist/request-no/index.js"},"./permission":{"import":"./dist/permission/index.js"}}}' > ./packages/shared/package.json

# 3. Write standalone package.json — prisma in deps so local CLI is available
#    @fastify/swagger 8.x (NOT 9.x) — 9.x requires Fastify 5.x, we use Fastify 4.x
RUN echo '{"name":"cimims-api","version":"1.0.0","type":"module","dependencies":{"@fastify/cors":"^9.0.1","@fastify/jwt":"^8.0.1","@fastify/swagger":"^8.0.0","@fastify/swagger-ui":"^4.0.0","@fastify/websocket":"^10.0.0","@mrdi/shared":"file:./packages/shared","@prisma/client":"5.22.0","fastify":"^4.28.0","fastify-plugin":"^4.5.1","http-errors":"^2.0.1","pino":"^9.4.0","pino-pretty":"^11.2.0","prisma":"5.22.0","zod":"^3.23.8"}}' > ./package.json

# 4. Install deps
RUN corepack enable && corepack prepare pnpm@9.0.0 --activate && \
    pnpm install --prefer-offline 2>&1 | tail -3

# 5. Run prisma generate and verify
RUN echo "Running prisma generate..." && \
    ./node_modules/.bin/prisma generate 2>&1 | tail -8 && \
    echo "Verifying PrismaClient..." && \
    node -e "const{PrismaClient}=require('@prisma/client');console.log('PrismaClient OK:',typeof PrismaClient)"

EXPOSE 3002
CMD ["node", "dist/server.js"]

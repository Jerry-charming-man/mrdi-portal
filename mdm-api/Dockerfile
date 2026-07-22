# ============================================================
# mdm-api Dockerfile
# Strategy: pre-built dist + prisma generate in-container
# Build context: monorepo root (40-Minimax/Portal/)
# ============================================================
FROM node:22-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=production

# 1. Copy pre-built dist and schema
COPY packages/shared/dist ./packages/shared/dist
COPY mdm-api/dist ./dist
COPY mdm-api/prisma/schema.prisma ./prisma/schema.prisma
# Copy pre-generated Prisma client (with Notification model) — avoids generate in-container issue
COPY mdm-api/node_modules/.prisma/client ./node_modules/.prisma/client

# 2. Write standalone package.json for @mrdi/shared (no workspace: protocol)
RUN echo '{"name":"@mrdi/shared","version":"1.0.0","main":"./dist/index.js","module":"./dist/index.js","exports":{".":{"import":"./dist/index.js"},"./errors":{"import":"./dist/errors/index.js"},"./duration":{"import":"./dist/duration/index.js"},"./enums":{"import":"./dist/enums/index.js"},"./mdm-client":{"import":"./dist/mdm-client/index.js"},"./request-no":{"import":"./dist/request-no/index.js"},"./permission":{"import":"./dist/permission/index.js"}}}' > ./packages/shared/package.json

# 3. Write minimal package.json for mdm-api
#    NOTE: prisma is in deps (not devDeps) so it's available at build time
#    @fastify/swagger 8.x (NOT 9.x) — 9.x requires Fastify 5.x, we use Fastify 4.x
RUN echo '{"name":"mdm-api","version":"1.0.0","type":"module","dependencies":{"@fastify/cors":"^9.0.1","@fastify/jwt":"^8.0.1","@fastify/swagger":"^8.0.0","@fastify/swagger-ui":"^4.0.0","@mrdi/shared":"file:./packages/shared","@prisma/client":"5.22.0","bcryptjs":"^2.4.3","bullmq":"^5.30.0","fastify":"^4.28.0","fastify-plugin":"^4.5.1","http-errors":"^2.0.1","ioredis":"^5.4.1","pino":"^9.4.0","pino-pretty":"^11.2.0","prisma":"5.22.0","zod":"^3.23.8"}}' > ./package.json

# 4. Install deps — use npm (avoids pnpm store symlink issue in container)
RUN npm install --legacy-peer-deps 2>&1 | tail -3

# 5. Run prisma generate — this rewrites @prisma/client with generated client code
#    After this, @prisma/client/default.js contains the real PrismaClient implementation
RUN echo "Running prisma generate..." && \
    ./node_modules/.bin/prisma generate 2>&1 | tail -10 && \
    echo "Verifying PrismaClient loads..." && \
    node -e "const{PrismaClient}=require('@prisma/client');console.log('PrismaClient OK:',typeof PrismaClient)"

EXPOSE 3000
CMD ["node", "dist/server.js"]

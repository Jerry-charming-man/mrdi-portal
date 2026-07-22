# ============================================================
# cim-perm Dockerfile
# Strategy: use pre-built dist from monorepo root (no in-container build)
# Build context: monorepo root (40-Minimax/Portal/)
# ============================================================
FROM node:22-bullseye AS runner
WORKDIR /app
ENV NODE_ENV=development
ENV JWT_SECRET=dev-jwt-secret-change-in-production-mrdi-2026
ENV DB_HOST=mrdi-postgres
ENV DB_USER=mrdi
ENV DB_PASSWORD=mrdi_dev
ENV DB_NAME=mrdi
ENV MDM_BASE_URL=http://mdm-api:3000
ENV SERVICE_TOKEN=mrdi-dev-service-token-2024
ENV CORS_ORIGINS=http://localhost:8089,http://localhost:5173

# 1. Copy pre-built dist and scripts (build context = monorepo root)
COPY packages/shared/dist ./packages/shared/dist
COPY cim-perm/dist ./dist
COPY cim-perm/scripts ./scripts

# 2. Write standalone package.json for @mrdi/shared (no workspace: protocol)
RUN echo '{"name":"@mrdi/shared","version":"1.0.0","type":"module","main":"./dist/index.js","exports":{".":{"import":"./dist/index.js"},"./errors":{"import":"./dist/errors/index.js"},"./duration":{"import":"./dist/duration/index.js"},"./enums":{"import":"./dist/enums/index.js"},"./mdm-client":{"import":"./dist/mdm-client/index.js"},"./request-no":{"import":"./dist/request-no/index.js"},"./permission":{"import":"./dist/permission/index.js"}}}' > ./packages/shared/package.json

# 3. Write standalone package.json for cim-perm-api
RUN echo '{"name":"cim-perm-api","version":"1.0.0","type":"module","dependencies":{"@fastify/cors":"^9.0.1","@fastify/jwt":"^8.0.1","@fastify/swagger":"^8.0.0","@fastify/swagger-ui":"^4.0.0","@mrdi/shared":"file:./packages/shared","fastify":"^4.28.0","fastify-plugin":"^4.5.1","http-errors":"^2.0.1","node-cron":"^3.0.3","pg":"^8.12.0","pino":"^9.4.0","pino-pretty":"^11.2.0","uuid":"^10.0.0","zod":"^3.23.8"}}' > ./package.json

# 4. Install runtime deps only
RUN npm install --legacy-peer-deps --omit=dev 2>&1 | tail -3

# 5. Verify pg loads
RUN node -e "const{Client}=require('pg');console.log('pg OK:',typeof Client)"

EXPOSE 3003
CMD ["node", "dist/server.js"]

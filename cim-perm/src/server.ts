/**
 * cim-perm — server.ts (Fastify 4, migrated from Express)
 */
import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';
import { startCronJobs } from './services/cronService.js';

const env = loadEnv();
const app = await buildApp(env);
const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });

app.log.info(`🚀 CIM-PERM API running on ${address}`);
app.log.info(`   Health:  ${address}/perm-api/v1/health`);

if (env.NODE_ENV !== 'production') {
  app.log.info('📝 Dev auth: add ?dev_login&email=xxx to any request');
}

startCronJobs();

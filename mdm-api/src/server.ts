/**
 * mdm-api — server.ts
 */
import { loadEnv } from './config/env.js';
import { buildApp } from './app.js';

const env = loadEnv();
const app = await buildApp(env);
const address = await app.listen({ port: env.PORT, host: '0.0.0.0' });

app.log.info(`🚀 MDM API running on ${address}`);
app.log.info(`   Health:  ${address}/health`);
app.log.info(`   Swagger: ${address}/docs`);

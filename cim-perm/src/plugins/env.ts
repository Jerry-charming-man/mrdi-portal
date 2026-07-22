/**
 * Env 注入
 */
import fp from 'fastify-plugin';
import type { Env } from '../config/env.js';

declare module 'fastify' {
  interface FastifyInstance {
    env: Env;
  }
}

export const envPlugin = fp(async (app, env: Env) => {
  app.decorate('env', env);
});

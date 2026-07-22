/**
 * Env 注入 — 让 app.env 在所有地方可用
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

/**
 * pg Pool plugin (replaces old backend/src/db/pool.ts)
 */
import fp from 'fastify-plugin';
import { Pool } from 'pg';

export const pgPlugin = fp(async (app) => {
  const env = app.env;
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    max: 20,
  });

  pool.on('error', (err) => {
    app.log.error({ err }, 'Unexpected DB pool error');
  });

  app.addHook('onClose', async () => {
    await pool.end();
    app.log.info('[pg] pool closed');
  });

  app.decorate('pgPool', pool);
  app.decorate('query', async <T = unknown>(text: string, params?: unknown[]): Promise<T[]> => {
    const result = await pool.query(text, params);
    return result.rows as T[];
  });
  app.decorate('queryOne', async <T = unknown>(text: string, params?: unknown[]): Promise<T | null> => {
    const result = await pool.query(text, params);
    return (result.rows[0] as T) ?? null;
  });
});

declare module 'fastify' {
  interface FastifyInstance {
    pgPool: import('pg').Pool;
    query: <T = unknown>(text: string, params?: unknown[]) => Promise<T[]>;
    queryOne: <T = unknown>(text: string, params?: unknown[]) => Promise<T | null>;
  }
}

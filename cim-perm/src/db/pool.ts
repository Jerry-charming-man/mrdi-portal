/**
 * pg pool — cim-perm (preserved from old backend, services still import from here)
 * Note: this is a SEPARATE pool from the Fastify plugin (both share the same DB).
 * The plugin pool handles graceful shutdown via Fastify lifecycle.
 */
import { Pool } from 'pg';
import { loadEnv } from '../config/env.js';

const env = loadEnv();
export const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  max: 20,
  // Set search_path so unqualified table names resolve to cimperm.*
  options: '-c search_path=cimperm,public',
});

pool.on('error', (err) => {
  console.error('Unexpected DB pool error:', err);
});

export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

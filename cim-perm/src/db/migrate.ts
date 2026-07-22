/**
 * Migration script — run on startup or manually
 * Usage: pnpm db:migrate
 */
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { loadEnv } from '../config/env.js';

const env = loadEnv();
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});

function splitSql(sql: string): string[] {
  const stmts: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';
  let parenDepth = 0;
  let inLineComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1] ?? '';

    if (inLineComment) {
      if (ch === '\n') { inLineComment = false; current += ch; }
      continue;
    }
    if (!inDollarQuote && ch === '-' && next === '-') { inLineComment = true; continue; }
    if (!inDollarQuote && ch === '/' && next === '*') { i++; continue; }

    if (!inDollarQuote && ch === '$') {
      const tagMatch = sql.slice(i).match(/^\$([a-zA-Z_]*)\$/);
      if (tagMatch) {
        dollarTag = tagMatch[1] ?? '';
        inDollarQuote = true;
        current += tagMatch[0];
        i += tagMatch[0].length - 1;
        continue;
      }
    } else if (inDollarQuote && ch === '$' && sql.slice(i).startsWith('$' + dollarTag + '$')) {
      current += '$' + dollarTag + '$';
      inDollarQuote = false;
      dollarTag = '';
      continue;
    }

    if (inDollarQuote) { current += ch; continue; }
    if (ch === '(') parenDepth++;
    if (ch === ')') parenDepth--;
    if (ch === ';' && parenDepth === 0) {
      const stmt = current.trim();
      if (stmt && !stmt.startsWith('--')) stmts.push(stmt);
      current = '';
      continue;
    }
    current += ch;
  }
  const final = current.trim();
  if (final && !final.startsWith('--')) stmts.push(final);
  return stmts;
}

async function migrate() {
  const schemaPath = path.join(process.cwd(), 'scripts', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  console.log('🔧 Running migrations...');
  const client = await pool.connect();
  try {
    const stmts = splitSql(sql);
    for (let i = 0; i < stmts.length; i++) {
      const stmt = (stmts[i] ?? '').trim();
      if (!stmt) continue;
      try {
        await client.query(stmt);
      } catch (e: unknown) {
        const err = e as { message: string };
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`  ⏭  ${stmt.slice(0, 60)}... (already exists)`);
        } else {
          console.error(`  ❌ Statement ${i + 1} failed:\n  ${stmt.slice(0, 200)}`);
          throw e;
        }
      }
    }
    console.log(`✅ Migration complete! (${stmts.length} statements)`);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();

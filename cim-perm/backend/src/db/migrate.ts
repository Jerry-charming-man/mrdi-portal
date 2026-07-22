import { Pool } from 'pg'
import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'

dotenv.config()

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME     || 'cim_perm',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD  || 'postgres',
})

// Split SQL into individual statements (handles $$ blocks correctly)
function splitSql(sql: string): string[] {
  const stmts: string[] = []
  let current = ''
  let inDollarQuote = false
  let dollarTag = ''
  let parenDepth = 0
  let inComment = false
  let inLineComment = false

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i]
    const next = sql[i + 1] ?? ''

    // End of line comment
    if (inLineComment) {
      if (ch === '\n') { inLineComment = false; current += ch }
      else continue
    }

    // Skip comments
    if (!inDollarQuote && ch === '-' && next === '-') { inLineComment = true; continue }
    if (!inDollarQuote && ch === '/' && next === '*') { inComment = true; i++; continue }
    if (inComment && ch === '*' && next === '/') { inComment = false; i++; continue }
    if (inComment) continue

    // Dollar quote
    if (!inDollarQuote && ch === '$') {
      const tagMatch = sql.slice(i).match(/^\$([a-zA-Z_]*)\$/)
      if (tagMatch) {
        dollarTag = tagMatch[1] ? tagMatch[1] : ''
        inDollarQuote = true
        current += tagMatch[0]
        i += tagMatch[0].length - 1
        continue
      }
    } else if (inDollarQuote && ch === '$' && sql.slice(i).startsWith('$' + dollarTag + '$')) {
      current += '$' + dollarTag + '$'
      inDollarQuote = false
      dollarTag = ''
      continue
    }

    if (inDollarQuote) { current += ch; continue }

    // Parentheses depth for tracking
    if (ch === '(') parenDepth++
    if (ch === ')') parenDepth--

    // End of statement
    if (ch === ';' && parenDepth === 0) {
      const stmt = current.trim()
      if (stmt && !stmt.startsWith('--')) stmts.push(stmt)
      current = ''
      continue
    }

    current += ch
  }

  const final = current.trim()
  if (final && !final.startsWith('--')) stmts.push(final)

  return stmts
}

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql')
  const sql = fs.readFileSync(schemaPath, 'utf8')

  console.log('🔧 Running migrations...')
  const client = await pool.connect()

  try {
    const stmts = splitSql(sql)
    for (let i = 0; i < stmts.length; i++) {
      const stmt = stmts[i].trim()
      if (!stmt) continue
      try {
        await client.query(stmt)
      } catch (e: unknown) {
        const err = e as { message: string }
        // Ignore "already exists" errors
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`  ⏭  ${stmt.slice(0, 60)}... (already exists — skipped)`)
        } else {
          console.error(`  ❌ Statement ${i + 1} failed:\n  ${stmt.slice(0, 200)}`)
          throw e
        }
      }
    }
    console.log(`✅ Migration complete! (${stmts.length} statements)`)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()

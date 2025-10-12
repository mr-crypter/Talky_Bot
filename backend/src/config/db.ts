import pg, { type QueryResult, type QueryResultRow } from 'pg'

const { Pool } = pg

const conn = process.env.DATABASE_URL ?? ''

let ssl: false | { rejectUnauthorized: false } = false
try {
  const url = new URL(conn)
  const host = url.hostname || ''
  const forceOn = (process.env.DATABASE_SSL?.toLowerCase() === 'true') || /sslmode=require/i.test(conn)
  const likelyRemote = host && host !== 'localhost' && host !== '127.0.0.1'
  const isSupabase = host.includes('supabase')
  if (forceOn || isSupabase || likelyRemote) {
    ssl = { rejectUnauthorized: false }
    // Help pg use relaxed SSL in dev environments
    if (!process.env.PGSSLMODE) process.env.PGSSLMODE = 'no-verify'
  }
} catch {
  // If URL parsing fails, fall back to env flags
  if ((process.env.DATABASE_SSL?.toLowerCase() === 'true') || /sslmode=require/i.test(conn)) {
    ssl = { rejectUnauthorized: false }
    if (!process.env.PGSSLMODE) process.env.PGSSLMODE = 'no-verify'
  }
}

export const pool = new Pool({
  connectionString: conn,
  ssl: ssl || undefined,
})

export async function q<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: any[],
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params)
}



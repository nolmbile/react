import { Pool } from 'pg'
import { createApp } from './app.js'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  console.error('DATABASE_URL is required to start the service.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: databaseUrl,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

let server

async function prepareDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 100),
      body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
      is_anonymous BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await pool.query(`
    CREATE INDEX IF NOT EXISTS posts_created_at_id_idx
    ON posts (created_at DESC, id DESC)
  `)
}

async function start() {
  await prepareDatabase()
  const port = Number.parseInt(process.env.PORT ?? '4173', 10)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invalid service port.')
  }

  server = createApp(pool).listen(port, '0.0.0.0', () => {
    console.log(`SSH BAND service listening on port ${port}.`)
  })
}

async function shutdown() {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }
  await pool.end()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

start().catch(async () => {
  console.error('Service startup failed. Check DATABASE_URL and database connectivity.')
  await pool.end().catch(() => {})
  process.exitCode = 1
})
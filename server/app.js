import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { validatePostInput } from './validation.js'

const DEFAULT_DIST = fileURLToPath(new URL('../dist/', import.meta.url))
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function createApp(pool, { staticRoot = DEFAULT_DIST } = {}) {
  const app = express()

  app.disable('x-powered-by')
  app.set('trust proxy', 1)
  app.use(helmet())

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 180,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: '요청이 많습니다. 잠시 후 다시 시도해 주세요.' },
  })
  const postLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: '게시글 작성이 잠시 제한되었습니다. 조금 후 다시 시도해 주세요.' },
  })

  app.use('/api', apiLimiter)
  app.use('/api', express.json({ limit: '32kb', strict: true }))

  app.get('/api/health', async (_request, response) => {
    try {
      await pool.query('SELECT 1')
      response.json({ status: 'ok', database: 'connected' })
    } catch {
      response.status(503).json({ status: 'not_ready', database: 'unavailable' })
    }
  })

  app.get('/api/posts', async (_request, response) => {
    try {
      const { rows } = await pool.query(
        `SELECT id, title, body, is_anonymous, created_at
         FROM posts
         ORDER BY created_at DESC, id DESC
         LIMIT 30`,
      )
      response.json({ posts: rows })
    } catch {
      response.status(503).json({ error: '게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' })
    }
  })

  app.get('/api/posts/:id', async (request, response) => {
    if (!UUID_PATTERN.test(request.params.id)) {
      response.status(400).json({ error: '게시글 주소가 올바르지 않습니다.' })
      return
    }

    try {
      const { rows } = await pool.query(
        `SELECT id, title, body, is_anonymous, created_at
         FROM posts
         WHERE id = $1`,
        [request.params.id],
      )
      if (!rows[0]) {
        response.status(404).json({ error: '게시글을 찾을 수 없습니다.' })
        return
      }
      response.json({ post: rows[0] })
    } catch {
      response.status(503).json({ error: '게시글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.' })
    }
  })

  app.post('/api/posts', postLimiter, async (request, response) => {
    const validation = validatePostInput(request.body)
    if (validation.error) {
      response.status(400).json({ error: validation.error })
      return
    }

    try {
      const { title, body, isAnonymous } = validation.value
      const { rows } = await pool.query(
        `INSERT INTO posts (id, title, body, is_anonymous)
         VALUES ($1, $2, $3, $4)
         RETURNING id, title, body, is_anonymous, created_at`,
        [randomUUID(), title, body, isAnonymous],
      )
      response.status(201).json({ post: rows[0] })
    } catch {
      response.status(503).json({ error: '게시글을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' })
    }
  })

  app.use('/api', (_request, response) => {
    response.status(404).json({ error: '요청한 API를 찾을 수 없습니다.' })
  })

  if (staticRoot) {
    app.use(express.static(staticRoot, { index: false }))
    app.get(/.*/, (request, response, next) => {
      if (!request.accepts('html')) {
        next()
        return
      }
      response.sendFile('index.html', { root: staticRoot }, (error) => {
        if (error) next(error)
      })
    })
  }

  app.use((error, _request, response, next) => {
    if (response.headersSent) {
      next(error)
      return
    }

    const status = error.status === 413 ? 413 : error.status === 400 ? 400 : 500
    const message = status === 413
      ? '요청 내용이 너무 큽니다.'
      : status === 400
        ? '요청 형식을 확인해 주세요.'
        : '서버에서 요청을 처리하지 못했습니다.'
    response.status(status).json({ error: message })
  })

  return app
}
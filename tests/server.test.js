import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { after, test } from 'node:test'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp } from '../server/app.js'
import { BODY_MAX_LENGTH, TITLE_MAX_LENGTH, validatePostInput } from '../server/validation.js'

const servers = new Set()

after(async () => {
  await Promise.all([...servers].map((server) => new Promise((resolve) => server.close(resolve))))
})

async function startTestServer(pool, options = { staticRoot: false }) {
  const server = createApp(pool, options).listen(0, '127.0.0.1')
  servers.add(server)
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  return `http://127.0.0.1:${server.address().port}`
}

test('post validation requires bounded title and body and defaults to anonymous', () => {
  assert.match(validatePostInput({ title: '  ', body: 'text' }).error, /제목과 본문/)
  assert.match(validatePostInput({ title: 'title', body: 'x'.repeat(BODY_MAX_LENGTH + 1) }).error, /5,000자/)
  assert.match(validatePostInput({ title: 'x'.repeat(TITLE_MAX_LENGTH + 1), body: 'body' }).error, /100자/)
  assert.deepEqual(validatePostInput({ title: '  질문  ', body: '  내용  ' }).value, {
    title: '질문',
    body: '내용',
    isAnonymous: true,
  })
})

test('health endpoint reports readiness without exposing database errors', async () => {
  const baseUrl = await startTestServer({ query: async () => { throw new Error('sensitive connection details') } })
  const response = await fetch(`${baseUrl}/api/health`)
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { status: 'not_ready', database: 'unavailable' })
})

test('post creation uses parameterized SQL and keeps HTML input as plain text data', async () => {
  let receivedQuery
  const createdAt = '2026-09-28T00:00:00.000Z'
  const pool = {
    query: async (sql, parameters) => {
      receivedQuery = { sql, parameters }
      return {
        rows: [{
          id: parameters[0],
          title: parameters[1],
          body: parameters[2],
          is_anonymous: parameters[3],
          created_at: createdAt,
        }],
      }
    },
  }
  const baseUrl = await startTestServer(pool)
  const response = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: '<script>title</script>', body: '<img src=x onerror=alert(1)>' }),
  })
  const payload = await response.json()

  assert.equal(response.status, 201)
  assert.match(receivedQuery.sql, /VALUES \(\$1, \$2, \$3, \$4\)/)
  assert.equal(receivedQuery.parameters[1], '<script>title</script>')
  assert.equal(receivedQuery.parameters[2], '<img src=x onerror=alert(1)>')
  assert.equal(payload.post.is_anonymous, true)
  assert.equal(payload.post.created_at, createdAt)
})

test('invalid identifiers are rejected before database queries', async () => {
  const baseUrl = await startTestServer({ query: async () => { throw new Error('query should not run') } })
  const response = await fetch(`${baseUrl}/api/posts/not-a-uuid`)
  assert.equal(response.status, 400)
  assert.deepEqual(await response.json(), { error: '게시글 주소가 올바르지 않습니다.' })
})

test('malformed JSON and unknown API routes receive safe responses', async () => {
  const baseUrl = await startTestServer({ query: async () => ({ rows: [] }) })
  const malformed = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  })
  assert.equal(malformed.status, 400)
  assert.deepEqual(await malformed.json(), { error: '요청 형식을 확인해 주세요.' })

  const missing = await fetch(`${baseUrl}/api/nope`)
  assert.equal(missing.status, 404)
  assert.deepEqual(await missing.json(), { error: '요청한 API를 찾을 수 없습니다.' })
})

test('request body size is bounded and anonymous posting is rate limited', async () => {
  let insertCount = 0
  const pool = {
    query: async (_sql, parameters) => {
      insertCount += 1
      return { rows: [{ id: parameters[0], title: parameters[1], body: parameters[2], is_anonymous: parameters[3] }] }
    },
  }
  const baseUrl = await startTestServer(pool)
  const oversized = await fetch(`${baseUrl}/api/posts`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ title: '질문', body: 'x'.repeat(33 * 1024) }),
  })
  assert.equal(oversized.status, 413)

  const statuses = []
  for (let index = 0; index < 6; index += 1) {
    const response = await fetch(`${baseUrl}/api/posts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: `질문 ${index}`, body: '내용' }),
    })
    statuses.push(response.status)
  }
  assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429])
  assert.equal(insertCount, 5)
})

test('serves the static landing page through the same Express app', async (context) => {
  const staticRoot = await mkdtemp(join(tmpdir(), 'ssh-band-static-'))
  context.after(() => rm(staticRoot, { recursive: true, force: true }))
  await writeFile(join(staticRoot, 'index.html'), '<!doctype html><title>SSH BAND</title>')
  const baseUrl = await startTestServer({ query: async () => ({ rows: [] }) }, { staticRoot })
  const response = await fetch(baseUrl, { headers: { accept: 'text/html' } })
  const html = await response.text()
  assert.equal(response.status, 200)
  assert.match(html, /SSH BAND/)
})
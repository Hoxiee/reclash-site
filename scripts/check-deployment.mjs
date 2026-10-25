import assert from 'node:assert/strict'
import { setTimeout } from 'node:timers/promises'

const origin = new URL(process.argv[2] || 'https://reclash.pages.dev').origin
const expectedCommit = process.env.GITHUB_SHA

async function get(path, accept = 'text/html') {
  const response = await fetch(`${origin}${path}`, {
    headers: { Accept: accept, 'Cache-Control': 'no-cache' },
    signal: AbortSignal.timeout(20_000),
  })
  return { response, body: await response.text() }
}

async function verify() {
  if (expectedCommit) {
    const { response, body } = await get(`/deployment.json?commit=${expectedCommit}`, 'application/json')
    assert.equal(response.status, 200, 'Deployment marker is unavailable')
    assert.equal(JSON.parse(body).commit, expectedCommit, 'Production has not converged to this commit')
  }
  for (const language of ['ru', 'en']) {
    const { response, body } = await get(`/${language}/rcx`)
    assert.equal(response.status, 200)
    assert.match(body, new RegExp(`<html\\b[^>]*\\blang="${language}"`))
    assert.match(body, /<h1[ >]/)
    const report = await get(`/${language}/report`)
    assert.equal(report.response.status, 200)
    assert.ok(report.response.headers.get('content-security-policy')?.includes("connect-src 'none'"))
    assert.equal(report.response.headers.get('referrer-policy'), 'no-referrer')
    assert.equal(report.response.headers.get('cache-control'), 'no-store')
  }
  const yaml = await get('/mock/ember', 'text/yaml')
  assert.equal(yaml.response.status, 200)
  assert.equal(yaml.response.headers.get('reclash-subscriptiontype'), 'test')
  assert.ok(yaml.body.startsWith('# Mock subscription: ember.'))
  const html = await get('/mock/ember')
  assert.equal(html.response.status, 200)
  assert.ok(html.response.headers.get('content-type')?.includes('text/html'))
  assert.match(html.body, /<!doctype html|<html/i)
  assert.ok(html.response.headers.get('vary')?.toLowerCase().includes('accept'), 'Pages Function is missing')
  const missing = await get('/deployment-smoke-missing-page')
  assert.equal(missing.response.status, 404)
}

for (let attempt = 1; ; attempt++) {
  try {
    await verify()
    console.log(`Verified production pages, report privacy, mock negotiation and 404 at ${origin}`)
    break
  } catch (error) {
    if (attempt === 12) throw error
    console.error(`Production check ${attempt}/12: ${error.message}`)
    await setTimeout(10_000)
  }
}

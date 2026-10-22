import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { expect, test } from 'bun:test'
import { publicDiscoveryPaths, siteDiscoveryDocuments, writeSiteDiscovery } from '../../app/Support/site-discovery'

test('discovery includes canonical public locales and omits private and result routes', () => {
  const paths = publicDiscoveryPaths()
  expect(new Set(paths).size).toBe(paths.length)
  expect(paths).toContain('/')
  expect(paths).toContain('/de/')
  expect(paths).toContain('/nl/features/automated-herding')
  expect(paths).toContain('/use-cases/vineyards')
  expect(paths).toContain('/playground/herding/rotation')
  expect(paths.filter(path => /\/(?:api|account|dashboard|login|register|booked|subscribed)(?:\/|$)|\[|\?|#/.test(path))).toEqual([])
  for (const path of paths.filter(path => !path.startsWith('/de/') && !path.startsWith('/nl/'))) {
    expect(paths).toContain(`/de${path}`)
    expect(paths).toContain(`/nl${path}`)
  }
  const docs = siteDiscoveryDocuments()
  expect(docs['sitemap.xml']).toContain('<sitemapindex')
  expect(docs['sitemap.xml']).toContain('<loc>https://openfarm.ing/docs/sitemap.xml</loc>')
  expect(docs['sitemap.xml']).toContain('<loc>https://openfarm.ing/sitemap-pages.xml</loc>')
  expect(docs['sitemap-pages.xml']).not.toContain('<lastmod>')
  expect(docs['robots.txt']).toContain('Disallow: /api/')
  expect(docs['robots.txt']).toContain('Sitemap: https://openfarm.ing/sitemap.xml')
})

test('the production stx transport serves public discovery files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'openfarming-discovery-'))
  await writeSiteDiscovery(root)
  for (const directory of ['partials', 'components', 'layouts'])
    await mkdir(join(root, directory))
  const reservation = Bun.serve({ port: 0, fetch: () => new Response('reserved') })
  const port = reservation.port
  reservation.stop(true)
  await writeFile(join(root, 'index.stx'), '<h1>Public fixture</h1>')
  await writeFile(join(root, 'health.txt'), 'ready')
  const source = `import { serve } from ${JSON.stringify(Bun.resolveSync('bun-plugin-stx/serve', process.cwd()))}; await serve({ patterns: [${JSON.stringify(join(root, 'index.stx'))}], publicDir: ${JSON.stringify(root)}, port: ${port}, autoIncrementPort: false, quiet: true });`
  const child = Bun.spawn([process.execPath, '--eval', source], { cwd: root, stdout: 'ignore', stderr: 'pipe' })
  const errors = new Response(child.stderr).text()
  try {
    const deadline = performance.now() + 10000
    while (true) {
      if (child.exitCode !== null || performance.now() > deadline)
        throw new Error(`Native stx server did not start: ${child.exitCode}`)
      try {
        const response = await fetch(`http://127.0.0.1:${port}/health.txt`, { signal: AbortSignal.timeout(1000) })
        if (await response.text() === 'ready') break
      }
      catch {}
      await Bun.sleep(25)
    }
    for (const [path, type] of [['robots.txt', 'text/plain'], ['sitemap.xml', 'application/xml'], ['sitemap-pages.xml', 'application/xml']] as const) {
      const response = await fetch(`http://127.0.0.1:${port}/${path}`, { signal: AbortSignal.timeout(5000) })
      expect(response.status).toBe(200)
      expect(response.headers.get('content-type')).toStartWith(type)
      expect(await response.text()).toBe(await readFile(join(root, path), 'utf8'))
    }
  }
  finally {
    child.kill()
    await child.exited
    const stderr = await errors
    if (stderr) console.error(stderr)
    await rm(root, { recursive: true, force: true })
  }
}, 20000)

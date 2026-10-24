import { expect, test } from 'bun:test'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

test('a cold native boot loads the complete function barrel and usable app functions', async () => {
  const root = await mkdtemp(join(tmpdir(), 'open-farming-native-functions-'))
  const stdout = join(root, 'stdout.log')
  const stderr = join(root, 'stderr.log')
  const script = `
await (await import('@stacksjs/server')).injectGlobalAutoImports()
const { handleEvents } = await import('./app/Listener.ts')
const registered = await handleEvents()
if (registered < 2 || await handleEvents() !== registered)
  throw new Error('Application listeners did not share the native boot registry')
if (typeof globalThis.increment !== 'function' || typeof globalThis.useBillable !== 'function')
  throw new Error('The complete application function barrel was not injected')
globalThis.reset()
globalThis.increment()
globalThis.increment()
const afterIncrement = globalThis.count()
globalThis.decrement()
const afterDecrement = globalThis.count()
globalThis.reset()
const afterReset = globalThis.count()
await (await import('@stacksjs/logging')).log.flush()
console.log('native-functions:' + JSON.stringify({ afterIncrement, afterDecrement, afterReset }))
process.exit(0)
`
  const child = Bun.spawn([process.execPath, '--no-env-file', '--eval', script], {
    cwd: resolve(import.meta.dir, '../..'),
    env: { ...process.env, NODE_ENV: 'test', APP_ENV: 'test' },
    stdin: 'ignore',
    stdout: Bun.file(stdout),
    stderr: Bun.file(stderr),
  })
  let timedOut = false
  const deadline = setTimeout(() => { timedOut = true; child.kill() }, 15_000)
  try {
    const code = await child.exited
    const out = await readFile(stdout, 'utf8')
    const err = await readFile(stderr, 'utf8')
    expect(timedOut, err).toBe(false)
    expect(code, err).toBe(0)
    expect(out).toContain('native-functions:{"afterIncrement":2,"afterDecrement":1,"afterReset":0}')
    expect(out + err).not.toContain('functions.ts failed to load')
  }
  finally {
    clearTimeout(deadline)
    await rm(root, { recursive: true, force: true })
  }
}, 20_000)

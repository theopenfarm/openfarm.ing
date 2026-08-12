import type { CLI } from '@stacksjs/types'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import nodePath from 'node:path'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'

/**
 * `buddy docs:screenshots` - photograph the running site for the documentation.
 *
 * The docs describe an interface, and prose alone makes a reader guess at what
 * they will actually see. These are the pictures, and they are captured rather
 * than curated so they cannot quietly drift from the product: re-run this after
 * a change to the views and the documentation is current again.
 *
 * Headless Chrome over the DevTools Protocol, not a browser-testing library:
 * the whole job is navigate, scroll, shutter, and a dependency that ships a
 * second browser to do that is a large thing to carry for eighteen images.
 *
 * It signs itself in, because half the interface is behind one. Point it at a
 * throwaway account on a development database, never at production: the
 * dashboard shots contain whatever that account can see.
 *
 *   buddy serve --port 3311            # in one terminal, with the API running
 *   buddy docs:screenshots --email demo@openfarm.ing --password '…'
 *
 * Output is WebP at 2x, which is sharp on a retina display and about 100 kB a
 * frame. They live in `docs/public/`, which bunpress copies to the site root,
 * so a page references one as `/screenshots/<name>.webp`.
 */

/** Where Chrome usually is. `--chrome` overrides it. */
const CHROME_CANDIDATES = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
]

interface Shot {
  /** File name, without the extension. */
  name: string
  path: string
  /** Pixels down the page before the shutter. Framing, not scrolling for its own sake. */
  scroll?: number
  /** Taller frame for a page whose point needs the room. */
  height?: number
  /** Needs a signed-in session. */
  auth?: boolean
}

/**
 * What the documentation shows, in the order the interface is met.
 *
 * Adding a page here is what puts it in the docs: the file lands in
 * `docs/public/screenshots/` and a page references it. Nothing scans this list
 * to generate markdown, because a caption is worth writing by hand.
 */
const SHOTS: Shot[] = [
  { name: 'home', path: '/' },
  { name: 'home-proof', path: '/', scroll: 900 },
  { name: 'features', path: '/features' },
  { name: 'feature-detail', path: '/features/targeted-weed-control' },
  { name: 'feature-detail-steps', path: '/features/targeted-weed-control', scroll: 850 },
  { name: 'use-cases', path: '/use-cases' },
  { name: 'use-case-detail', path: '/use-cases/vineyards' },
  { name: 'use-case-season', path: '/use-cases/vineyards', scroll: 850 },
  { name: 'field-report', path: '/field-report' },
  { name: 'field-report-map', path: '/field-report', scroll: 620 },
  { name: 'field-report-findings', path: '/field-report', scroll: 1750 },
  { name: 'how-it-works', path: '/how-it-works' },
  { name: 'pricing', path: '/pricing' },
  { name: 'contact', path: '/contact' },
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/dashboard', auth: true },
  { name: 'dashboard-capabilities', path: '/dashboard/capabilities', auth: true },
  { name: 'dashboard-flights', path: '/dashboard/flights', auth: true },
  { name: 'dashboard-detections', path: '/dashboard/detections', auth: true },
  { name: 'account', path: '/account', auth: true },
]

interface Options {
  base?: string
  out?: string
  email?: string
  password?: string
  chrome?: string
  width?: number
  height?: number
}

export default function (cli: CLI) {
  cli
    .command('docs:screenshots', 'Photograph the running site for the documentation')
    .option('--base <url>', 'Where the site is serving', { default: 'http://localhost:3311' })
    .option('--out <dir>', 'Where the images land', { default: 'docs/public/screenshots' })
    .option('--email <address>', 'Account for the signed-in pages', { default: 'demo@openfarm.ing' })
    .option('--password <password>', 'Its password')
    .option('--chrome <path>', 'Chrome binary, when it is not where it usually is')
    .option('--width <px>', 'Viewport width', { default: 1280 })
    .option('--height <px>', 'Viewport height', { default: 800 })
    .example('buddy docs:screenshots --password "…"')
    .action(async (options?: Options) => {
      try {
        const written = await capture(options ?? {})
        log.success(`Captured ${written} screenshots.`)
      }
      catch (error) {
        log.error(`Could not capture the screenshots: ${error instanceof Error ? error.message : String(error)}`)
        await log.flush()
        process.exit(ExitCode.FatalError)
      }

      await log.flush()
      process.exit(ExitCode.Success)
    })
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * A DevTools Protocol connection.
 *
 * Every request carries a timeout. Without one a command that never answers -
 * and there are several, `Runtime.evaluate` on a promise that never settles
 * being the one that bit - hangs the whole run with no output and no error.
 */
class Devtools {
  private nextId = 0
  private closed = false
  private readonly pending = new Map<number, (result: any) => void>()

  private constructor(private readonly socket: WebSocket) {}

  static async connect(url: string): Promise<Devtools> {
    const socket = new WebSocket(url)

    await new Promise<void>((resolve, reject) => {
      socket.onopen = () => resolve()
      socket.onerror = () => reject(new Error(`Could not open a DevTools connection at ${url}`))
    })

    const devtools = new Devtools(socket)

    // A closed socket has to be an error rather than silence. Every request
    // carries a timeout, so without this a browser that has gone away turns
    // into one slow timeout per command and a run that looks like it is still
    // working when it has not sent a byte in minutes.
    socket.onclose = () => {
      devtools.closed = true
      for (const [id, resolve] of devtools.pending) {
        devtools.pending.delete(id)
        resolve({})
      }
    }

    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data)) as { id?: number, result?: unknown }
      if (message.id == null)
        return

      const resolve = devtools.pending.get(message.id)
      if (resolve) {
        devtools.pending.delete(message.id)
        resolve(message.result ?? {})
      }
    }

    return devtools
  }

  get isClosed(): boolean {
    return this.closed
  }

  async send(method: string, params: Record<string, unknown> = {}, sessionId?: string, timeoutMs = 10000): Promise<any> {
    if (this.closed)
      throw new Error('The browser closed its DevTools connection')

    const id = ++this.nextId
    this.socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))

    return await new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pending.delete(id)
        resolve({})
      }, timeoutMs)

      this.pending.set(id, (result) => {
        clearTimeout(timer)
        resolve(result)
      })
    })
  }

  close(): void {
    this.closed = true
    this.socket.close()
  }
}

/**
 * Sign in and keep the cookies.
 *
 * The form answers a browser with a 303 and a session cookie, so the request
 * asks for HTML and refuses to follow the redirect: the cookie is on the 303
 * itself.
 */
async function signIn(base: string, email: string, password: string): Promise<{ name: string, value: string }[]> {
  const response = await fetch(`${base}/api/auth/sign-in`, {
    method: 'POST',
    redirect: 'manual',
    headers: { 'Accept': 'text/html', 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email, password }).toString(),
  })

  const cookies = response.headers.getSetCookie()
  if (cookies.length === 0)
    throw new Error(`${email} could not sign in at ${base}. Create the account first: buddy user:add ${email} --password '…' && buddy demo:account ${email}`)

  return cookies.map((cookie) => {
    const [pair] = cookie.split(';')
    const index = (pair ?? '').indexOf('=')
    return { name: (pair ?? '').slice(0, index), value: (pair ?? '').slice(index + 1) }
  }).filter(cookie => cookie.name.length > 0)
}

/** Wait for the document to finish, but never forever. */
async function settled(devtools: Devtools, sessionId: string): Promise<void> {
  for (let attempt = 0; attempt < 24; attempt++) {
    const { result } = await devtools.send('Runtime.evaluate', {
      expression: 'document.readyState',
      returnByValue: true,
    }, sessionId, 5000)

    if (result?.value === 'complete')
      return

    await sleep(250)
  }
}

/**
 * One page, in its own tab.
 *
 * A tab per shot rather than one tab walked through twenty navigations: a
 * long-lived headless target wedged partway through the set, and after that
 * every command on it timed out. A fresh target costs a few milliseconds and
 * bounds the damage to the frame that went wrong.
 */
async function photograph(devtools: Devtools, shot: Shot, context: { base: string, host: string, width: number, height: number, cookies: { name: string, value: string }[] }): Promise<string> {
  const { targetId } = await devtools.send('Target.createTarget', { url: 'about:blank' })
  if (!targetId)
    throw new Error('The browser would not open a tab')

  try {
    const { sessionId } = await devtools.send('Target.attachToTarget', { targetId, flatten: true })
    if (!sessionId)
      throw new Error('The browser would not attach to its own tab')

    await devtools.send('Page.enable', {}, sessionId)
    await devtools.send('Network.enable', {}, sessionId)

    for (const cookie of context.cookies)
      await devtools.send('Network.setCookie', { name: cookie.name, value: cookie.value, domain: context.host, path: '/' }, sessionId)

    await devtools.send('Emulation.setDeviceMetricsOverride', {
      width: context.width,
      height: shot.height ?? context.height,
      deviceScaleFactor: 2,
      mobile: false,
    }, sessionId)

    await devtools.send('Page.navigate', { url: `${context.base}${shot.path}` }, sessionId)
    await settled(devtools, sessionId)

    if (shot.scroll)
      await devtools.send('Runtime.evaluate', { expression: `window.scrollTo(0, ${shot.scroll})` }, sessionId, 5000)

    // Fonts, images and the theme's first paint. Short, and the difference
    // between a finished page and one caught mid-swap.
    await sleep(600)

    const { data } = await devtools.send('Page.captureScreenshot', { format: 'webp', quality: 88 }, sessionId, 30000)
    return String(data ?? '')
  }
  finally {
    await devtools.send('Target.closeTarget', { targetId }, undefined, 5000).catch(() => {})
  }
}

async function capture(options: Options): Promise<number> {
  const base = String(options.base ?? 'http://localhost:3311').replace(/\/+$/, '')
  const out = String(options.out ?? 'docs/public/screenshots')
  const width = Number(options.width ?? 1280)
  const height = Number(options.height ?? 800)

  const binary = options.chrome ?? CHROME_CANDIDATES.find(candidate => existsSync(candidate))
  if (!binary)
    throw new Error(`No Chrome found. Pass --chrome <path>. Looked in: ${CHROME_CANDIDATES.join(', ')}`)

  const reachable = await fetch(base).then(response => response.ok).catch(() => false)
  if (!reachable)
    throw new Error(`Nothing is serving at ${base}. Start it first: buddy serve --port ${new URL(base).port || 80}`)

  const password = options.password
  const cookies = password
    ? await signIn(base, String(options.email ?? 'demo@openfarm.ing'), String(password))
    : []

  if (cookies.length === 0)
    log.info('No --password given, so the signed-in pages are skipped.')

  const port = 9333
  const chrome = Bun.spawn([
    binary,
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${nodePath.join(process.env.TMPDIR ?? '/tmp', 'openfarming-screenshots')}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    'about:blank',
  ], { stdout: 'ignore', stderr: 'ignore' })

  try {
    let endpoint = ''
    for (let attempt = 0; attempt < 60 && !endpoint; attempt++) {
      endpoint = await fetch(`http://127.0.0.1:${port}/json/version`)
        .then(response => response.json() as Promise<{ webSocketDebuggerUrl?: string }>)
        .then(body => body.webSocketDebuggerUrl ?? '')
        .catch(() => '')

      if (!endpoint)
        await sleep(250)
    }

    if (!endpoint)
      throw new Error('Chrome started but never exposed a DevTools endpoint')

    const devtools = await Devtools.connect(endpoint)
    const context = { base, host: new URL(base).hostname, width, height, cookies }

    await mkdir(out, { recursive: true })

    let written = 0
    for (const shot of SHOTS) {
      if (shot.auth && cookies.length === 0)
        continue

      const data = await photograph(devtools, shot, context)
      if (!data) {
        log.warn(`No frame came back for ${shot.name}; skipped.`)
        continue
      }

      await writeFile(nodePath.join(out, `${shot.name}.webp`), Buffer.from(data, 'base64'))
      log.info(`${shot.name}.webp`)
      written++
    }

    devtools.close()
    return written
  }
  finally {
    chrome.kill()
  }
}

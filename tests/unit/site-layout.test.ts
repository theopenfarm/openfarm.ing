import { expect, spyOn, test } from 'bun:test'
import { resolve } from 'node:path'
import { renderTemplate, renderTemplateString } from '@stacksjs/stx/render'

const layout = resolve('resources/views/layouts/site.stx')
const options = {
  partialsDir: resolve('resources/partials'),
  layoutsDir: resolve('resources/views/layouts'),
}

async function renderLayout(context: Record<string, unknown> = {}) {
  const warnings = spyOn(console, 'warn')
  try {
    const html = await renderTemplate(layout, { context, options, processClientScripts: false, templateOnly: true })
    expect(warnings.mock.calls.flat().filter(value => String(value).includes('[stx] server <script>'))).toEqual([])
    return html
  }
  finally { warnings.mockRestore() }
}

test('the warning observer sees a genuine native server-script failure', async () => {
  const warnings = spyOn(console, 'warn')
  try {
    await renderTemplateString('<script server>throw new Error("native layout warning positive control")</script><p>control</p>', resolve('resources/views/layout-warning-control.stx'), { options, processClientScripts: false, templateOnly: true })
    expect(warnings.mock.calls.flat().some(value => String(value).includes('native layout warning positive control'))).toBe(true)
  }
  finally { warnings.mockRestore() }
})

test('the actual site layout keeps page metadata and active navigation', async () => {
  const html = await renderLayout({ title: 'Test capability', description: 'Test description', pagePath: '/features/targeted-weed-control', activeNav: 'features' })
  expect(html).toContain('<title>Test capability</title>')
  expect(html).toContain('href="https://openfarm.ing/{t:og.localePrefix}features/targeted-weed-control"')
  expect(html).toContain('content="https://openfarm.ing/images/og/{t:og.localePrefix}features/targeted-weed-control.jpg"')
  expect(html).toContain('hreflang="de" href="https://openfarm.ing/de/features/targeted-weed-control"')
  expect(html).toMatch(/href="\/features"[^>]*aria-current="page"/)
})

test('the actual site layout supplies homepage defaults when a page has no metadata', async () => {
  const html = await renderLayout()
  expect(html).toContain('<title>Open Farming</title>')
  expect(html).toContain('href="https://openfarm.ing/{t:og.localePrefix}"')
  expect(html).toContain('content="https://openfarm.ing/images/og/{t:og.localePrefix}home.jpg"')
  expect(html).not.toContain('aria-current="page"')
})

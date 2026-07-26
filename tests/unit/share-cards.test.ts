import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, test } from 'bun:test'
import { features } from '../../app/Support/content/features'
import { useCases } from '../../app/Support/content/use-cases'

/**
 * Every page has a share card, in every locale.
 *
 * A missing card does not throw and does not fail a build: it produces a link
 * that unfurls with no image in iMessage, WhatsApp, Slack and everywhere else,
 * which is the kind of thing nobody notices until somebody shares the page.
 * The layout derives a card path from the URL, so this walks the same rule.
 */
const LOCALES = ['en', 'de', 'nl'] as const

/** Pages whose card is named differently, via the layout's `ogCard`. */
const OVERRIDES: Record<string, string> = {
  '/login': 'account',
  '/register': 'account',
  '/account': 'account',
  '/dashboard': 'account',
}

const PAGES = [
  '/',
  '/features',
  '/use-cases',
  '/how-it-works',
  '/pricing',
  '/contact',
  '/field-report',
  '/login',
  '/register',
  '/account',
  '/dashboard',
  ...features.map(feature => `/features/${feature.slug}`),
  ...useCases.map(useCase => `/use-cases/${useCase.slug}`),
]

/** The layout's rule: the URL path, or `home` for the root. */
function cardSlug(path: string): string {
  return OVERRIDES[path] ?? (path.split('/').filter(Boolean).join('/') || 'home')
}

describe('share cards', () => {
  test('every page has a card in every locale', () => {
    const root = process.cwd()
    const missing: string[] = []

    for (const locale of LOCALES) {
      // English sits at the root so its paths mirror the URLs; the others are
      // nested under their locale, exactly as the pages are.
      const prefix = locale === 'en' ? '' : `${locale}/`

      for (const page of PAGES) {
        const file = join(root, 'public/images/og', `${prefix}${cardSlug(page)}.jpg`)
        if (!existsSync(file))
          missing.push(`${locale}${page}`)
      }
    }

    expect(missing).toEqual([])
  })

  test('the home-screen icons exist', () => {
    // iOS squashes a wide share card into a square, so these are drawn square
    // by `buddy og:generate` rather than reusing one.
    expect(existsSync(join(process.cwd(), 'public/apple-touch-icon.png'))).toBe(true)
    expect(existsSync(join(process.cwd(), 'public/icon-512.png'))).toBe(true)
  })

  test('the layout gives a crawler everything it needs', async () => {
    const layout = await Bun.file(join(process.cwd(), 'resources/views/layouts/site.stx')).text()

    // A card with no dimensions is a card some crawlers will not render, and
    // `summary` instead of `summary_large_image` is a thumbnail rather than a
    // card. Both have been broken here before.
    for (const tag of ['og:title', 'og:description', 'og:image', 'og:image:width', 'og:image:height', 'og:url', 'twitter:image'])
      expect({ tag, present: layout.includes(tag) }).toEqual({ tag, present: true })

    expect(layout).toContain('content="summary_large_image"')
    // The locale travels through the translation pass; hardcoding it sent
    // German links out labelled as English.
    expect(layout).toContain('{t:og.localePrefix}')
    expect(layout).toContain('{t:og.locale}')
  })
})

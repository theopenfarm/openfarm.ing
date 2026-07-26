import { describe, expect, test } from 'bun:test'
import {
  DEMO_FIELD,
  demoDetections,
  demoTreatedHectares,
  demoZones,
} from '../../app/Support/content/demo-field'
import { featureCategories, features } from '../../app/Support/content/features'
import { useCaseSegments, useCases } from '../../app/Support/content/use-cases'
import { wantsHtml } from '../../app/Support/formResponse'

describe('capability catalog', () => {
  test('every feature references use cases that exist', () => {
    const slugs = new Set(useCases.map(u => u.slug))
    for (const feature of features) {
      for (const slug of feature.useCases)
        expect({ feature: feature.slug, references: slug, exists: slugs.has(slug) }).toEqual({ feature: feature.slug, references: slug, exists: true })
    }
  })

  test('every use case references features that exist', () => {
    const slugs = new Set(features.map(f => f.slug))
    for (const useCase of useCases) {
      for (const slug of useCase.features)
        expect({ useCase: useCase.slug, references: slug, exists: slugs.has(slug) }).toEqual({ useCase: useCase.slug, references: slug, exists: true })
    }
  })

  test('slugs are unique, because they are the URLs', () => {
    expect(new Set(features.map(f => f.slug)).size).toBe(features.length)
    expect(new Set(useCases.map(u => u.slug)).size).toBe(useCases.length)
  })

  test('every category and segment used has a label', () => {
    for (const feature of features)
      expect(featureCategories[feature.category]).toBeDefined()

    for (const useCase of useCases)
      expect(useCaseSegments[useCase.segment]).toBeDefined()
  })

  test('no em-dashes reach a visitor', () => {
    // The single most common AI design tell, and a house rule. Checked here
    // rather than by eye because the copy is long and edited often.
    const copy = [
      ...features.flatMap(f => [f.name, f.tagline, f.summary, f.problem, f.cadence, ...f.sensors, ...f.outputs, ...f.readings, ...f.steps.flatMap(s => [s.title, s.text])]),
      ...useCases.flatMap(u => [u.name, u.tagline, u.summary, u.challenge, u.approach, u.scale, ...u.outcomes, ...u.season.flatMap(s => [s.window, s.focus])]),
    ]

    const offenders = copy.filter(text => text.includes('—') || text.includes('–'))
    expect(offenders).toEqual([])
  })
})

describe('demonstration field', () => {
  test('generates the same dataset every time', () => {
    // The figures are quoted in the site copy, so a change here would silently
    // make the pages lie.
    const first = demoDetections()
    const second = demoDetections()
    expect(second).toEqual(first)
  })

  test('produces the numbers the copy quotes', () => {
    const detections = demoDetections()
    const zones = demoZones(detections)

    expect(detections.length).toBe(98)
    expect(zones.length).toBe(62)
    expect(demoTreatedHectares(zones)).toBe(4.34)
    expect(DEMO_FIELD.hectares).toBe(24.6)
  })

  test('treats a minority of the field, which is the whole argument', () => {
    const treated = demoTreatedHectares()
    expect(treated).toBeLessThan(DEMO_FIELD.hectares / 2)
  })

  test('every detection sits inside the drawable field space', () => {
    for (const d of demoDetections()) {
      expect(d.x).toBeGreaterThanOrEqual(0)
      expect(d.x).toBeLessThanOrEqual(1)
      expect(d.y).toBeGreaterThanOrEqual(0)
      expect(d.y).toBeLessThanOrEqual(1)
      expect(d.confidence).toBeGreaterThan(0)
      expect(d.confidence).toBeLessThanOrEqual(1)
    }
  })
})

describe('form response negotiation', () => {
  test('a browser form post wants a page', () => {
    expect(wantsHtml({ header: () => 'text/html,application/xhtml+xml,*/*;q=0.8' })).toBe(true)
  })

  test('a fetch caller wants JSON', () => {
    expect(wantsHtml({ header: () => 'application/json' })).toBe(false)
    expect(wantsHtml({ header: () => undefined })).toBe(false)
    expect(wantsHtml({})).toBe(false)
  })

  test('reads the header off a bare Request too', () => {
    const request = new Request('https://openfarm.ing/api/demo-requests', { headers: { accept: 'text/html' } })
    expect(wantsHtml(request)).toBe(true)
  })
})

describe('translations', () => {
  const locales = ['en', 'de', 'nl'] as const

  const flatten = (value: Record<string, unknown>, prefix = ''): string[] =>
    Object.entries(value).flatMap(([key, child]) =>
      child !== null && typeof child === 'object'
        ? flatten(child as Record<string, unknown>, `${prefix}${key}.`)
        : [`${prefix}${key}`])

  const load = (locale: string) =>
    // eslint-disable-next-line ts/no-require-imports
    require(`../../resources/translations/${locale}.json`) as Record<string, unknown>

  test('every locale carries exactly the same keys', () => {
    // A missing key does not throw, it renders the raw `{t:...}` token to a
    // visitor, so the only way to catch it is to compare the sets.
    const english = flatten(load('en')).sort()

    for (const locale of locales)
      expect({ locale, keys: flatten(load(locale)).sort() }).toEqual({ locale, keys: english })
  })

  test('nothing is left untranslated by accident', () => {
    const english = load('en') as Record<string, Record<string, string>>

    for (const locale of locales.filter(l => l !== 'en')) {
      const translated = load(locale) as Record<string, Record<string, string>>
      // Words that are genuinely identical in the target language, not
      // oversights: the brand name, and "Contact", which is the same in Dutch.
      const allowed = new Set(['nav.home', 'footer.contact'])
      const untranslated = flatten(english)
        .filter(key => !allowed.has(key))
        .filter((key) => {
          const [group, leaf] = key.split('.') as [string, string]
          return english[group]?.[leaf] === translated[group]?.[leaf]
        })

      expect({ locale, untranslated }).toEqual({ locale, untranslated: [] })
    }
  })
})

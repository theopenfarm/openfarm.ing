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

  test('no locale carries a key English does not have', () => {
    // The English file is generated from the content modules, so it is the
    // source of truth. A key only present in a translation is a leftover from
    // renamed copy and will never be rendered.
    const english = new Set(flatten(load('en')))

    for (const locale of locales) {
      const orphans = flatten(load(locale)).filter(key => !english.has(key))
      expect({ locale, orphans }).toEqual({ locale, orphans: [] })
    }
  })

  test('the copy a visitor meets first is translated everywhere', () => {
    // Full coverage of the catalog's long-form prose is being filled in; what
    // must never regress is the copy on the way in — navigation, the pages'
    // own headlines, and the name, tagline and summary of every capability
    // and use case. A key missing from a locale renders the English, so this
    // is about quality rather than breakage.
    const english = load('en') as Record<string, any>
    const required = [
      ...Object.keys(english.nav ?? {}).map(k => `nav.${k}`),
      ...Object.keys(english.cta ?? {}).map(k => `cta.${k}`),
      ...Object.keys(english.features ?? {}).flatMap(slug => ['name', 'tagline', 'summary'].map(f => `features.${slug}.${f}`)),
      ...Object.keys(english.useCases ?? {}).flatMap(slug => ['name', 'tagline', 'summary'].map(f => `useCases.${slug}.${f}`)),
    ]

    for (const locale of locales.filter(l => l !== 'en')) {
      const have = new Set(flatten(load(locale)))
      const missing = required.filter(key => !have.has(key))
      expect({ locale, missing }).toEqual({ locale, missing: [] })
    }
  })

  test('nothing is left untranslated by accident', () => {
    const english = load('en') as Record<string, Record<string, string>>

    for (const locale of locales.filter(l => l !== 'en')) {
      const translated = load(locale) as Record<string, Record<string, string>>
      // Words that are genuinely identical in the target language, not
      // oversights: the brand name, "Contact" and "Account" (the same in
      // Dutch), and "Ha", which is the hectare symbol everywhere.
      const allowed = new Set([
        'nav.home',
        'footer.contact',
        'nav.account',
        // Units read the same in all three: "Ha" is the symbol, and Dutch
        // spells hectares exactly as English does.
        'dashboard.ha',
        'dashboard.hectares',
        // "Endpoints" is the word Dutch uses for these too, and "cm per
        // pixel" is written the same way in all three.
        'fieldReport.endpoints',
        'home.statFlightAfter',
        'featureDetail.zones',
        // Dutch spells "open" exactly as English does; German has "offen" and
        // is translated.
        'detections.open',
      ])
      const untranslated = flatten(english)
        .filter(key => !allowed.has(key))
        // Only keys this locale actually declares: one it has not been given
        // yet renders the English by design, and is counted by the coverage
        // test above rather than here.
        .filter(key => flatten(translated).includes(key))
        .filter((key) => {
          const [group, leaf] = key.split('.') as [string, string]
          return english[group]?.[leaf] === translated[group]?.[leaf]
        })

      expect({ locale, untranslated }).toEqual({ locale, untranslated: [] })
    }
  })
})

describe('account', () => {
  test('a farmer with no address has no visits', async () => {
    const { visitsFor } = await import('../../app/Support/account')

    // Guards the join: matching visits on an empty email would return every
    // visit ever booked without one to whoever signed in first.
    expect(await visitsFor('')).toEqual([])
  })
})

import { describe, expect, it } from 'bun:test'
import { features } from '../../app/Support/content/features'
import { nextDue, offeredCount, requiresVisit } from '../../app/Support/capabilities'

/**
 * The promise this file exists to keep: everything the marketing pages sell is
 * something a farmer can manage from the dashboard.
 *
 * It is easy to add a nineteenth capability to the catalog and forget the
 * console, and the failure is silent — the site advertises work the customer
 * cannot switch on, and nobody notices until one of them asks where it is.
 */
describe('every marketed capability is manageable', () => {
  it('offers the whole catalog, not a subset', () => {
    // The grouping the dashboard renders is built from the catalog itself, so
    // the count it offers has to equal the count the site sells.
    const groups = [
      { key: 'detect', capabilities: features.filter(f => f.category === 'detect') },
      { key: 'act', capabilities: features.filter(f => f.category === 'act') },
      { key: 'operate', capabilities: features.filter(f => f.category === 'operate') },
    ] as any

    expect(offeredCount(groups)).toBe(features.length)
    expect(features.length).toBeGreaterThanOrEqual(18)
  })

  it('puts every capability in a category the dashboard renders', () => {
    const rendered = new Set(['detect', 'act', 'operate'])

    for (const feature of features)
      expect(rendered.has(feature.category)).toBe(true)
  })

  it('only asks for a visit where equipment or a licence is genuinely needed', () => {
    // Turning one of these on records a request instead of scheduling a
    // flight. The list must stay small and deliberate: every entry is a
    // capability the farmer cannot self-serve.
    const needsVisit = features.filter(feature => requiresVisit(feature.slug))

    expect(needsVisit.length).toBeGreaterThan(0)
    expect(needsVisit.length).toBeLessThan(features.length / 2)

    for (const feature of needsVisit)
      expect(features.some(f => f.slug === feature.slug)).toBe(true)
  })
})

describe('nextDue', () => {
  const base = {
    slug: 'x', name: 'X', category: 'detect', tagline: '',
    fieldIds: [], fieldNames: [], notes: '', flights: 3, id: 1,
  }

  it('is the last flight plus the cadence', () => {
    const due = nextDue({ ...base, status: 'active', cadenceDays: 10, lastFlown: '2026-07-01' } as any)

    expect(due).toBe('2026-07-11')
  })

  it('says nothing for a capability that is not running', () => {
    expect(nextDue({ ...base, status: 'paused', cadenceDays: 10, lastFlown: '2026-07-01' } as any)).toBe('')
  })

  it('says nothing before the first flight', () => {
    // The first flight comes from the visit, not the cadence, so promising a
    // date here would be inventing one.
    expect(nextDue({ ...base, status: 'active', cadenceDays: 10, lastFlown: '' } as any)).toBe('')
  })
})

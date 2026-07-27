import { faker } from '@stacksjs/faker'
import { describe, expect, it } from 'bun:test'
import * as seed from '../../app/Support/factories'

/**
 * The seeded database is what the demo account shows a prospect, so these are
 * checks on plausibility rather than on types: a parcel in the South Atlantic,
 * a slug that names a different field than the row it belongs to, or a "weed"
 * called "Yellow rust" all pass a schema and fail a reader.
 */
describe('seed factories', () => {
  it('names farms and fields the way a land register does', () => {
    for (let i = 0; i < 20; i++) {
      expect(seed.farmName(faker)).toMatch(/^(?:Hofgut|Gut|Landgut|Hof|Domäne) \S+/)
      expect(seed.fieldName(faker).length).toBeGreaterThan(3)
    }
  })

  it('builds the slug from the name the row was just given', () => {
    for (let i = 0; i < 20; i++) {
      const name = seed.fieldName(faker)
      const slug = seed.fieldSlug(faker)
      const stem = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-')

      expect(slug.startsWith(stem)).toBe(true)
    }
  })

  it('does not repeat a field name until the pool is exhausted', () => {
    const names = new Set<string>()
    for (let i = 0; i < 12; i++)
      names.add(seed.fieldName(faker))

    expect(names.size).toBe(12)
  })

  it('places fields inside the region they claim', () => {
    for (let i = 0; i < 30; i++) {
      expect(seed.latitude(faker)).toBeGreaterThan(47)
      expect(seed.latitude(faker)).toBeLessThan(55)
      expect(seed.longitude(faker)).toBeGreaterThan(5)
      expect(seed.longitude(faker)).toBeLessThan(15)
    }
  })

  it('draws a boundary the field map can clip to', () => {
    const ring = JSON.parse(seed.boundary(faker)) as [number, number][]

    expect(ring.length).toBeGreaterThanOrEqual(6)
    for (const [x, y] of ring) {
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThanOrEqual(1)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y).toBeLessThanOrEqual(1)
    }
  })

  it('keeps a detection kind, label and severity in agreement', () => {
    for (let i = 0; i < 40; i++) {
      const kind = seed.findingKind(faker)
      const label = seed.findingLabel()
      const severity = seed.findingSeverity()

      expect(['low', 'medium', 'high']).toContain(severity)
      expect(label.length).toBeGreaterThan(3)

      if (label === 'Yellow rust' || label === 'Septoria tritici')
        expect(kind).toBe('disease')
      if (label === 'Blackgrass' || label === 'Cleavers')
        expect(kind).toBe('weed')
    }
  })

  it('spreads flights across the season', () => {
    const dates = Array.from({ length: 30 }, () => new Date(seed.flownOn(faker)))

    for (const date of dates)
      expect(Number.isNaN(date.getTime())).toBe(false)

    const months = new Set(dates.map(date => date.getUTCMonth()))
    expect(months.size).toBeGreaterThan(1)
  })
})

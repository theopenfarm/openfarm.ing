import type { FeatureCategory, FeatureContent, FeatureStep } from './content/features'
import type { SeasonStage, UseCaseContent, UseCaseSegment } from './content/use-cases'
import { featureCategories, features as authoredFeatures } from './content/features'
import { useCaseSegments, useCases as authoredUseCases } from './content/use-cases'
import { safeRead } from './db'

/**
 * The read layer the marketing views and the API actions share.
 *
 * Reads come from the seeded database so the site and `/api/features` cannot
 * disagree, and fall back to the authored content modules when the database
 * is missing or unseeded. A marketing page has no business 500ing at a
 * visitor because nobody ran `buddy migrate` on the box.
 */

export type { FeatureCategory, FeatureContent, FeatureStep, SeasonStage, UseCaseContent, UseCaseSegment }
export { featureCategories, useCaseSegments }

/** JSON columns come back as strings; a malformed one must not take a page down. */
function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value.length === 0)
    return fallback

  try {
    return JSON.parse(value) as T
  }
  catch {
    return fallback
  }
}

interface FeatureRow {
  slug: string
  name: string
  category: string
  tagline: string
  summary: string
  problem: string
  steps: string
  sensors: string
  outputs: string
  readings: string
  cadence: string
  use_case_slugs: string
  sort_order: number
}

function toFeature(row: FeatureRow): FeatureContent {
  return {
    slug: row.slug,
    name: row.name,
    category: row.category as FeatureCategory,
    tagline: row.tagline,
    summary: row.summary,
    problem: row.problem,
    steps: parseJson<FeatureStep[]>(row.steps, []),
    sensors: parseJson<string[]>(row.sensors, []),
    outputs: parseJson<string[]>(row.outputs, []),
    readings: parseJson<string[]>(row.readings, []),
    cadence: row.cadence ?? '',
    useCases: parseJson<string[]>(row.use_case_slugs, []),
    order: row.sort_order ?? 0,
  }
}

interface UseCaseRow {
  slug: string
  name: string
  segment: string
  tagline: string
  summary: string
  challenge: string
  approach: string
  season: string
  feature_slugs: string
  outcomes: string
  scale: string
  sort_order: number
}

function toUseCase(row: UseCaseRow): UseCaseContent {
  return {
    slug: row.slug,
    name: row.name,
    segment: row.segment as UseCaseSegment,
    tagline: row.tagline,
    summary: row.summary,
    challenge: row.challenge,
    approach: row.approach,
    season: parseJson<SeasonStage[]>(row.season, []),
    features: parseJson<string[]>(row.feature_slugs, []),
    outcomes: parseJson<string[]>(row.outcomes, []),
    scale: row.scale ?? '',
    order: row.sort_order ?? 0,
  }
}

export function allFeatures(): FeatureContent[] {
  const rows = safeRead<FeatureRow[]>(
    db => db.query('SELECT * FROM features ORDER BY category, sort_order').all() as FeatureRow[],
    [],
  )

  if (rows.length === 0)
    return [...authoredFeatures]

  return rows.map(toFeature)
}

export function allUseCases(): UseCaseContent[] {
  const rows = safeRead<UseCaseRow[]>(
    db => db.query('SELECT * FROM use_cases ORDER BY segment, sort_order').all() as UseCaseRow[],
    [],
  )

  if (rows.length === 0)
    return [...authoredUseCases]

  return rows.map(toUseCase)
}

export function findFeature(slug: string): FeatureContent | undefined {
  return allFeatures().find(f => f.slug === slug)
}

export function findUseCase(slug: string): UseCaseContent | undefined {
  return allUseCases().find(u => u.slug === slug)
}

/** Features grouped in menu order: detect, then act, then operate. */
export function featureGroups(): { key: FeatureCategory, label: string, blurb: string, items: FeatureContent[] }[] {
  const all = allFeatures()
  return (['detect', 'act', 'operate'] as FeatureCategory[]).map(key => ({
    key,
    label: featureCategories[key].label,
    blurb: featureCategories[key].blurb,
    items: all.filter(f => f.category === key).sort((a, b) => a.order - b.order),
  }))
}

export function useCaseGroups(): { key: UseCaseSegment, label: string, blurb: string, items: UseCaseContent[] }[] {
  const all = allUseCases()
  return (['arable', 'permanent', 'protected', 'livestock', 'operator'] as UseCaseSegment[]).map(key => ({
    key,
    label: useCaseSegments[key].label,
    blurb: useCaseSegments[key].blurb,
    items: all.filter(u => u.segment === key).sort((a, b) => a.order - b.order),
  }))
}

/**
 * The demonstration field, as the site shows it.
 *
 * Everything here is one flight's real output. `sample: true` travels with it
 * so a caller cannot render these numbers without knowing they are modelled.
 */
export interface FieldReport {
  sample: true
  farm: string
  region: string
  field: string
  crop: string
  hectares: number
  flownAt: string
  resolutionCm: number
  durationMinutes: number
  detections: { kind: string, label: string, x: number, y: number, area_m2: number, severity: string, confidence: number }[]
  zones: { x: number, y: number, w: number, h: number, rate: number }[]
  boundary: [number, number][]
  treatedHectares: number
  /** Share of the field the prescription switches the boom on for, 0..100. */
  treatedPercent: number
  speciesBreakdown: { label: string, count: number }[]
}

export function fieldReport(): FieldReport | null {
  return safeRead<FieldReport | null>((db) => {
    const field = db.query(`
      SELECT f.name AS field, f.crop, f.hectares, f.boundary, fa.name AS farm, fa.region
      FROM fields f JOIN farms fa ON fa.id = f.farm_id
      ORDER BY f.id LIMIT 1
    `).get() as { field: string, crop: string, hectares: number, boundary: string, farm: string, region: string } | null

    if (!field)
      return null

    const mission = db.query(`
      SELECT id, flown_at, resolution_cm, duration_minutes FROM missions ORDER BY id LIMIT 1
    `).get() as { id: number, flown_at: string, resolution_cm: number, duration_minutes: number } | null

    if (!mission)
      return null

    const detections = db.query(`
      SELECT kind, label, x, y, area_m2, severity, confidence
      FROM detections WHERE mission_id = ? ORDER BY id
    `).all(mission.id) as FieldReport['detections']

    const map = db.query(`
      SELECT zones, treated_hectares FROM treatment_maps WHERE mission_id = ? LIMIT 1
    `).get(mission.id) as { zones: string, treated_hectares: number } | null

    const counts = new Map<string, number>()
    for (const d of detections) counts.set(d.label, (counts.get(d.label) ?? 0) + 1)

    const treated = map?.treated_hectares ?? 0

    return {
      sample: true,
      farm: field.farm,
      region: field.region,
      field: field.field,
      crop: field.crop,
      hectares: field.hectares,
      flownAt: mission.flown_at,
      resolutionCm: mission.resolution_cm,
      durationMinutes: mission.duration_minutes,
      detections,
      zones: parseJson<FieldReport['zones']>(map?.zones, []),
      boundary: parseJson<[number, number][]>(field.boundary, []),
      treatedHectares: treated,
      treatedPercent: field.hectares > 0 ? Number(((treated / field.hectares) * 100).toFixed(1)) : 0,
      speciesBreakdown: [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    }
  }, null)
}

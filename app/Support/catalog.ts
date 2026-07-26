import type { FeatureCategory, FeatureContent, FeatureStep } from './content/features'
import type { SeasonStage, UseCaseContent, UseCaseSegment } from './content/use-cases'
import Detection from '../Models/Detection'
import Feature from '../Models/Feature'
import Field from '../Models/Field'
import Mission from '../Models/Mission'
import TreatmentMap from '../Models/TreatmentMap'
import UseCase from '../Models/UseCase'
import { featureCategories, features as authoredFeatures } from './content/features'
import { useCaseSegments, useCases as authoredUseCases } from './content/use-cases'

/**
 * The read layer the marketing views and the API actions share.
 *
 * Everything goes through the Stacks ORM, so the pages, `/api/features` and
 * the dashboard are all reading the same models with the same validation
 * rules behind them. The content modules stay in the picture as a fallback:
 * a marketing page has no business 500ing at a visitor because nobody ran
 * `buddy migrate` on the box yet, so an empty or missing table degrades to
 * the authored copy rather than an error.
 */

export type { FeatureCategory, FeatureContent, FeatureStep, SeasonStage, UseCaseContent, UseCaseSegment }
export { featureCategories, useCaseSegments }

/** JSON columns come back as strings; a malformed one must not take a page down. */
function parseJson<T>(value: unknown, fallback: T): T {
  if (Array.isArray(value) || (value !== null && typeof value === 'object'))
    return value as T

  if (typeof value !== 'string' || value.length === 0)
    return fallback

  try {
    return JSON.parse(value) as T
  }
  catch {
    return fallback
  }
}

/** Run an ORM query, falling back when the table is missing or unmigrated. */
async function query<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  }
  catch {
    return fallback
  }
}

function toFeature(row: Record<string, unknown>): FeatureContent {
  return {
    slug: String(row.slug),
    name: String(row.name),
    category: row.category as FeatureCategory,
    tagline: String(row.tagline ?? ''),
    summary: String(row.summary ?? ''),
    problem: String(row.problem ?? ''),
    steps: parseJson<FeatureStep[]>(row.steps, []),
    sensors: parseJson<string[]>(row.sensors, []),
    outputs: parseJson<string[]>(row.outputs, []),
    readings: parseJson<string[]>(row.readings, []),
    cadence: String(row.cadence ?? ''),
    useCases: parseJson<string[]>(row.use_case_slugs, []),
    order: Number(row.sort_order ?? 0),
  }
}

function toUseCase(row: Record<string, unknown>): UseCaseContent {
  return {
    slug: String(row.slug),
    name: String(row.name),
    segment: row.segment as UseCaseSegment,
    tagline: String(row.tagline ?? ''),
    summary: String(row.summary ?? ''),
    challenge: String(row.challenge ?? ''),
    approach: String(row.approach ?? ''),
    season: parseJson<SeasonStage[]>(row.season, []),
    features: parseJson<string[]>(row.feature_slugs, []),
    outcomes: parseJson<string[]>(row.outcomes, []),
    scale: String(row.scale ?? ''),
    order: Number(row.sort_order ?? 0),
  }
}

export async function allFeatures(): Promise<FeatureContent[]> {
  const rows = await query(() => Feature.orderBy('sort_order').get() as Promise<Record<string, unknown>[]>, [])

  if (rows.length === 0)
    return [...authoredFeatures]

  return rows.map(toFeature)
}

export async function allUseCases(): Promise<UseCaseContent[]> {
  const rows = await query(() => UseCase.orderBy('sort_order').get() as Promise<Record<string, unknown>[]>, [])

  if (rows.length === 0)
    return [...authoredUseCases]

  return rows.map(toUseCase)
}

export async function findFeature(slug: string): Promise<FeatureContent | undefined> {
  const row = await query(() => Feature.where('slug', slug).first() as Promise<Record<string, unknown> | null>, null)

  if (row)
    return toFeature(row)

  return authoredFeatures.find(f => f.slug === slug)
}

export async function findUseCase(slug: string): Promise<UseCaseContent | undefined> {
  const row = await query(() => UseCase.where('slug', slug).first() as Promise<Record<string, unknown> | null>, null)

  if (row)
    return toUseCase(row)

  return authoredUseCases.find(u => u.slug === slug)
}

export interface Group<T> {
  key: string
  label: string
  blurb: string
  items: T[]
}

/** Features grouped in menu order: detect, then act, then operate. */
export async function featureGroups(): Promise<Group<FeatureContent>[]> {
  const all = await allFeatures()
  return (['detect', 'act', 'operate'] as FeatureCategory[]).map(key => ({
    key,
    label: featureCategories[key].label,
    blurb: featureCategories[key].blurb,
    items: all.filter(f => f.category === key).sort((a, b) => a.order - b.order),
  }))
}

export async function useCaseGroups(): Promise<Group<UseCaseContent>[]> {
  const all = await allUseCases()
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
 * Assembled from the flight record: the field, the mission that flew it, every
 * detection it produced and the prescription that came out. `sample: true`
 * travels with it so a caller cannot render these numbers without knowing
 * they are modelled rather than a customer's.
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

export async function fieldReport(): Promise<FieldReport | null> {
  return query(async () => {
    const field = await Field.with('farm').first() as Record<string, any> | null
    if (!field)
      return null

    const mission = await Mission.where('field_id', field.id).first() as Record<string, any> | null
    if (!mission)
      return null

    const detections = await Detection.where('mission_id', mission.id).get() as Record<string, any>[]
    const map = await TreatmentMap.where('mission_id', mission.id).first() as Record<string, any> | null

    const counts = new Map<string, number>()
    for (const d of detections) counts.set(String(d.label), (counts.get(String(d.label)) ?? 0) + 1)

    const hectares = Number(field.hectares ?? 0)
    const treated = Number(map?.treated_hectares ?? 0)

    return {
      sample: true,
      farm: String(field.farm?.name ?? ''),
      region: String(field.farm?.region ?? ''),
      field: String(field.name),
      crop: String(field.crop),
      hectares,
      flownAt: String(mission.flown_at ?? ''),
      resolutionCm: Number(mission.resolution_cm ?? 0),
      durationMinutes: Number(mission.duration_minutes ?? 0),
      detections: detections.map(d => ({
        kind: String(d.kind),
        label: String(d.label),
        x: Number(d.x),
        y: Number(d.y),
        area_m2: Number(d.area_m2),
        severity: String(d.severity),
        confidence: Number(d.confidence),
      })),
      zones: parseJson<FieldReport['zones']>(map?.zones, []),
      boundary: parseJson<[number, number][]>(field.boundary, []),
      treatedHectares: treated,
      treatedPercent: hectares > 0 ? Number(((treated / hectares) * 100).toFixed(1)) : 0,
      speciesBreakdown: [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    } satisfies FieldReport
  }, null)
}

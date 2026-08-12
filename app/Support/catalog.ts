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

/**
 * Short-form catalog copy in another language.
 *
 * Names and taglines are what appear in the menus, the cards and the share
 * images, so they are translated; the long-form prose on a detail page is
 * not, and falls through to the English. Reading the same JSON the stx
 * translation pass uses keeps one file per locale rather than two.
 */
type LocalisedEntry = { name?: string, tagline?: string }

function localisedCopy(locale: string): { features: Record<string, LocalisedEntry>, useCases: Record<string, LocalisedEntry> } {
  if (!locale || locale === 'en')
    return { features: {}, useCases: {} }

  try {
    // eslint-disable-next-line ts/no-require-imports
    const translations = require(`../../resources/translations/${locale}.json`)
    return { features: translations.features ?? {}, useCases: translations.useCases ?? {} }
  }
  catch {
    return { features: {}, useCases: {} }
  }
}

/** Apply a locale's names and taglines over the English catalog. */
export function localiseFeatures(features: FeatureContent[], locale: string): FeatureContent[] {
  const copy = localisedCopy(locale).features
  return features.map(feature => ({
    ...feature,
    name: copy[feature.slug]?.name ?? feature.name,
    tagline: copy[feature.slug]?.tagline ?? feature.tagline,
  }))
}

export function localiseUseCases(useCases: UseCaseContent[], locale: string): UseCaseContent[] {
  const copy = localisedCopy(locale).useCases
  return useCases.map(useCase => ({
    ...useCase,
    name: copy[useCase.slug]?.name ?? useCase.name,
    tagline: copy[useCase.slug]?.tagline ?? useCase.tagline,
  }))
}

/**
 * The same catalog with its short copy replaced by translation tokens.
 *
 * A view's `<script server>` runs once, before stx knows which locale it is
 * rendering: the translation pass runs over the finished HTML, once per
 * locale. So a view cannot ask the catalog for German — it prints
 * `{t:features.<slug>.name}` and lets that pass resolve it, exactly as the
 * hand-written copy in the templates already does. A missing key falls back
 * to the English through the same mechanism as every other token.
 *
 * The raw functions stay for the two callers that want the string itself:
 * the API, whose consumers want a name rather than a token, and
 * `buddy og:generate`, which knows the locale it is drawing and takes the
 * translation directly.
 */
/**
 * Which fields are prose a visitor reads, and therefore have to travel
 * through the translation pass. Everything else on an entry - the slug, the
 * ordering, the category - is machinery.
 *
 * Arrays are tokenised per element, and an object element (a step, with its
 * own title and text) per field, so a German page has no English left on it.
 */
const PROSE_FIELDS = ['summary', 'problem', 'cadence', 'challenge', 'approach', 'scale'] as const
const PROSE_LISTS = ['sensors', 'outputs', 'readings', 'outcomes'] as const

/**
 * Lists whose entries are objects rather than strings, and the fields on them
 * that carry prose. Tokenising these as if they were strings replaced the
 * object with a token and the template read `.window` off a string: the
 * season timeline rendered as a row of empty bullets, in every language.
 */
const PROSE_OBJECT_LISTS: Record<string, string[]> = {
  steps: ['title', 'text'],
  season: ['window', 'focus'],
}

function tokenise<T extends { slug: string, name: string, tagline: string }>(
  items: T[],
  kind: 'features' | 'useCases',
): T[] {
  return items.map((item) => {
    const entry = item as unknown as Record<string, unknown>
    const key = (field: string): string => `{t:${kind}.${item.slug}.${field}}`

    const localised: Record<string, unknown> = {
      ...entry,
      name: key('name'),
      tagline: key('tagline'),
    }

    for (const field of PROSE_FIELDS) {
      if (typeof entry[field] === 'string')
        localised[field] = key(field)
    }

    for (const field of PROSE_LISTS) {
      const list = entry[field]
      if (Array.isArray(list))
        localised[field] = list.map((_value, index) => key(`${field}.${index}`))
    }

    for (const [field, subFields] of Object.entries(PROSE_OBJECT_LISTS)) {
      const list = entry[field]
      if (!Array.isArray(list))
        continue

      localised[field] = (list as Array<Record<string, unknown>>).map((item, index) => {
        const copy = { ...item }
        for (const subField of subFields) {
          if (typeof item[subField] === 'string')
            copy[subField] = key(`${field}.${index}.${subField}`)
        }
        return copy
      })
    }

    return localised as unknown as T
  })
}

/** A group's own label and blurb, as tokens keyed by the group. */
function tokeniseGroup<T extends { slug: string, name: string, tagline: string }>(
  group: Group<T>,
  kind: 'features' | 'useCases',
): Group<T> {
  return {
    ...group,
    label: `{t:groups.${kind}.${group.key}.label}`,
    blurb: `{t:groups.${kind}.${group.key}.blurb}`,
    items: tokenise(group.items, kind),
  }
}

export async function displayFeatures(): Promise<FeatureContent[]> {
  return tokenise(await allFeatures(), 'features')
}

export async function displayUseCases(): Promise<UseCaseContent[]> {
  return tokenise(await allUseCases(), 'useCases')
}

export async function displayFeature(slug: string): Promise<FeatureContent | undefined> {
  const feature = await findFeature(slug)
  return feature ? tokenise([feature], 'features')[0] : undefined
}

export async function displayUseCase(slug: string): Promise<UseCaseContent | undefined> {
  const useCase = await findUseCase(slug)
  return useCase ? tokenise([useCase], 'useCases')[0] : undefined
}

export async function displayFeatureGroups(): Promise<Group<FeatureContent>[]> {
  return (await featureGroups()).map(group => tokeniseGroup(group, 'features'))
}

export async function displayUseCaseGroups(): Promise<Group<UseCaseContent>[]> {
  return (await useCaseGroups()).map(group => tokeniseGroup(group, 'useCases'))
}

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

type FeatureRow = Awaited<ReturnType<typeof Feature.first>>
type UseCaseRow = Awaited<ReturnType<typeof UseCase.first>>

function toFeature(row: NonNullable<FeatureRow>): FeatureContent {
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

function toUseCase(row: NonNullable<UseCaseRow>): UseCaseContent {
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
  const rows = await query(() => Feature.orderBy('sort_order').get(), [])

  if (rows.length === 0)
    return [...authoredFeatures]

  return rows.map(toFeature)
}

export async function allUseCases(): Promise<UseCaseContent[]> {
  const rows = await query(() => UseCase.orderBy('sort_order').get(), [])

  if (rows.length === 0)
    return [...authoredUseCases]

  return rows.map(toUseCase)
}

export async function findFeature(slug: string): Promise<FeatureContent | undefined> {
  const row = await query(() => Feature.where('slug', slug).first(), undefined)

  if (row)
    return toFeature(row)

  return authoredFeatures.find(f => f.slug === slug)
}

export async function findUseCase(slug: string): Promise<UseCaseContent | undefined> {
  const row = await query(() => UseCase.where('slug', slug).first(), undefined)

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
/**
 * The stitched picture of the field, when a flight has one attached.
 *
 * `bounds` is the image's footprint in the same normalised 0..1 field space
 * the boundary and the detections use, so a renderer can place it under them
 * without a projection. Absent rather than empty when no stitch exists: the
 * map has to be able to tell "no imagery" from "imagery covering nothing".
 */
export interface FieldImagery {
  url: string
  /** [minX, minY, maxX, maxY] in normalised field space. */
  bounds: [number, number, number, number]
  /** Ground sample distance of the stitched output, cm per pixel. */
  resolutionCm: number
}

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
  /** The stitched image of this field, or null when the flight has none. */
  imagery: FieldImagery | null
  treatedHectares: number
  /** Share of the field the prescription switches the boom on for, 0..100. */
  treatedPercent: number
  speciesBreakdown: { label: string, count: number }[]
}

/**
 * The imagery half of a flight record, or null when there is no stitch.
 *
 * Bounds default to the unit square: a flight that has an image but no
 * recorded footprint is still worth showing, and covering the field exactly
 * is the only assumption available. A stored footprint that is not four
 * numbers is discarded rather than half-applied, because a partially read
 * footprint puts the picture out of register with the markers on top of it -
 * which looks like bad detection data rather than bad metadata.
 */
function toImagery(mission: { orthomosaic_url?: unknown, orthomosaic_bounds?: unknown, orthomosaic_resolution_cm?: unknown }): FieldImagery | null {
  const url = String(mission.orthomosaic_url ?? '')
  if (url.length === 0)
    return null

  const stored = parseJson<number[]>(mission.orthomosaic_bounds, [])
  const bounds: FieldImagery['bounds'] = stored.length === 4 && stored.every(n => typeof n === 'number' && Number.isFinite(n))
    ? (stored.slice(0, 4) as FieldImagery['bounds'])
    : [0, 0, 1, 1]

  return {
    url,
    bounds,
    resolutionCm: Number(mission.orthomosaic_resolution_cm ?? 0),
  }
}

export async function fieldReport(): Promise<FieldReport | null> {
  return query(async () => {
    const field = await Field.with('farm').first()
    if (!field)
      return null

    // `with()` narrows the relation NAME but not the loaded record's shape:
    // resolving 'farm' to the Farm model's attributes would need a type-level
    // registry mapping relation names to definitions, which the ORM does not
    // have. Everything else on this path is fully inferred, so the cast is
    // confined to the one property that genuinely is not.
    const farm = field.farm as { name?: string, region?: string } | undefined

    const mission = await Mission.where('field_id', field.id).first()
    if (!mission)
      return null

    const detections = await Detection.where('mission_id', mission.id).get()
    const map = await TreatmentMap.where('mission_id', mission.id).first()

    const counts = new Map<string, number>()
    for (const d of detections) counts.set(String(d.label), (counts.get(String(d.label)) ?? 0) + 1)

    const hectares = Number(field.hectares ?? 0)
    const treated = Number(map?.treated_hectares ?? 0)

    return {
      sample: true,
      farm: String(farm?.name ?? ''),
      region: String(farm?.region ?? ''),
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
      imagery: toImagery(mission),
      treatedHectares: treated,
      treatedPercent: hectares > 0 ? Number(((treated / hectares) * 100).toFixed(1)) : 0,
      speciesBreakdown: [...counts.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count),
    } satisfies FieldReport
  }, null)
}

/**
 * The capabilities a flight can be booked for, for the dashboard's picker.
 *
 * Straight from the content module rather than the database: the catalog is
 * the same on every deployment, and a form that offers only what has been
 * synced would silently shrink if a sync had not run.
 */
export function capabilityOptions(): { slug: string, name: string }[] {
  return authoredFeatures.map(feature => ({ slug: feature.slug, name: feature.name }))
}

import FarmCapability from '../Models/FarmCapability'
import Field from '../Models/Field'
import Mission from '../Models/Mission'
import { features } from './content/features'

/**
 * The bridge between what the site sells and what a farmer can switch on.
 *
 * `app/Support/content/features.ts` is the catalog: eighteen capabilities, each
 * described for someone deciding whether to buy. This module answers the other
 * question — for *this* holding, which of them are running, how often, over
 * which fields, and when they were last flown. Every capability on the
 * marketing pages appears here, whether or not the farm has turned it on, so
 * the dashboard can never quietly offer less than the site advertises.
 */

export type CapabilityStatus = 'active' | 'paused' | 'requested' | 'off'

export interface ManagedCapability {
  slug: string
  name: string
  category: string
  tagline: string
  /** What the farm has chosen. `off` means there is no record yet. */
  status: CapabilityStatus
  cadenceDays: number
  /** Empty means the whole holding. */
  fieldIds: number[]
  fieldNames: string[]
  notes: string
  lastFlown: string
  flights: number
  /** The row id, when one exists — the dashboard form posts against it. */
  id: number | null
}

export interface CapabilityGroup {
  key: string
  capabilities: ManagedCapability[]
}

/** The categories, in the order the marketing pages present them. */
const GROUP_ORDER = ['detect', 'act', 'operate'] as const

/**
 * Capabilities that cannot simply be switched on.
 *
 * Seeding and frost protection need equipment on site; the livestock and
 * wildlife work needs a licence check before a first flight. Turning these on
 * records a request rather than promising a flight the schedule cannot keep.
 */
const NEEDS_A_VISIT = new Set([
  'drone-seeding',
  'frost-protection',
  'pollination-support',
  'wildlife-rescue',
  'livestock-and-fences',
])

export function requiresVisit(slug: string): boolean {
  return NEEDS_A_VISIT.has(slug)
}

function day(value: unknown): string {
  if (!value)
    return ''

  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

async function safely<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  }
  catch {
    // One unmigrated table must not take the whole page down.
    return fallback
  }
}

/**
 * Every marketed capability, annotated with what this farm has done about it.
 *
 * The catalog leads: the list is built from `features`, and a farm's rows are
 * folded in. A capability with no row is `off` — offered, not yet taken.
 */
export async function managedCapabilities(farmId: number): Promise<CapabilityGroup[]> {
  const rows = await safely(() => FarmCapability.where('farm_id', farmId).get() as Promise<any[]>, [])
  const fields = await safely(() => Field.where('farm_id', farmId).get() as Promise<any[]>, [])
  const flights = await safely(() => Mission.where('farm_id', farmId).get() as Promise<any[]>, [])

  const fieldNames = new Map<number, string>()
  for (const field of fields)
    fieldNames.set(Number(field.id), String(field.name ?? ''))

  const bySlug = new Map<string, any[]>()
  for (const row of rows) {
    const slug = String(row.feature_slug ?? '')
    bySlug.set(slug, [...(bySlug.get(slug) ?? []), row])
  }

  // Flights carry the capability slug in `purpose`, which is what links a
  // capability to the work that actually happened over a field.
  const flownBySlug = new Map<string, { count: number, last: string }>()
  for (const flight of flights) {
    const slug = String(flight.purpose ?? '')
    const seen = flownBySlug.get(slug) ?? { count: 0, last: '' }
    const flown = day(flight.flown_at)
    flownBySlug.set(slug, {
      count: seen.count + 1,
      last: flown > seen.last ? flown : seen.last,
    })
  }

  const managed: ManagedCapability[] = features.map((feature) => {
    const own = bySlug.get(feature.slug) ?? []
    const primary = own[0]
    const scoped = own.filter(row => row.field_id != null).map(row => Number(row.field_id))
    const flown = flownBySlug.get(feature.slug)

    return {
      slug: feature.slug,
      name: feature.name,
      category: feature.category,
      tagline: feature.tagline,
      status: (primary?.status as CapabilityStatus) ?? 'off',
      cadenceDays: Number(primary?.cadence_days ?? 14),
      fieldIds: scoped,
      fieldNames: scoped.map(id => fieldNames.get(id) ?? '').filter(Boolean),
      notes: String(primary?.notes ?? ''),
      lastFlown: flown?.last ?? '',
      flights: flown?.count ?? 0,
      id: primary?.id != null ? Number(primary.id) : null,
    }
  })

  return GROUP_ORDER.map(key => ({
    key,
    capabilities: managed.filter(capability => capability.category === key),
  })).filter(group => group.capabilities.length > 0)
}

/** How many of the marketed capabilities this holding is actually running. */
export function activeCount(groups: CapabilityGroup[]): number {
  return groups.flatMap(group => group.capabilities).filter(capability => capability.status === 'active').length
}

/** The whole catalog's size, so the dashboard can say "6 of 18". */
export function offeredCount(groups: CapabilityGroup[]): number {
  return groups.flatMap(group => group.capabilities).length
}

/**
 * When the next flight for a capability is due.
 *
 * Empty when it is not running, or when nothing has been flown yet — the first
 * flight is scheduled by the visit, not by the cadence.
 */
export function nextDue(capability: ManagedCapability): string {
  if (capability.status !== 'active' || !capability.lastFlown)
    return ''

  const last = new Date(capability.lastFlown)
  if (Number.isNaN(last.getTime()))
    return ''

  last.setDate(last.getDate() + capability.cadenceDays)
  return last.toISOString().slice(0, 10)
}

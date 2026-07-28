import Detection from '../Models/Detection'
import Farm from '../Models/Farm'
import Field from '../Models/Field'
import Mission from '../Models/Mission'
import TreatmentMap from '../Models/TreatmentMap'

/**
 * The farmer's own holdings, as the dashboard shows them.
 *
 * Everything here is scoped by `farms.user_id`: a farmer sees their own
 * fields, their own flights and nothing else. The demonstration farm has no
 * owner, so it appears on no dashboard, which is what keeps the worked
 * example out of somebody's real numbers.
 *
 * Each query is guarded on its own. A dashboard that 500s because one panel's
 * table is empty is worse than a dashboard with one empty panel.
 */
export interface DashboardField {
  name: string
  crop: string
  hectares: number
  status: string
  lastFlown: string
  detections: number
  treatedHectares: number
}

export interface DashboardFlight {
  field: string
  flownOn: string
  status: string
  detections: number
  hectares: number
}

export interface Dashboard {
  farm: { name: string, region: string, hectares: number, segment: string } | null
  fields: DashboardField[]
  flights: DashboardFlight[]
  totals: { fields: number, hectares: number, detections: number, treatedHectares: number }
}

/** ISO day, the one date format every locale on this site reads the same way. */
function day(value: unknown): string {
  if (!value)
    return ''

  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10)
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

async function safely<T>(run: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await run()
  }
  catch {
    return fallback
  }
}

/**
 * The holding a farmer manages.
 *
 * Every scoped read and every write goes through this: a farmer's identity is
 * the only input, so no request can name a farm and therefore none can name
 * somebody else's. The demonstration farm has no owner and is returned to
 * nobody.
 */
export async function farmFor(userId: number): Promise<{ id: number, name: string } | null> {
  if (!userId)
    return null

  const farm = await safely(() => Farm.where('user_id', userId).first(), null) as any
  if (!farm?.id)
    return null

  return { id: Number(farm.id), name: String(farm.name ?? '') }
}

/** The holding's parcels, for the pages that let a farmer scope work to one. */
export async function fieldsFor(farmId: number): Promise<{ id: number, name: string, crop: string, hectares: number }[]> {
  const rows = await safely(() => Field.where('farm_id', farmId).orderBy('name').get() as Promise<any[]>, [])

  return rows.map(row => ({
    id: Number(row.id),
    name: String(row.name ?? ''),
    crop: String(row.crop ?? ''),
    hectares: Number(row.hectares ?? 0),
  }))
}

/**
 * Flights, newest first, with the field they cover.
 *
 * Scheduled ones come back too: a farmer needs to see what is coming as much
 * as what has been flown, and the capability schedule is what puts them there.
 */
export async function flightsFor(farmId: number): Promise<{ id: number, field: string, purpose: string, status: string, flownOn: string, hectares: number, detections: number }[]> {
  const rows = await safely(() => Mission.where('farm_id', farmId).orderByDesc('id').get() as Promise<any[]>, [])
  const fields = await safely(() => Field.where('farm_id', farmId).get() as Promise<any[]>, [])
  const names = new Map(fields.map(field => [Number(field.id), String(field.name ?? '')]))

  const missionIds = rows.map(row => Number(row.id))
  const detections = missionIds.length > 0
    ? await safely(() => Detection.whereIn('mission_id', missionIds).get() as Promise<any[]>, [])
    : []

  const found = new Map<number, number>()
  for (const detection of detections) {
    const id = Number(detection.mission_id)
    found.set(id, (found.get(id) ?? 0) + 1)
  }

  return rows.map(row => ({
    id: Number(row.id),
    field: names.get(Number(row.field_id)) ?? '',
    purpose: String(row.purpose ?? ''),
    status: String(row.status ?? ''),
    flownOn: day(row.flown_at),
    hectares: Number(row.hectares_covered ?? 0),
    detections: found.get(Number(row.id)) ?? 0,
  }))
}

/**
 * Everything the flights found, for triage.
 *
 * `open` and `review` still want a decision; `treated` and `dismissed` are
 * closed, and which of the two it was is kept because it tells the next flight
 * whether to look at that patch again.
 */
export async function detectionsFor(farmId: number): Promise<{ id: number, kind: string, label: string, severity: string, status: string, field: string, foundOn: string }[]> {
  const flights = await safely(() => Mission.where('farm_id', farmId).get() as Promise<any[]>, [])
  const ids = flights.map(flight => Number(flight.id))
  if (ids.length === 0)
    return []

  const flownAt = new Map(flights.map(flight => [Number(flight.id), day(flight.flown_at)]))
  const fields = await safely(() => Field.where('farm_id', farmId).get() as Promise<any[]>, [])
  const names = new Map(fields.map(field => [Number(field.id), String(field.name ?? '')]))

  const rows = await safely(() => Detection.whereIn('mission_id', ids).get() as Promise<any[]>, [])

  return rows.map(row => ({
    id: Number(row.id),
    kind: String(row.kind ?? ''),
    label: String(row.label ?? ''),
    severity: String(row.severity ?? ''),
    status: String(row.status ?? ''),
    field: names.get(Number(row.field_id)) ?? '',
    foundOn: flownAt.get(Number(row.mission_id)) ?? '',
  }))
}

export async function dashboardFor(userId: number): Promise<Dashboard> {
  const empty: Dashboard = {
    farm: null,
    fields: [],
    flights: [],
    totals: { fields: 0, hectares: 0, detections: 0, treatedHectares: 0 },
  }

  if (!userId)
    return empty

  const farm = await safely(() => Farm.where('user_id', userId).first(), null)
  if (!farm?.id)
    return empty

  const farmId = Number(farm.id)
  const fieldRows = await safely(() => Field.where('farm_id', farmId).orderBy('name').get(), [])
  const missionRows = await safely(() => Mission.where('farm_id', farmId).orderByDesc('flown_at').get(), [])

  // One query per collection rather than per field: a holding with forty
  // blocks would otherwise issue eighty queries to draw one table.
  const missionIds = missionRows.map(row => Number(row.id))
  const detections = missionIds.length
    ? await safely(() => Detection.whereIn('mission_id', missionIds).get(), [])
    : []
  const maps = missionIds.length
    ? await safely(() => TreatmentMap.whereIn('mission_id', missionIds).get(), [])
    : []

  const detectionsByField = new Map<number, number>()
  const detectionsByMission = new Map<number, number>()
  for (const detection of detections) {
    const fieldId = Number(detection.field_id)
    const missionId = Number(detection.mission_id)
    detectionsByField.set(fieldId, (detectionsByField.get(fieldId) ?? 0) + 1)
    detectionsByMission.set(missionId, (detectionsByMission.get(missionId) ?? 0) + 1)
  }

  const treatedByField = new Map<number, number>()
  let treatedTotal = 0
  for (const map of maps) {
    const fieldId = Number(map.field_id)
    const treated = Number(map.treated_hectares ?? 0)
    treatedByField.set(fieldId, round((treatedByField.get(fieldId) ?? 0) + treated))
    treatedTotal += treated
  }

  const lastFlownByField = new Map<number, string>()
  for (const mission of missionRows) {
    const fieldId = Number(mission.field_id)
    // Missions come back newest first, so the first one wins.
    if (!lastFlownByField.has(fieldId))
      lastFlownByField.set(fieldId, day(mission.flown_at))
  }

  const fieldNames = new Map<number, string>()
  const fields: DashboardField[] = fieldRows.map((row) => {
    const id = Number(row.id)
    fieldNames.set(id, String(row.name ?? ''))

    return {
      name: String(row.name ?? ''),
      crop: String(row.crop ?? ''),
      hectares: Number(row.hectares ?? 0),
      status: String(row.status ?? ''),
      lastFlown: lastFlownByField.get(id) ?? '',
      detections: detectionsByField.get(id) ?? 0,
      treatedHectares: treatedByField.get(id) ?? 0,
    }
  })

  const flights: DashboardFlight[] = missionRows.slice(0, 8).map(row => ({
    field: fieldNames.get(Number(row.field_id)) ?? '',
    flownOn: day(row.flown_at),
    status: String(row.status ?? ''),
    detections: detectionsByMission.get(Number(row.id)) ?? 0,
    hectares: Number(row.hectares_covered ?? 0),
  }))

  return {
    farm: {
      name: String(farm.name ?? ''),
      region: String(farm.region ?? ''),
      hectares: Number(farm.hectares ?? 0),
      segment: String(farm.segment ?? ''),
    },
    fields,
    flights,
    totals: {
      fields: fields.length,
      hectares: round(fields.reduce((sum, field) => sum + field.hectares, 0)),
      detections: detections.length,
      treatedHectares: round(treatedTotal),
    },
  }
}

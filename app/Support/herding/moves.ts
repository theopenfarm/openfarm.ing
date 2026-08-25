/**
 * Planning, authorising and stopping a herding move.
 *
 * The endpoints in `app/Actions/Herding/` are thin on purpose: each one reads a
 * request, calls one function here and turns the answer into a response. The
 * decisions - which fields a caller may name, what the corridor looks like,
 * whether a transition is legal, what the envelope was at the moment somebody
 * said yes - all live here, where a test can reach them without an HTTP layer.
 *
 * Every function takes the farm id the caller has already been narrowed to.
 * None of them accepts a farm from the request, for the same reason
 * `app/Support/dashboard.ts` does not: a herding move drives somebody's
 * animals across their ground, and an endpoint that took the holding on trust
 * would let one account do that to another's stock.
 */

import type { Ring, Vec } from './geometry'
import type { Corridor } from './planner'
import type { MoveAction } from './state'
import Field from '../../Models/Field'
import Herd from '../../Models/Herd'
import HerdMove from '../../Models/HerdMove'
import { envelopeFor } from './envelope'
import { ringCentroid, vec } from './geometry'
import { corridorClearanceM, planCorridor } from './planner'
import { expiryFrom, hasExpired, transition } from './state'

export interface MoveResult {
  ok: boolean
  /** The row, as the API serves it. */
  move?: Record<string, unknown>
  error?: string
  /** HTTP status the caller should answer with. */
  status?: number
}

export interface PlanRequest {
  farmId: number
  herdId: number
  toFieldId: number
  reason?: string
  /**
   * Where the fence opens between the two blocks, in normalised space.
   *
   * Optional, and the fallback is the midpoint between the two block centroids.
   * That is a guess, and it is flagged as one on the plan rather than dressed
   * up: a real deployment surveys its gates once and stores them, and until it
   * has, a farmer looking at the proposed corridor is the check.
   */
  gate?: Vec
}

const REASONS = new Set(['rotation', 'gather', 'hazard', 'fence_breach', 'weather', 'manual'])

/** Parse a stored boundary ring, tolerating the empty and the malformed. */
function ring(value: unknown): Ring {
  if (!value)
    return []

  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value
    if (!Array.isArray(parsed))
      return []

    return parsed
      .filter((point: unknown) => Array.isArray(point) && point.length >= 2)
      .map((point: number[]) => [Number(point[0]), Number(point[1])] as [number, number])
  }
  catch {
    // A boundary nobody can read is a boundary the planner treats as absent,
    // which falls back to the block centroid. Better than refusing the move.
    return []
  }
}

/**
 * How many metres one unit of normalised space is worth.
 *
 * Derived from the two blocks' own areas rather than fixed, because standoff
 * is measured in metres and the same 0.03 units is 20 m on a paddock and 90 m
 * on a hill block. Getting this wrong would silently rescale every welfare
 * limit, so it is computed from the acreage the farmer already told us.
 */
export function metresPerUnitFor(fromHectares: number, toHectares: number): number {
  const hectares = Math.max(Number(fromHectares) + Number(toHectares), 0.5)
  return Math.sqrt(hectares * 10_000)
}

/** A square around a centroid, for a block whose boundary was never drawn. */
function fallbackRing(): Ring {
  return [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]]
}

export interface PlannedCorridor {
  corridor: Corridor
  gate: Vec
  gateAssumed: boolean
  metresPerUnit: number
  clearanceM: number
}

/** Work out the route, without touching the database. Exported so it can be tested. */
export function corridorFor(
  fromBoundary: Ring,
  toBoundary: Ring,
  head: number,
  metresPerUnit: number,
  exclusions: Ring[] = [],
  gate?: Vec,
): PlannedCorridor {
  const from = fromBoundary.length > 2 ? fromBoundary : fallbackRing()
  const to = toBoundary.length > 2 ? toBoundary : fallbackRing()

  const assumed = !gate
  const opening = gate ?? (() => {
    const a = ringCentroid(from)
    const b = ringCentroid(to)
    return vec((a.x + b.x) / 2, (a.y + b.y) / 2)
  })()

  const corridor = planCorridor({
    fromBlock: from,
    toBlock: to,
    gate: opening,
    exclusions,
    metresPerUnit,
    head,
  })

  return {
    corridor,
    gate: opening,
    gateAssumed: assumed,
    metresPerUnit,
    clearanceM: corridorClearanceM(corridor, exclusions, metresPerUnit),
  }
}

/**
 * Propose a move. Writes a row in `planned` and nothing else happens.
 *
 * Deliberately cheap and reversible: planning is what the nightly job does
 * unattended, so it must not be able to start anything. The row it leaves is
 * a proposal a person looks at.
 */
export async function planMove(request: PlanRequest): Promise<MoveResult> {
  const { farmId, herdId, toFieldId } = request
  const reason = String(request.reason ?? 'rotation')

  if (!REASONS.has(reason))
    return { ok: false, status: 422, error: `Unknown reason: ${reason}.` }

  const herd = await Herd.where('id', Number(herdId)).where('farm_id', farmId).first() as any
  if (!herd?.id)
    return { ok: false, status: 404, error: 'No such mob on this holding.' }

  const to = await Field.where('id', Number(toFieldId)).where('farm_id', farmId).first() as any
  if (!to?.id)
    return { ok: false, status: 404, error: 'No such block on this holding.' }

  const fromFieldId = Number(herd.field_id ?? 0)
  if (!fromFieldId)
    return { ok: false, status: 422, error: 'That mob is not recorded on a block, so there is nothing to move it from.' }

  if (fromFieldId === Number(to.id))
    return { ok: false, status: 422, error: 'That mob is already on that block.' }

  const from = await Field.where('id', fromFieldId).where('farm_id', farmId).first() as any
  if (!from?.id)
    return { ok: false, status: 422, error: 'The block that mob is on is not on this holding.' }

  // A mob with a move already waiting does not need a second one. Same
  // reasoning as the duplicate check in FlightScheduleAction: a job that runs
  // twice must not fill somebody's morning with proposals.
  const waiting = await HerdMove
    .where('herd_id', Number(herd.id))
    .whereIn('status', ['planned', 'authorised', 'flying'])
    .first() as any

  if (waiting?.id)
    return { ok: false, status: 409, error: 'That mob already has a move planned or under way.' }

  const head = Number(herd.head_count ?? 0)
  const metresPerUnit = metresPerUnitFor(Number(from.hectares ?? 0), Number(to.hectares ?? 0))
  const planned = corridorFor(ring(from.boundary), ring(to.boundary), head, metresPerUnit, [], request.gate)
  const envelope = envelopeFor(herd.pressure_profile)

  const summary = planned.gateAssumed
    ? `Route assumes the gate is midway between the two blocks. Check it before authorising.`
    : `Route planned through the recorded gate, ${planned.clearanceM} m clear of the nearest hazard.`

  const move = await HerdMove.create({
    farm_id: farmId,
    herd_id: Number(herd.id),
    from_field_id: fromFieldId,
    to_field_id: Number(to.id),
    reason,
    status: 'planned',
    corridor: JSON.stringify({ ...planned.corridor, gate: planned.gate, assumed: planned.gateAssumed }),
    exclusions: '[]',
    // The envelope is written now and frozen at authorisation. Writing it here
    // too means the plan a farmer reads already shows what it would be flown
    // under, rather than a blank they have to imagine.
    min_standoff_m: envelope.minStandoffM,
    max_mob_speed_ms: envelope.maxMobSpeedMs,
    max_drive_minutes: envelope.maxDriveMinutes,
    rest_after_minutes: envelope.restAfterMinutes,
    head_before: head,
    summary,
  } as any)

  return { ok: true, move: move as any }
}

/**
 * The human act.
 *
 * Freezes the envelope onto the row and opens a window. From here the move may
 * fly; before here it may not, and no other function in this module can put it
 * in that state.
 */
export async function authoriseMove(farmId: number, moveId: number, userId: number, now = new Date()): Promise<MoveResult> {
  const move = await HerdMove.where('id', Number(moveId)).where('farm_id', farmId).first() as any
  if (!move?.id)
    return { ok: false, status: 404, error: 'No such move on this holding.' }

  const step = transition(String(move.status ?? ''), 'authorise')
  if (!step.ok)
    return { ok: false, status: 409, error: step.error }

  const herd = await Herd.where('id', Number(move.herd_id)).first() as any
  const envelope = envelopeFor(herd?.pressure_profile)

  /*
   * The envelope is copied onto the row rather than read from config when the
   * aircraft launches. Somebody agreed to a drone working their stock under
   * these numbers; a settings change tomorrow must not be able to rewrite what
   * they agreed to, and an audit a year from now has to read the same figures.
   */
  await HerdMove.where('id', Number(move.id)).update({
    status: step.status,
    authorised_by: userId,
    authorised_at: now.toISOString(),
    expires_at: expiryFrom(now),
    min_standoff_m: envelope.minStandoffM,
    max_mob_speed_ms: envelope.maxMobSpeedMs,
    max_drive_minutes: envelope.maxDriveMinutes,
    rest_after_minutes: envelope.restAfterMinutes,
    head_before: Number(herd?.head_count ?? move.head_before ?? 0),
  } as any)

  const updated = await HerdMove.where('id', Number(move.id)).first()
  return { ok: true, move: updated as any }
}

/** Stop a move, from either side of the launch. */
export async function abortMove(farmId: number, moveId: number, reason: string, now = new Date()): Promise<MoveResult> {
  const move = await HerdMove.where('id', Number(moveId)).where('farm_id', farmId).first() as any
  if (!move?.id)
    return { ok: false, status: 404, error: 'No such move on this holding.' }

  const step = transition(String(move.status ?? ''), 'abort')
  if (!step.ok)
    return { ok: false, status: 409, error: step.error }

  await HerdMove.where('id', Number(move.id)).update({
    status: step.status,
    abort_reason: reason.slice(0, 300) || 'Stopped from the dashboard.',
    completed_at: now.toISOString(),
  } as any)

  const updated = await HerdMove.where('id', Number(move.id)).first()
  return { ok: true, move: updated as any }
}

/** Reject a proposal without ever authorising it. */
export async function rejectMove(farmId: number, moveId: number, reason: string): Promise<MoveResult> {
  const move = await HerdMove.where('id', Number(moveId)).where('farm_id', farmId).first() as any
  if (!move?.id)
    return { ok: false, status: 404, error: 'No such move on this holding.' }

  const step = transition(String(move.status ?? ''), 'reject')
  if (!step.ok)
    return { ok: false, status: 409, error: step.error }

  await HerdMove.where('id', Number(move.id)).update({
    status: step.status,
    summary: reason.slice(0, 600) || String(move.summary ?? ''),
  } as any)

  return { ok: true, move: (await HerdMove.where('id', Number(move.id)).first()) as any }
}

/**
 * Lapse the authorisations nobody acted on.
 *
 * Called before any read of the move list, so a farmer never sees a move
 * described as authorised hours after the window closed. Cheap: it only ever
 * touches rows that are actually stale.
 */
export async function expireStaleMoves(farmId: number, now = new Date()): Promise<number> {
  const authorised = await HerdMove
    .where('farm_id', farmId)
    .where('status', 'authorised')
    .get() as any[]

  let expired = 0
  for (const move of authorised) {
    if (!hasExpired(move, now))
      continue

    await HerdMove.where('id', Number(move.id)).update({ status: 'expired' } as any)
    expired++
  }

  return expired
}

/**
 * The moves on a holding, newest first, with the blocks resolved to names.
 *
 * The two `Field` reads are by id rather than through the relation, and that is
 * deliberate rather than lazy: `from_field_id` and `to_field_id` are two
 * `belongsTo` entries pointing at the same model, which needs the framework
 * fix in `fix(orm): honour a declared foreignKey on belongsTo` to resolve.
 * Reading by id works on either side of that release.
 */
export async function movesFor(farmId: number, now = new Date()): Promise<Record<string, unknown>[]> {
  await expireStaleMoves(farmId, now)

  const moves = await HerdMove.where('farm_id', farmId).orderByDesc('id').get() as any[]
  if (moves.length === 0)
    return []

  const fields = await Field.where('farm_id', farmId).get() as any[]
  const names = new Map(fields.map(field => [Number(field.id), String(field.name ?? '')]))

  const herds = await Herd.where('farm_id', farmId).get() as any[]
  const mobs = new Map(herds.map(herd => [Number(herd.id), String(herd.name ?? '')]))

  return moves.map(move => ({
    id: Number(move.id),
    herd: mobs.get(Number(move.herd_id)) ?? '',
    from: names.get(Number(move.from_field_id)) ?? '',
    to: names.get(Number(move.to_field_id)) ?? '',
    reason: String(move.reason ?? ''),
    status: String(move.status ?? ''),
    summary: String(move.summary ?? ''),
    abortReason: String(move.abort_reason ?? ''),
    envelope: {
      minStandoffM: Number(move.min_standoff_m ?? 0),
      maxMobSpeedMs: Number(move.max_mob_speed_ms ?? 0),
      maxDriveMinutes: Number(move.max_drive_minutes ?? 0),
      restAfterMinutes: Number(move.rest_after_minutes ?? 0),
    },
    outcome: {
      peakMobSpeedMs: Number(move.peak_mob_speed_ms ?? 0),
      driveMinutes: Number(move.drive_minutes ?? 0),
      closestApproachM: Number(move.closest_approach_m ?? 0),
      headBefore: Number(move.head_before ?? 0),
      headAfter: Number(move.head_after ?? 0),
      stragglers: Number(move.head_stragglers ?? 0),
    },
    authorisedAt: String(move.authorised_at ?? ''),
    expiresAt: String(move.expires_at ?? ''),
    startedAt: String(move.started_at ?? ''),
    completedAt: String(move.completed_at ?? ''),
  }))
}

export type { MoveAction }

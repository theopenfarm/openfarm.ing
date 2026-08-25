/**
 * Plan the route a mob is walked along.
 *
 * The corridor is the shape of the whole move: where the mob is gathered, the
 * gate it funnels through, and the line it walks on the far side. It is
 * computed once, before anybody authorises anything, because a farmer looking
 * at a proposed move needs to see the line it will take past the road before
 * they say yes, not afterwards.
 *
 * Deliberately not a shortest path. The straight line between two block
 * centroids is rarely the one you would walk stock along: it ignores the gate,
 * and it happily runs them along a road boundary because the road is not in
 * the way, only beside it. So the route is anchored on the gate, and then
 * pushed off every hazard until it has real clearance.
 *
 * Pure and deterministic, like everything else here. Same blocks in, same
 * corridor out, so the playground, the stored move and the map all draw one
 * line.
 */

import type { Ring, Vec } from './geometry'
import {
  add,
  clampToField,
  distanceToNearestRing,
  distanceToRing,
  normalise,
  ringCentroid,
  rotate,
  scale,
  sub,
  vec,
} from './geometry'

export interface Corridor {
  /** The route, in normalised field space. */
  points: [number, number][]
  /** How wide the mob is expected to travel, in normalised units. */
  width: number
}

export interface PlanRequest {
  fromBlock: Ring
  toBlock: Ring
  /** The opening between the blocks. Every move goes through it. */
  gate: Vec
  exclusions?: Ring[]
  metresPerUnit: number
  /** Head count, which is what decides how wide the mob travels. */
  head?: number
  /** Clearance the route keeps from any hazard. */
  clearanceM?: number
}

/**
 * Default clearance from a hazard, in metres.
 *
 * Wider than the standoff distance on purpose. Standoff is how close the
 * aircraft may come to the animals; this is how close the animals may be
 * walked to a road, and being wrong about the second is far more expensive.
 */
const DEFAULT_CLEARANCE_M = 45

/** How many times a waypoint is nudged before the planner gives up on it. */
const MAX_NUDGES = 24

/**
 * How wide a mob travels, in normalised units.
 *
 * Grows with the square root of head count rather than linearly: a mob spreads
 * over an area, so doubling the numbers widens the front by about 40 per cent,
 * not by 100.
 */
function mobWidth(head: number, metresPerUnit: number): number {
  const metres = 12 + Math.sqrt(Math.max(head, 1)) * 4
  return metres / metresPerUnit
}

/**
 * Push a point away from every hazard until it has the clearance asked for.
 *
 * Steps directly away from the nearest ring, which converges quickly for the
 * hazards this deals with (a road along one side, a pond, a boggy corner) and
 * cannot oscillate the way a combined-gradient step can when two hazards face
 * each other. If it cannot find clearance within `MAX_NUDGES` the point is
 * returned as it stands: a corridor drawn too close to a hazard is a corridor
 * a farmer can look at and refuse, which is better than no plan and better
 * than a plan that silently pretends the road is not there.
 */
function nudgeClear(point: Vec, exclusions: Ring[], clearance: number): Vec {
  if (exclusions.length === 0)
    return point

  let current = point

  for (let step = 0; step < MAX_NUDGES; step++) {
    let nearestRing: Ring | null = null
    let nearest = Number.POSITIVE_INFINITY

    for (const ring of exclusions) {
      const gap = distanceToRing(current, ring)
      if (gap < nearest) {
        nearest = gap
        nearestRing = ring
      }
    }

    if (!nearestRing || nearest >= clearance)
      return current

    // Away from the hazard's middle. Inside it (gap of zero) that is the only
    // direction that means anything.
    const away = normalise(sub(current, ringCentroid(nearestRing)))
    const push = away.x === 0 && away.y === 0 ? vec(0, -1) : away

    current = clampToField(add(current, scale(push, Math.max(clearance - nearest, clearance * 0.25))))
  }

  return current
}

/**
 * The approach to the gate, and the departure from it.
 *
 * A mob is not turned at a gate, it is lined up at one. So the route gets a
 * waypoint a little back from the gate on each side, along the line between
 * the two blocks, which is what makes the funnel readable on the map and
 * stops the corridor from cutting the corner into a fence.
 */
function gateApproach(from: Vec, gate: Vec, to: Vec, width: number): { before: Vec, after: Vec } {
  const inbound = normalise(sub(gate, from))
  const outbound = normalise(sub(to, gate))
  const lead = Math.max(width, 0.02)

  return {
    before: clampToField(sub(gate, scale(inbound, lead))),
    after: clampToField(add(gate, scale(outbound, lead))),
  }
}

export function planCorridor(request: PlanRequest): Corridor {
  const {
    fromBlock,
    toBlock,
    gate,
    exclusions = [],
    metresPerUnit,
    head = 60,
    clearanceM = DEFAULT_CLEARANCE_M,
  } = request

  const clearance = clearanceM / metresPerUnit
  const width = mobWidth(head, metresPerUnit)

  const start = ringCentroid(fromBlock)
  const finish = ringCentroid(toBlock)
  const { before, after } = gateApproach(start, gate, finish, width)

  /*
   * The gate itself is never nudged. It is a hole in a fence: if it sits close
   * to a hazard then the move is close to that hazard, and moving the drawn
   * line off the only opening would draw a route the mob cannot take. The
   * clearance the plan can honestly offer is on the approaches, and the
   * hazard check that follows is what tells a farmer if even that is not
   * enough.
   */
  const route = [
    nudgeClear(start, exclusions, clearance),
    nudgeClear(before, exclusions, clearance),
    gate,
    nudgeClear(after, exclusions, clearance),
    nudgeClear(finish, exclusions, clearance),
  ]

  // Consecutive waypoints that landed on top of one another after nudging add
  // nothing to the line and would show as a kink in the map.
  const points: [number, number][] = []
  for (const point of route) {
    const previous = points[points.length - 1]
    if (previous && Math.abs(previous[0] - point.x) < 1e-4 && Math.abs(previous[1] - point.y) < 1e-4)
      continue

    points.push([Number(point.x.toFixed(4)), Number(point.y.toFixed(4))])
  }

  return { points, width: Number(width.toFixed(4)) }
}

/**
 * The tightest the planned route comes to a hazard, in metres.
 *
 * Reported alongside the corridor rather than folded into a pass or fail, so
 * the dashboard can say "this route passes 30 m from the road" and let a
 * person decide. Some moves genuinely do run along a road and the farmer knows
 * it better than the planner does.
 */
export function corridorClearanceM(corridor: Corridor, exclusions: Ring[], metresPerUnit: number): number {
  if (exclusions.length === 0)
    return Number.POSITIVE_INFINITY

  let nearest = Number.POSITIVE_INFINITY
  for (const [x, y] of corridor.points)
    nearest = Math.min(nearest, distanceToNearestRing(vec(x, y), exclusions))

  return Number((nearest * metresPerUnit).toFixed(1))
}

/**
 * How far out the aircraft takes up station before it starts, as a multiple of
 * the standoff.
 *
 * It arrives from outside the flight zone and closes in, rather than appearing
 * at working distance. Stock that have something turn up on top of them react
 * to the arrival rather than to the pressure, and with a flighty mob that
 * first shock is enough to break it before the move has begun.
 */
export const LAUNCH_STANDOFF_MULTIPLE = 2.8

/**
 * Where the drone sits to start the move.
 *
 * Behind the mob relative to the first leg of the corridor, which is the
 * position a drover takes: pressure has to come from the side you want them
 * to leave.
 */
export function launchPosition(corridor: Corridor, mob: Vec, standoff: number): Vec {
  const next = corridor.points[1] ?? corridor.points[0]
  if (!next)
    return mob

  const heading = normalise(sub(vec(next[0], next[1]), mob))
  if (heading.x === 0 && heading.y === 0)
    return clampToField(add(mob, scale(rotate(vec(0, 1), 0), standoff)))

  return clampToField(sub(mob, scale(heading, standoff)))
}

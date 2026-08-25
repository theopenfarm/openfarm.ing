/**
 * The controller. Given where the mob is, decide where the aircraft should be.
 *
 * This is the module the whole feature turns on, and it is written from
 * stockmanship rather than from path planning. Two ideas do almost all the
 * work:
 *
 *  - **The flight zone.** An animal has a radius inside which it moves away
 *    from you and outside which it ignores you. Pressure is applied by
 *    entering it and released by leaving. A drone is an aerial drover, so the
 *    control output is how much of that zone to occupy.
 *  - **The point of balance.** Stock move away from pressure applied behind
 *    the shoulder. For a mob that means the aircraft belongs on the opposite
 *    side from where you want them to go, which is why the drive position is
 *    computed from the heading and never from the destination directly.
 *
 * Two consequences that a naive "fly at the animals" controller gets wrong,
 * and that this one is built around:
 *
 *  - Pushing harder does not make a mob move better. Past a point it makes
 *    them run, and a running mob splits. So the response to a mob that has
 *    sped up is to back OFF, which reads backwards until you have watched it.
 *  - The mob is led by its slowest member. Anchoring on the centroid walks the
 *    front half away and leaves the back half standing, which is how you
 *    arrive two short. The anchor is weighted toward the rearmost animal.
 *
 * Pressure comes off along two axes, and **height is the one reached for
 * first**. Backing away horizontally gives up the point of balance and the mob
 * stops; climbing sheds pressure while holding station, and takes the rotor
 * noise up with it. A stockman can only step back. A drone can step up, and it
 * should. Which is why standoff is a SLANT range: an aircraft 20 m out and
 * 30 m up is 36 m from the animal, and the animal is the one who decides.
 *
 * The other thing this watches is individual animals rather than the mob
 * average, through `distress.ts`. One animal bolting inside an otherwise
 * compliant mob is the start of every bad outcome this capability has, and the
 * average will not show it until it is too late. The answer is a ladder rather
 * than a switch - climb, then climb and give ground, then stop - because a
 * controller whose only response to a frightened animal is to abort would
 * abort constantly and never move anything.
 *
 * The same module runs the playground and would run a real flight. That is the
 * point of the playground: it is not a separate demonstration of the idea, it
 * is this file under test.
 */

import type { Breach, BreachMemory, Envelope } from './envelope'
import type { Corridor } from './planner'
import type { DistressReading, Track } from './distress'
import type { Ring, Vec } from './geometry'
import { assessDistress } from './distress'
import { assess } from './envelope'
import {
  add,
  centroid,
  clamp,
  clampToField,
  distance,
  distanceToNearestRing,
  length,
  normalise,
  pointInRing,
  rotate,
  scale,
  sub,
  vec,
} from './geometry'

export interface PilotView {
  /** Per-animal tracks. The same shape a real detector produces. */
  tracks: Track[]
  drone: Vec
  /** Height above ground, in metres. */
  altitudeM: number
  corridor: Corridor
  /**
   * The block the mob is being moved onto.
   *
   * Arrival is "the mob is on the new block", not "the mob's middle reached
   * the last waypoint". They are not the same and the difference showed up as
   * a move that had plainly finished being aborted for running out of time,
   * with every animal already standing on fresh grass.
   */
  destination?: Ring
  exclusions: Ring[]
  metresPerUnit: number
  tickSeconds: number
  /** Mob speed this tick, averaged across the animals. */
  mobSpeedMs: number
  /** How long the mob has been under pressure. */
  driveMinutes: number
}

export interface PilotMemory {
  breaches: BreachMemory
  /** Current back-off, as a multiple of the envelope's minimum standoff. */
  standoffMultiple: number
  /** Current height, in metres. Ramped rather than jumped. */
  altitudeM: number
  /** Which corridor waypoint the mob is being walked toward. */
  legIndex: number
  /** Consecutive ticks the mob has been agitated, for the response ladder. */
  agitatedTicks: number
  /** How many times this move has had to ease off. Kept for the move record. */
  easeOffs: number
}

export interface PilotCommand {
  /** Where the aircraft should be, in normalised field space. */
  moveTo: Vec
  /** The height it should hold, in metres. */
  altitudeM: number
  /** The slant standoff it is holding, in metres. Reported, not just used. */
  standoffM: number
  /** What the mob is telling us, per animal. */
  distress: DistressReading
  /** Set when the move must stop. */
  abort: Breach | null
  /** True once the mob is on the destination block. */
  arrived: boolean
}

export function freshMemory(envelope?: Envelope): PilotMemory {
  return {
    breaches: {},
    standoffMultiple: 1.25,
    altitudeM: envelope?.minAltitudeM ?? 20,
    legIndex: 1,
    agitatedTicks: 0,
    easeOffs: 0,
  }
}

/** How close the mob's middle has to get before a waypoint counts as reached. */
const ARRIVE_RADIUS_M = 35

/**
 * Share of the mob that has to be on the new block for the move to be done.
 *
 * Not all of them. A move is finished when the body of the mob is across and
 * settling; whoever hung back is a straggler, and the answer to a straggler is
 * to report it so somebody walks out, not to keep an aircraft hanging over the
 * rest of the mob until the last one gives in.
 */
const ARRIVED_SHARE = 0.8

/** The most the aircraft will back off, as a multiple of minimum standoff. */
const MAX_STANDOFF_MULTIPLE = 2.6

/** How quickly the back-off responds. Per tick, so it is a smooth ramp. */
const BACK_OFF_STEP = 0.06
const CLOSE_IN_STEP = 0.02

/**
 * Fractions of the speed limit that mean "too fast" and "stalled".
 *
 * The gap between them is deliberate. A single threshold makes the controller
 * hunt: it backs off, the mob slows below the line, it closes in, the mob
 * speeds up, forever. Stock walked by something that keeps surging at them do
 * not settle, so the dead band is a welfare property, not a tuning nicety.
 */
const TOO_FAST = 0.85
const STALLED = 0.4

/**
 * How much of the anchor is the rearmost animal rather than the mob's middle.
 *
 * Entirely on the rear animal would have the aircraft chase one straggler and
 * abandon the mob; entirely on the centroid leaves stragglers behind. Weighted
 * toward the back is what a drover does.
 */
const REAR_WEIGHT = 0.45

/**
 * The furthest behind the mob's middle the anchor will sit, as a multiple of
 * the standoff distance.
 *
 * Without a cap, one animal that stops to graze drags the aircraft back with
 * it and the pressure comes off the whole mob to chase a single straggler.
 * That is not what a drover does: the mob is walked on, and the straggler
 * either follows or is reported.
 */
const MAX_ANCHOR_LAG = 2.2

/**
 * The least ground distance the aircraft keeps, as a fraction of the standoff.
 *
 * Height buys slant range, but it must not buy so much that the aircraft ends
 * up directly over the mob: pressure from above has no direction in it, and
 * driving stock is entirely about which side the pressure comes from. So the
 * aircraft stays behind the point of balance whatever height it is at, and
 * climbing simply means the total distance grows.
 */
const MIN_GROUND_FRACTION = 0.72

/** Clearance the aircraft keeps from a hazard when steering the mob past it. */
const STEER_LOOKAHEAD_M = 70

/** How hard the heading is turned away from a hazard, in radians. */
const MAX_STEER = 0.9

/**
 * The animal furthest back along the direction of travel.
 *
 * Furthest back, not furthest away: an animal off to one side is with the mob,
 * an animal behind it is not yet moving.
 */
function rearmost(animals: Vec[], middle: Vec, heading: Vec): Vec {
  let furthest = middle
  let lowest = Number.POSITIVE_INFINITY

  for (const animal of animals) {
    const offset = sub(animal, middle)
    const along = offset.x * heading.x + offset.y * heading.y
    if (along < lowest) {
      lowest = along
      furthest = animal
    }
  }

  return furthest
}

/**
 * Turn the heading away from a hazard the mob would otherwise walk toward.
 *
 * Looks one lookahead ahead of the mob and, if that point is tight to a
 * hazard, rotates the heading to whichever side opens more room. Turning the
 * heading rather than moving the aircraft is what actually steers a mob: the
 * animals go where the pressure is not.
 */
function steerAround(middle: Vec, heading: Vec, exclusions: Ring[], metresPerUnit: number): Vec {
  if (exclusions.length === 0)
    return heading

  const lookahead = STEER_LOOKAHEAD_M / metresPerUnit
  const ahead = add(middle, scale(heading, lookahead))
  const clearance = distanceToNearestRing(ahead, exclusions) * metresPerUnit

  if (clearance >= STEER_LOOKAHEAD_M)
    return heading

  // How urgently to turn: none at full clearance, hardest with none left.
  const urgency = clamp(1 - clearance / STEER_LOOKAHEAD_M, 0, 1)
  const turn = MAX_STEER * urgency

  const left = distanceToNearestRing(add(middle, scale(rotate(heading, -turn), lookahead)), exclusions)
  const right = distanceToNearestRing(add(middle, scale(rotate(heading, turn), lookahead)), exclusions)

  return normalise(rotate(heading, left > right ? -turn : turn))
}

/*
 * The response ladder for a distressed mob.
 *
 * Graded rather than binary. Climbing is tried first because it sheds pressure
 * without giving up the point of balance, so the mob keeps walking; ground is
 * only given up when height alone has not settled them. Aborting is the last
 * rung and belongs to `envelope.ts`, which is watching the same signal on a
 * longer fuse.
 */

/** Distress share above which the aircraft starts to ease off. */
const EASE_AT = 0.4

/** Multiple of `EASE_AT` at which it gives ground as well as height. */
const GIVE_GROUND_AT = 1.6

/** How fast it climbs and descends, in metres per tick. */
const CLIMB_STEP = 2.5
const DESCEND_STEP = 0.6

/** Ticks of calm before it comes back down. Longer than the climb, on purpose. */
const SETTLE_TICKS = 20

/**
 * Slant range from the aircraft to the nearest animal, in metres.
 *
 * The number the whole standoff rule is written in. Ground distance alone
 * would let the controller claim room it has not given: a drone sitting 20 m
 * from a mob at 15 m up is 25 m away as far as the animal is concerned, and
 * the animal is the one the rule is for.
 */
function slantRangeM(tracks: Track[], drone: Vec, altitudeM: number, metresPerUnit: number): number {
  if (tracks.length === 0)
    return Number.POSITIVE_INFINITY

  const ground = Math.min(...tracks.map(track => distance(track.position, drone))) * metresPerUnit

  return Math.hypot(ground, altitudeM)
}

/**
 * One tick of control. Mutates `memory`, which is what carries the back-off
 * ramp, the altitude and the breach counters between ticks.
 */
export function command(view: PilotView, envelope: Envelope, memory: PilotMemory): PilotCommand {
  const { tracks, corridor, exclusions, metresPerUnit } = view
  const animals = tracks.map(track => track.position)
  const middle = centroid(animals)

  const arriveRadius = ARRIVE_RADIUS_M / metresPerUnit
  const last = corridor.points.length - 1

  // Walk the waypoint on once the mob has reached it. A while loop rather than
  // a single step because a short leg can be cleared inside one tick.
  while (memory.legIndex < last) {
    const [wx, wy] = corridor.points[memory.legIndex]!
    if (distance(middle, vec(wx, wy)) > arriveRadius)
      break

    memory.legIndex++
  }

  const [tx, ty] = corridor.points[Math.min(memory.legIndex, last)] ?? [middle.x, middle.y]
  const target = vec(tx, ty)

  /*
   * Arrived when the mob is on the new block.
   *
   * The share, rather than every animal: a move is finished when the body of
   * the mob is across, and one or two that hung back are stragglers to report
   * rather than a reason to keep an aircraft over them. The waypoint test is
   * kept as the fallback for a scenario with no destination ring.
   */
  const onDestination = view.destination
    ? animals.filter(animal => pointInRing(animal, view.destination!)).length / Math.max(animals.length, 1)
    : 0

  const arrived = view.destination
    ? onDestination >= ARRIVED_SHARE
    : memory.legIndex >= last && distance(middle, target) <= arriveRadius

  const distress = assessDistress(tracks, metresPerUnit, view.tickSeconds)
  const closestApproachM = slantRangeM(tracks, view.drone, view.altitudeM, metresPerUnit)

  const abort = assess(
    {
      closestApproachM,
      distressRatio: distress.ratio,
      mobSpeedMs: view.mobSpeedMs,
      driveMinutes: view.driveMinutes,
      animals,
      exclusions,
      metresPerUnit,
    },
    envelope,
    memory.breaches,
  )

  /*
   * How agitated the mob is, on one scale.
   *
   * The worse of the two readings rather than a blend. They are different
   * failures - a mob moving fast together, and a mob moving oddly in pieces -
   * and averaging them lets a bad score on one be talked down by a good score
   * on the other, which is exactly the wrong behaviour.
   */
  const agitation = Math.max(
    distress.ratio / Math.max(envelope.maxDistressRatio, 1e-6) * EASE_AT,
    view.mobSpeedMs / Math.max(envelope.maxMobSpeedMs, 1e-6) * EASE_AT / TOO_FAST,
    distress.peak >= 0.8 ? EASE_AT * 1.05 : 0,
  )

  const easing = agitation > EASE_AT
  if (easing) {
    if (memory.agitatedTicks === 0)
      memory.easeOffs++

    memory.agitatedTicks++
  }
  else {
    memory.agitatedTicks = Math.max(0, memory.agitatedTicks - 1)
  }

  /*
   * Rung one: height.
   *
   * Climbs whenever the mob is unsettled, and comes back down only after it
   * has been calm for a while. Asymmetric on purpose: going up is a response
   * to an animal, coming down is a decision, and something that dropped back
   * on the first quiet tick would sit there yo-yoing over their heads.
   */
  if (easing)
    memory.altitudeM = Math.min(envelope.maxAltitudeM, memory.altitudeM + CLIMB_STEP)
  else if (memory.agitatedTicks === 0 && memory.breaches.speed === 0)
    memory.altitudeM = Math.max(envelope.minAltitudeM, memory.altitudeM - DESCEND_STEP)

  /*
   * Rung two: ground.
   *
   * Only once height has been tried and the mob is still unsettled, or once
   * enough ticks have passed that climbing plainly is not the answer. Backing
   * off costs the point of balance and the mob stops walking, so it is the
   * expensive move and it goes second.
   */
  const heightSpent = memory.altitudeM >= envelope.maxAltitudeM * 0.75
  const persistent = memory.agitatedTicks > SETTLE_TICKS

  if (easing && (heightSpent || persistent || agitation > EASE_AT * GIVE_GROUND_AT))
    memory.standoffMultiple = Math.min(MAX_STANDOFF_MULTIPLE, memory.standoffMultiple + BACK_OFF_STEP)
  else if (!easing && view.mobSpeedMs < envelope.maxMobSpeedMs * STALLED && !arrived)
    memory.standoffMultiple = Math.max(1, memory.standoffMultiple - CLOSE_IN_STEP)

  // An animal that has walked toward the aircraft closes the gap on its own,
  // and the aircraft yields rather than holding its ground.
  if (closestApproachM < envelope.minStandoffM) {
    memory.standoffMultiple = Math.min(MAX_STANDOFF_MULTIPLE, memory.standoffMultiple + BACK_OFF_STEP * 2)
    memory.altitudeM = Math.min(envelope.maxAltitudeM, memory.altitudeM + CLIMB_STEP)
  }

  /*
   * The slant standoff is the budget; height is already spent out of it.
   *
   * So the ground distance is whatever is left over once the altitude leg of
   * the triangle is accounted for. An aircraft at 60 m up over a 40 m standoff
   * has already met it and can sit almost directly above the mob, which is
   * exactly what you want of something that has climbed to calm them down.
   */
  const standoffM = envelope.minStandoffM * memory.standoffMultiple
  const groundM = Math.max(
    standoffM * MIN_GROUND_FRACTION,
    Math.sqrt(Math.max(standoffM * standoffM - memory.altitudeM * memory.altitudeM, 0)),
  )
  const standoff = groundM / metresPerUnit

  const heading = steerAround(middle, normalise(sub(target, middle)), exclusions, metresPerUnit)

  /*
   * Off the back of the mob, weighted toward whoever is last.
   *
   * When the mob has arrived the aircraft still holds position rather than
   * flying at them: the move is over, and the last thing a settling mob needs
   * is something overhead.
   */
  const lagCap = (envelope.minStandoffM * MAX_ANCHOR_LAG) / metresPerUnit
  const rearOffset = sub(rearmost(animals, middle, heading), middle)
  const lag = length(rearOffset)

  const anchor = arrived
    ? middle
    : add(middle, scale(lag > lagCap ? scale(normalise(rearOffset), lagCap) : rearOffset, REAR_WEIGHT))

  const moveTo = clampToField(sub(anchor, scale(heading, standoff)))

  return {
    moveTo,
    altitudeM: Number(memory.altitudeM.toFixed(1)),
    standoffM: Number(standoffM.toFixed(1)),
    distress,
    abort,
    arrived,
  }
}

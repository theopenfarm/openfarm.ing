/**
 * A modelled paddock with animals in it, so the controller can be watched and
 * asserted on without a drone, a field or a mob of somebody's cattle.
 *
 * The animals are a flocking model with a flight zone: they hold together,
 * keep out of each other's way, drift while they graze, and move away from the
 * aircraft in proportion to how far inside their flight zone it has come. That
 * is enough to reproduce the three behaviours the controller has to survive,
 * and all three are emergent rather than scripted:
 *
 *  - a mob **splits** when it is pushed too hard,
 *  - **stragglers** are left when the anchor sits too far forward,
 *  - a mob **pushed toward a hazard** keeps going until something turns it.
 *
 * It is a model of livestock, not a claim about them. What it is for is
 * regression: `pilot.ts` is the code that would fly, and this is the world it
 * is tested in. A controller that cannot be replayed has no business near
 * animals, so there is no `Date` and no `Math.random` anywhere in here - same
 * fixed-seed discipline as `app/Support/content/demo-field.ts`.
 */

import type { Breach, Envelope, PressureProfile } from './envelope'
import type { Corridor } from './planner'
import type { DistressReading, Track } from './distress'
import type { PilotMemory } from './pilot'
import type { Ring, Vec } from './geometry'
import { assessDistress, smoothTurn } from './distress'
import { envelopeFor } from './envelope'
import { command, freshMemory } from './pilot'
import { LAUNCH_STANDOFF_MULTIPLE, launchPosition, planCorridor } from './planner'
import {
  add,
  centroid,
  clamp,
  distance,
  distanceToNearestRing,
  length,
  normalise,
  pointInRing,
  ringCentroid,
  rng,
  scale,
  sub,
  vec,
} from './geometry'

export interface Hazard {
  ring: Ring
  /** What it is, in the words the map labels it with. */
  label: string
}

export interface World {
  slug: string
  name: string
  /** One line, what this scenario is for. */
  brief: string
  /** The whole playground, both blocks and everything between them. */
  extent: Ring
  fromBlock: Ring
  toBlock: Ring
  /** The opening between the two blocks. */
  gate: Vec
  hazards: Hazard[]
  /** How many metres one unit of normalised space is worth. */
  metresPerUnit: number
  head: number
  profile: PressureProfile
  /**
   * Share of the mob that is flighty, 0..1.
   *
   * Every real mob has a few. They carry a bigger flight zone and react harder
   * to the same pressure, so they break first and pull others with them. This
   * is the thing the mob average cannot see: a handful of animals coming apart
   * inside a mob whose mean speed is a perfectly legal walk, which is exactly
   * what `distress.ts` exists to catch.
   */
  skittish?: number
  seed: number
}

export interface Animal {
  x: number
  y: number
  vx: number
  vy: number
  /**
   * Smoothed heading change, radians per tick.
   *
   * Carried on the animal because that is where a real tracker would carry it
   * too: distress is read off how an animal has been moving over several
   * frames, not off where it is in this one.
   */
  turn: number
  /** A flighty one. Bigger flight zone, harder reaction to the same pressure. */
  flighty: boolean
}

export type SimStatus = 'driving' | 'arrived' | 'aborted'

export interface SimState {
  tick: number
  animals: Animal[]
  drone: Vec
  /** Height above ground, in metres. The controller's other output. */
  altitudeM: number
  corridor: Corridor
  status: SimStatus
  abort: Breach | null
  /** The slant standoff the aircraft is currently holding, in metres. */
  standoffM: number
  /** What the mob is telling us this tick, per animal. */
  distress: DistressReading
  /** The highest it had to climb, which the move record keeps. */
  peakAltitudeM: number
  /** How many separate times it had to ease off. */
  easeOffs: number
  /** Mob speed this tick. */
  mobSpeedMs: number
  /** The worst reading so far, which is what the move record keeps. */
  peakMobSpeedMs: number
  closestApproachM: number
  driveMinutes: number
  /** Animals still on the block they started from, once the move is over. */
  stragglers: number
  memory: PilotMemory
  envelope: Envelope
  world: World
}

/** One second per tick, which is the rate a real control loop would run at. */
export const TICK_SECONDS = 1

/*
 * The animals.
 *
 * Every distance here is in metres and converted at use, because these are the
 * numbers somebody with stock would recognise and argue with.
 */

/**
 * How far inside this the aircraft starts to move them.
 *
 * Measured as SLANT range, so height counts. An aircraft directly overhead at
 * 90 m is outside the flight zone and an aircraft 30 m away at 20 m up is well
 * inside it, which is what makes climbing a real way to take pressure off
 * rather than a cosmetic one.
 */
const FLIGHT_ZONE_M = 85
/** Closer than this and they are leaving, hard. */
const PANIC_ZONE_M = 30
/** How close they will stand to one another. */
const PERSONAL_SPACE_M = 7
/** How far away another animal still counts as company. */
const COMPANY_M = 55
/** A walk, and the fastest they will go. */
const WALK_MS = 1.25
const MAX_SPEED_MS = 3.4
/** How hard they avoid a road or a ditch. */
const HAZARD_AVOID_M = 35

/** How much bigger a flighty animal's flight zone is, and how much harder it goes. */
const FLIGHTY_ZONE = 1.7
const FLIGHTY_PUSH = 2.1

const COHESION = 0.055
const SEPARATION = 0.085
const ALIGNMENT = 0.020

/**
 * How much harder a threatened mob holds together.
 *
 * Bunching under threat is the single most important thing herd animals do,
 * and leaving it out was why an early version of this simulator would not move
 * at all: pressure applied to the back of a loose mob pushed three animals
 * into empty space and never reached the rest. Real stock close up first and
 * then move as a body, which is what lets one drover - or one aircraft - move
 * two hundred head from behind.
 */
const THREAT_COHESION = 4.5
const DRONE_PUSH = 0.85
const HAZARD_PUSH = 0.9
const FENCE_PUSH = 0.5
const GRAZE_DRIFT = 0.010
/** Velocity retained each tick. Stock stop when nothing is pushing them. */
const DAMPING = 0.82

/** How fast the aircraft repositions. Comfortably faster than the mob. */
const DRONE_SPEED_MS = 12

function toVec(animal: Animal): Vec {
  return { x: animal.x, y: animal.y }
}

/**
 * How much ground a grazing mob covers, in metres.
 *
 * Grows with the square root of head count, because a mob spreads over an area
 * rather than a line. Forty head sit in about a 90 m circle; a hundred and
 * sixty in about 180 m.
 */
function grazingRadiusM(head: number): number {
  return 18 + Math.sqrt(Math.max(head, 1)) * 6
}

/**
 * Put the mob on the starting block, as a mob.
 *
 * Clustered rather than spread evenly across the block, because that is what
 * stock do: they are a herd animal and they graze in company. It also matters
 * for what this simulator is for. A mob sown uniformly over 30 hectares is
 * already in half a dozen disconnected bunches at tick zero, so every run
 * would abort on `split` before the aircraft had done anything, and the split
 * detector would be measuring the initial condition instead of the controller.
 *
 * Rejection sampling against the block ring rather than a bounding box, so a
 * scenario with an L-shaped or tapered block does not start with animals in a
 * hedge. The attempt cap keeps a badly drawn ring from spinning forever, and
 * falling back to the mob's middle is visibly wrong on the map, which is the
 * right way for a bad scenario to fail.
 */
function scatter(world: World): Animal[] {
  const random = rng(world.seed)
  const middle = ringCentroid(world.fromBlock)
  const radius = grazingRadiusM(world.head) / world.metresPerUnit
  const animals: Animal[] = []

  while (animals.length < world.head) {
    let placed: Vec | null = null

    for (let attempt = 0; attempt < 60 && !placed; attempt++) {
      // Square root of the draw, so the disc fills evenly rather than bunching
      // everything at the middle.
      const angle = random() * Math.PI * 2
      const spread = Math.sqrt(random()) * radius
      const candidate = vec(middle.x + Math.cos(angle) * spread, middle.y + Math.sin(angle) * spread)

      if (pointInRing(candidate, world.fromBlock))
        placed = candidate
    }

    const at = placed ?? middle
    animals.push({
      x: at.x,
      y: at.y,
      vx: 0,
      vy: 0,
      turn: 0,
      flighty: random() < (world.skittish ?? 0),
    })
  }

  return animals
}

export function createSim(world: World): SimState {
  const animals = scatter(world)
  const envelope = envelopeFor(world.profile)
  const mob = centroid(animals.map(toVec))

  const corridor = planCorridor({
    fromBlock: world.fromBlock,
    toBlock: world.toBlock,
    gate: world.gate,
    exclusions: world.hazards.map(hazard => hazard.ring),
    metresPerUnit: world.metresPerUnit,
    head: world.head,
  })

  const drone = launchPosition(
    corridor,
    mob,
    (envelope.minStandoffM * LAUNCH_STANDOFF_MULTIPLE) / world.metresPerUnit,
  )

  return {
    tick: 0,
    animals,
    drone,
    altitudeM: envelope.minAltitudeM,
    corridor,
    status: 'driving',
    abort: null,
    standoffM: envelope.minStandoffM,
    distress: { scores: animals.map(() => 0), peak: 0, ratio: 0, bolting: 0 },
    peakAltitudeM: envelope.minAltitudeM,
    easeOffs: 0,
    mobSpeedMs: 0,
    peakMobSpeedMs: 0,
    closestApproachM: Math.hypot(distance(drone, mob) * world.metresPerUnit, envelope.minAltitudeM),
    driveMinutes: 0,
    stragglers: 0,
    memory: freshMemory(envelope),
    envelope,
    world,
  }
}

/** The animals as the controller sees them: positions, velocities, turn rates. */
export function tracksOf(animals: Animal[]): Track[] {
  return animals.map(animal => ({
    position: { x: animal.x, y: animal.y },
    velocity: { x: animal.vx, y: animal.vy },
    turnRate: animal.turn,
  }))
}

/**
 * One animal's acceleration this tick.
 *
 * Written as forces rather than as a scripted path because the behaviours that
 * matter are the ones nobody scripted. A mob splits here because separation
 * beat cohesion under pressure, not because a scenario said "split at tick
 * 300", and that is the only kind of split worth testing a controller against.
 */
/*
 * The suppression below is for a linter bug, not for dead code.
 *
 * Every parameter here is used: `animal` on the `animal.flighty` lines, and
 * the rest throughout the body. pickier reports all six as unused, on this one
 * function and nowhere else in the file. Reducing the body to a one-line stub
 * does not clear it, and the identical signature in a file on its own lints
 * clean, so it is scope analysis going wrong somewhere in the accumulated
 * file rather than anything wrong here. Worth re-checking on a pickier bump.
 */
// eslint-disable-next-line pickier/no-unused-vars
function accelerate(
  animal: Animal,
  animals: Animal[],
  drone: Vec,
  altitudeM: number,
  world: World,
  random: () => number,
): Vec {
  const scale2 = world.metresPerUnit
  const here = toVec(animal)

  let steer = vec(0, 0)
  let neighbours = 0
  let flock = vec(0, 0)
  let heading = vec(0, 0)

  for (const other of animals) {
    if (other === animal)
      continue

    const gap = distance(here, toVec(other)) * scale2

    if (gap < PERSONAL_SPACE_M && gap > 1e-6) {
      const away = normalise(sub(here, toVec(other)))
      steer = add(steer, scale(away, SEPARATION * (1 - gap / PERSONAL_SPACE_M)))
    }

    if (gap < COMPANY_M) {
      neighbours++
      flock = add(flock, toVec(other))
      heading = add(heading, vec(other.vx, other.vy))
    }
  }

  /*
   * The aircraft.
   *
   * Squared falloff rather than linear: an animal barely notices something at
   * the edge of its flight zone and leaves in earnest once it is well inside,
   * which is exactly the non-linearity that makes standoff the right control
   * output. Inside the panic zone the response is flat out, and that is where
   * a mob comes apart.
   */
  const groundGap = distance(here, drone) * scale2
  const droneGap = Math.hypot(groundGap, altitudeM)
  const zone = FLIGHT_ZONE_M * (animal.flighty ? FLIGHTY_ZONE : 1)
  const reaction = DRONE_PUSH * (animal.flighty ? FLIGHTY_PUSH : 1)

  if (droneGap < zone) {
    const intrusion = 1 - droneGap / zone
    const push = droneGap < PANIC_ZONE_M ? 1 : intrusion * intrusion

    /*
     * Away from the aircraft's position on the ground, not from the aircraft
     * itself. An animal directly underneath one has no horizontal direction to
     * run in and would otherwise get a zero vector and stand there, which is
     * neither what a cow does nor what makes the overhead case testable.
     */
    const away = groundGap > 1e-6
      ? normalise(sub(here, drone))
      : normalise(vec(random() - 0.5, random() - 0.5))

    steer = add(steer, scale(away, reaction * push))
  }

  // Bunching scales with how far inside the flight zone the aircraft is, so a
  // mob nobody is pressing grazes loosely and a pressed one closes up.
  const threat = clamp(1 - droneGap / zone, 0, 1)

  if (neighbours > 0) {
    const middle = scale(flock, 1 / neighbours)
    const pull = COHESION * (1 + THREAT_COHESION * threat * threat)
    steer = add(steer, scale(normalise(sub(middle, here)), pull))
    steer = add(steer, scale(normalise(scale(heading, 1 / neighbours)), ALIGNMENT))
  }

  // Hazards, and the outer fence. Both are ground the animal will not walk
  // onto, but a road it can see is avoided from further out than a fence.
  for (const hazard of world.hazards) {
    const gap = distanceToNearestRing(here, [hazard.ring]) * scale2
    if (gap < HAZARD_AVOID_M) {
      const away = normalise(sub(here, ringCentroid(hazard.ring)))
      steer = add(steer, scale(away, HAZARD_PUSH * (1 - gap / HAZARD_AVOID_M)))
    }
  }

  if (!pointInRing(here, world.extent))
    steer = add(steer, scale(normalise(sub(ringCentroid(world.extent), here)), FENCE_PUSH))

  // Grazing drift, so a mob nobody is pushing does not stand frozen.
  steer = add(steer, scale(vec(random() - 0.5, random() - 0.5), GRAZE_DRIFT))

  return steer
}

/**
 * Advance the world one tick.
 *
 * Returns a new state object but reuses `memory`, which is what carries the
 * controller's back-off ramp and breach counters. Once the move is over the
 * animals keep being simulated for a few ticks so the picture settles rather
 * than freezing mid-stride, but the aircraft holds station.
 */
export function step(state: SimState): SimState {
  const { world } = state
  const scale2 = world.metresPerUnit

  const view = {
    tracks: tracksOf(state.animals),
    drone: state.drone,
    altitudeM: state.altitudeM,
    corridor: state.corridor,
    destination: world.toBlock,
    exclusions: world.hazards.map(hazard => hazard.ring),
    metresPerUnit: scale2,
    tickSeconds: TICK_SECONDS,
    mobSpeedMs: state.mobSpeedMs,
    driveMinutes: state.driveMinutes,
  }

  const order = state.status === 'driving'
    ? command(view, state.envelope, state.memory)
    : null

  /*
   * An aborted move does not mean an aircraft that stops dead. It means one
   * that leaves, and leaves UPWARDS first: climbing takes the pressure off
   * fastest and does not drive the mob anywhere on the way out. So the abort
   * behaviour is a climb to the ceiling plus a withdrawal to well outside the
   * flight zone, which is also what you would want a person to do.
   */
  const abort = order?.abort ?? state.abort
  const status: SimStatus = abort ? 'aborted' : order?.arrived ? 'arrived' : state.status

  const mob = centroid(view.tracks.map(track => track.position))
  const target = order && !abort
    ? order.moveTo
    : add(mob, scale(normalise(sub(state.drone, mob)), (FLIGHT_ZONE_M * 1.4) / scale2))

  const altitudeM = order && !abort
    ? order.altitudeM
    : Math.min(state.envelope.maxAltitudeM, state.altitudeM + 4)

  const droneStep = (DRONE_SPEED_MS * TICK_SECONDS) / scale2
  const toTarget = sub(target, state.drone)
  const drone = length(toTarget) <= droneStep
    ? target
    : add(state.drone, scale(normalise(toTarget), droneStep))

  // Seeded from the tick, so a state stepped twice gives the same answer and
  // the playground can be scrubbed backwards and forwards.
  const random = rng(world.seed + state.tick * 7919)

  const maxStep = (MAX_SPEED_MS * TICK_SECONDS) / scale2
  const animals: Animal[] = state.animals.map((animal) => {
    const steer = accelerate(animal, state.animals, drone, altitudeM, world, random)

    let vx = (animal.vx + steer.x * ((WALK_MS * TICK_SECONDS) / scale2)) * DAMPING
    let vy = (animal.vy + steer.y * ((WALK_MS * TICK_SECONDS) / scale2)) * DAMPING

    const speed = Math.hypot(vx, vy)
    if (speed > maxStep) {
      vx = (vx / speed) * maxStep
      vy = (vy / speed) * maxStep
    }

    return {
      x: animal.x + vx,
      y: animal.y + vy,
      vx,
      vy,
      // How much this animal changed its mind, smoothed. This is the signal
      // `distress.ts` reads to tell a frightened animal from a brisk one.
      turn: smoothTurn(animal.turn, { x: animal.vx, y: animal.vy }, { x: vx, y: vy }),
      flighty: animal.flighty,
    }
  })

  const mobSpeedMs = animals.length === 0
    ? 0
    : (animals.reduce((sum, a) => sum + Math.hypot(a.vx, a.vy), 0) / animals.length) * scale2 / TICK_SECONDS

  // Slant range, so height counts as distance. Same measure the envelope's
  // standoff rule is written in.
  const closestApproachM = animals.length === 0
    ? Number.POSITIVE_INFINITY
    : Math.hypot(Math.min(...animals.map(a => distance(toVec(a), drone))) * scale2, altitudeM)

  const driving = status === 'driving'

  return {
    ...state,
    tick: state.tick + 1,
    animals,
    drone,
    altitudeM,
    status,
    abort,
    standoffM: order?.standoffM ?? state.standoffM,
    distress: order?.distress ?? assessDistress(tracksOf(animals), scale2, TICK_SECONDS),
    peakAltitudeM: Math.max(state.peakAltitudeM, altitudeM),
    easeOffs: state.memory.easeOffs,
    mobSpeedMs,
    peakMobSpeedMs: Math.max(state.peakMobSpeedMs, mobSpeedMs),
    closestApproachM: Math.min(state.closestApproachM, closestApproachM),
    // The clock stops when the move does. A mob standing in the destination
    // block is not still being driven.
    driveMinutes: driving ? ((state.tick + 1) * TICK_SECONDS) / 60 : state.driveMinutes,
    stragglers: animals.filter(a => pointInRing(toVec(a), world.fromBlock)).length,
  }
}

export interface SimOutcome {
  status: SimStatus
  ticks: number
  driveMinutes: number
  peakMobSpeedMs: number
  closestApproachM: number
  /** The highest the aircraft had to climb to keep the mob settled. */
  peakAltitudeM: number
  /** How many separate times it had to ease off. */
  easeOffs: number
  /** The worst individual distress reading seen across the move. */
  peakDistress: number
  stragglers: number
  /** Animals that finished on the destination block. */
  arrived: number
  abortReason: string
  abortKind: string
  standoffM: number
  corridor: Corridor
  state: SimState
}

/**
 * Run a world to a conclusion.
 *
 * `maxTicks` is a backstop, not the normal exit: a move that neither arrives
 * nor aborts inside it is itself a result worth seeing, and the returned
 * status says which of the three happened.
 */
export function run(world: World, maxTicks = 1800): SimOutcome {
  let state = createSim(world)
  let peakDistress = 0

  while (state.tick < maxTicks && state.status === 'driving') {
    state = step(state)
    peakDistress = Math.max(peakDistress, state.distress.peak)
  }

  const arrived = state.animals.filter(a => pointInRing(toVec(a), world.toBlock)).length

  return {
    status: state.status,
    ticks: state.tick,
    driveMinutes: Number(state.driveMinutes.toFixed(2)),
    peakMobSpeedMs: Number(state.peakMobSpeedMs.toFixed(2)),
    closestApproachM: Number(state.closestApproachM.toFixed(1)),
    peakAltitudeM: Number(state.peakAltitudeM.toFixed(1)),
    easeOffs: state.memory.easeOffs,
    peakDistress: Number(peakDistress.toFixed(3)),
    stragglers: state.stragglers,
    arrived,
    abortReason: state.abort?.reason ?? '',
    abortKind: state.abort?.kind ?? '',
    standoffM: state.standoffM,
    corridor: state.corridor,
    state,
  }
}

/** Clearance from the mob to the nearest hazard right now, in metres. */
export function hazardClearanceM(state: SimState): number {
  const rings = state.world.hazards.map(hazard => hazard.ring)
  if (rings.length === 0)
    return Number.POSITIVE_INFINITY

  let nearest = Number.POSITIVE_INFINITY
  for (const animal of state.animals)
    nearest = Math.min(nearest, distanceToNearestRing(toVec(animal), rings))

  return Number((nearest * state.world.metresPerUnit).toFixed(1))
}

/** Progress along the corridor, 0..1, for the playground's readout. */
export function progress(state: SimState): number {
  const last = state.corridor.points.length - 1
  if (last <= 0)
    return 1

  const legs = state.memory.legIndex
  return clamp(legs / last, 0, 1)
}

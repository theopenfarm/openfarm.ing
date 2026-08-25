/**
 * The welfare envelope: how hard a drone is allowed to push a mob, and what
 * counts as having pushed too hard.
 *
 * This module is the reason the capability is defensible. Under §3 TierSchG an
 * animal may not be driven beyond its capacity or caused avoidable distress,
 * and "the software was careful" is not an answer. So the limits are named,
 * stored on the move at authorisation, checked every tick, and reported
 * afterwards whether or not anything went wrong.
 *
 * The numbers come from how stock are actually handled rather than from what
 * an airframe can do:
 *
 *  - **Standoff.** A drone inside a mob's flight zone applies pressure; inside
 *    it too far, the mob runs. 25 m is a working default for cattle used to
 *    machinery. Sheep with lambs at foot need more.
 *  - **Mob speed.** A walk is roughly 1.2 m/s, a trot about 2.5. Driving stock
 *    at a trot is the thing that costs condition, causes injury on hard ground
 *    and separates lambs from ewes, so the limit sits between the two.
 *  - **Drive duration.** Twenty minutes is a long way for a mob to be walked
 *    under pressure. Past it the move stops, finished or not.
 *  - **Rest.** How long the mob is left alone afterwards before anything may
 *    drive it again, so two capabilities cannot take turns on the same animals.
 *  - **Altitude.** The second pressure axis, and the more useful one. Climbing
 *    sheds pressure without giving up position, and it takes the noise up with
 *    it, so the controller reaches for height before it reaches for distance.
 *    The ceiling is the Open category's, not the airframe's.
 *  - **Distress.** How much of the mob may be frightened, from `distress.ts`.
 *    Every other limit here is about the mob as a body; this is the one that
 *    notices a single animal coming apart, which is where a move actually
 *    starts to go wrong.
 *
 * A momentary excursion is not a breach. Animals accelerate for their own
 * reasons and a controller that aborted on one fast tick would abort on every
 * move. What counts is a limit held past `GRACE_TICKS`, which is what
 * separates "the mob briefly picked up" from "the mob is running".
 */

import type { Ring, Vec } from './geometry'
import { distanceToNearestRing, groups, pointInRing } from './geometry'

export type PressureProfile = 'calm' | 'standard' | 'shy'

export interface Envelope {
  /**
   * How close the aircraft may come to the nearest animal, as SLANT range.
   *
   * Slant rather than ground distance, because that is what the animal
   * experiences. A drone 20 m out and 15 m up is 25 m away from the animal, and
   * treating it as 20 would let the controller buy horizontal room it has not
   * actually given.
   */
  minStandoffM: number
  /** Above this the mob is no longer walking. */
  maxMobSpeedMs: number
  /** A drive longer than this is stopped. */
  maxDriveMinutes: number
  /** How long the mob is left alone before it may be driven again. */
  restAfterMinutes: number
  /** The lowest the aircraft will work. Below it the mob reacts to the airframe. */
  minAltitudeM: number
  /** The highest it will climb to shed pressure. Bounded by the Open category. */
  maxAltitudeM: number
  /**
   * Share of the mob that may show distress before the move stops.
   *
   * Small on purpose. This is not "how many animals may be frightened", it is
   * "how many may be frightened for longer than a few seconds before a person
   * gets involved", and for a shy mob the honest answer is barely any.
   */
  maxDistressRatio: number
}

export type BreachKind = 'standoff' | 'speed' | 'duration' | 'split' | 'straggler' | 'exclusion' | 'distress'

export interface Breach {
  kind: BreachKind
  /** One line, in the words the move log and the dashboard both use. */
  reason: string
}

/**
 * Defaults per profile.
 *
 * `shy` is the one that matters. Ewes with lambs at foot split under pressure
 * a mob of dry cows would walk away from, and a split mob with lambs left
 * behind is the worst outcome this capability can produce. So the shy profile
 * stands further off, accepts a slower move, and gives up sooner.
 */
export const ENVELOPES: Record<PressureProfile, Envelope> = {
  calm: {
    minStandoffM: 18,
    maxMobSpeedMs: 1.8,
    maxDriveMinutes: 25,
    restAfterMinutes: 90,
    minAltitudeM: 15,
    maxAltitudeM: 110,
    maxDistressRatio: 0.12,
  },
  standard: {
    minStandoffM: 25,
    maxMobSpeedMs: 1.6,
    maxDriveMinutes: 20,
    restAfterMinutes: 120,
    minAltitudeM: 20,
    maxAltitudeM: 110,
    maxDistressRatio: 0.08,
  },
  shy: {
    minStandoffM: 40,
    maxMobSpeedMs: 1.2,
    maxDriveMinutes: 12,
    restAfterMinutes: 180,
    minAltitudeM: 35,
    maxAltitudeM: 110,
    maxDistressRatio: 0.04,
  },
}

export function envelopeFor(profile: string | null | undefined): Envelope {
  return ENVELOPES[(profile ?? 'standard') as PressureProfile] ?? ENVELOPES.standard
}

/**
 * How long a limit may be held before it counts as a breach.
 *
 * In ticks rather than seconds so the sim and the flight loop agree without
 * either having to know the other's rate; `TICK_SECONDS` in `sim.ts` converts.
 */
export const GRACE_TICKS = 12

/**
 * Limits that need longer than the default before they count.
 *
 * Distress gets by far the most, and the number is not arbitrary: the
 * controller's answer to an agitated mob is to climb, and climbing from the
 * working height to the ceiling takes about forty ticks. A grace shorter than
 * that would abort every move before its own remedy had finished being
 * applied, which is what the first version of this did - `spooked` stopped at
 * tick 14 with the aircraft still on its way up.
 *
 * A split gets a little more than the default for the same kind of reason: a
 * mob funnelling through a gate is in two pieces by definition, and it needs
 * long enough to come back together on the far side.
 */
const LONGER_GRACE: Partial<Record<BreachKind, number>> = {
  distress: 60,
  split: 25,
}

function graceFor(kind: BreachKind): number {
  return LONGER_GRACE[kind] ?? GRACE_TICKS
}

/**
 * How far apart two animals have to be before they are not in company, as a
 * multiple of the standoff distance.
 *
 * Tied to standoff rather than fixed, because it is the same question asked
 * from the other side: a gap the drone could stand in is a gap the mob is not
 * closing on its own.
 */
const SPLIT_REACH_MULTIPLE = 2.5

/**
 * Share of the mob the main body has to keep before it counts as split.
 *
 * A count of bunches is the wrong test and it was the first thing tried here.
 * A mob walking through a gate is briefly in two pieces by definition, and one
 * animal lagging thirty metres behind is a straggler rather than a split -
 * both would abort a perfectly good move. What matters is whether the mob is
 * still substantially together, so the test is on the size of the largest
 * bunch.
 */
const SPLIT_MAIN_BODY = 0.7

export interface EnvelopeReading {
  /** Slant range in metres from the aircraft to the nearest animal. */
  closestApproachM: number
  /** Share of the mob showing distress, from `assessDistress`. */
  distressRatio: number
  /** Mob speed in metres per second, averaged across the animals. */
  mobSpeedMs: number
  /** How long the mob has been under pressure. */
  driveMinutes: number
  /** Where the animals are, in normalised field space. */
  animals: Vec[]
  /** Ground the mob must not be pushed onto. */
  exclusions: Ring[]
  metresPerUnit: number
}

/**
 * Per-kind counters, so a breach has to be sustained rather than instantaneous.
 *
 * Carried by the caller rather than kept in module state: two moves may be in
 * the air at once, and a controller whose memory is global would judge one mob
 * by another's behaviour.
 */
export type BreachMemory = Partial<Record<BreachKind, number>>

/**
 * Check one tick against the envelope. Returns the breach that has been held
 * long enough to stop the move, or null.
 *
 * Order matters: an animal on a road is checked before an animal walking too
 * fast, because if both are true the first is what somebody needs told.
 */
export function assess(
  reading: EnvelopeReading,
  envelope: Envelope,
  memory: BreachMemory,
): Breach | null {
  const held = (kind: BreachKind, breached: boolean): boolean => {
    memory[kind] = breached ? (memory[kind] ?? 0) + 1 : 0
    return (memory[kind] ?? 0) > graceFor(kind)
  }

  // An animal inside a hazard is not a matter of degree, and not something to
  // wait out: it is checked with no grace at all.
  const inHazard = reading.animals.some(animal =>
    reading.exclusions.some(ring => pointInRing(animal, ring)))

  if (inHazard) {
    memory.exclusion = GRACE_TICKS + 1
    return {
      kind: 'exclusion',
      reason: 'An animal reached ground the move was told to keep it off.',
    }
  }
  memory.exclusion = 0

  if (held('standoff', reading.closestApproachM < envelope.minStandoffM)) {
    return {
      kind: 'standoff',
      reason: `The aircraft was inside the ${envelope.minStandoffM} m standoff for longer than a moment.`,
    }
  }

  /*
   * Distress before speed, because it is the earlier signal and the more
   * specific one. A mob whose average is still a walk but which has animals
   * bolting inside it is coming apart, and "the average was fine" is not
   * something to tell a farmer afterwards.
   */
  if (held('distress', reading.distressRatio > envelope.maxDistressRatio)) {
    const share = Math.round(reading.distressRatio * 100)
    return {
      kind: 'distress',
      reason: `${share} per cent of the mob stayed agitated, above the ${Math.round(envelope.maxDistressRatio * 100)} per cent this mob is worked to.`,
    }
  }

  if (held('speed', reading.mobSpeedMs > envelope.maxMobSpeedMs)) {
    return {
      kind: 'speed',
      reason: `The mob held above ${envelope.maxMobSpeedMs} m/s, which is no longer a walk.`,
    }
  }

  if (reading.driveMinutes > envelope.maxDriveMinutes) {
    return {
      kind: 'duration',
      reason: `The drive passed ${envelope.maxDriveMinutes} minutes without finishing.`,
    }
  }

  const reach = (envelope.minStandoffM * SPLIT_REACH_MULTIPLE) / reading.metresPerUnit
  const bunches = groups(reading.animals, reach)
  const mainBody = bunches.reduce((largest, bunch) => Math.max(largest, bunch.length), 0)
  const together = reading.animals.length === 0 ? 1 : mainBody / reading.animals.length

  if (held('split', together < SPLIT_MAIN_BODY)) {
    const adrift = reading.animals.length - mainBody
    return {
      kind: 'split',
      reason: `The mob came apart: ${adrift} of ${reading.animals.length} were away from the main body and did not rejoin.`,
    }
  }

  return null
}

/** Clearance in metres from the nearest animal to the nearest hazard. */
export function hazardClearanceM(reading: EnvelopeReading): number {
  if (reading.exclusions.length === 0)
    return Number.POSITIVE_INFINITY

  let nearest = Number.POSITIVE_INFINITY
  for (const animal of reading.animals)
    nearest = Math.min(nearest, distanceToNearestRing(animal, reading.exclusions))

  return nearest * reading.metresPerUnit
}

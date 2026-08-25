/**
 * Reading distress off individual animals, rather than off the mob average.
 *
 * The mob average is a lagging indicator and it hides the thing that matters.
 * A hundred head walking at 1.1 m/s with one animal bolting in circles at
 * three averages out to a perfectly compliant move, and the one animal is the
 * whole problem: it is the one that will go through a fence, and if it is a
 * ewe it is about to take her lambs with her. By the time the average crosses
 * a threshold the mob is already running.
 *
 * So distress is per animal, and it is kinematic. Three signals, because no
 * one of them is sufficient on its own:
 *
 *  - **Speed excess.** Fast relative to the mob, not fast in absolute terms.
 *    A mob trotting downhill together is not distress; one animal at twice
 *    everybody else's pace is.
 *  - **Turn rate.** A settled animal walks a line. A frightened one changes
 *    its mind: it turns, checks, turns back. Fast on its own is a keen animal
 *    heading for fresh grass; fast and turning hard is a frightened one.
 *  - **Breaking away.** Moving from the mob rather than with it. Stock under
 *    threat bunch. An animal actively leaving is the beginning of a split.
 *
 * The signals multiply where they should. Turning hard while standing still
 * scores nothing, because it is an animal looking around.
 *
 * All of this is computed from tracks, which is what a real pipeline has too:
 * positions and velocities per animal across frames. So the same function
 * reads the simulator and would read a detector.
 */

import type { Vec } from './geometry'
import { clamp, distance, length, normalise, sub } from './geometry'

export interface Track {
  position: Vec
  /** Normalised units per tick. */
  velocity: Vec
  /**
   * Smoothed absolute heading change, radians per tick.
   *
   * Smoothed rather than instantaneous because a single frame's heading change
   * is mostly noise, and one noisy frame must not read as a frightened animal.
   */
  turnRate: number
}

export interface DistressReading {
  /** Per animal, 0..1. Same order as the tracks given. */
  scores: number[]
  /** The worst individual. What a stockman would actually be looking at. */
  peak: number
  /** Share of the mob above `DISTRESS_THRESHOLD`. */
  ratio: number
  /** Animals running outright. */
  bolting: number
}

/** Above this an animal counts as distressed rather than merely brisk. */
export const DISTRESS_THRESHOLD = 0.55

/** Speed at which an animal is running rather than walking, in m/s. */
const BOLT_SPEED_MS = 2.4

/** How many times the mob's own pace counts as excessive. */
const EXCESS_MULTIPLE = 1.8

/** Turning harder than this, in radians per tick, is not purposeful walking. */
const ERRATIC_TURN = 0.45

/** Below this an animal is standing about and nothing it does is distress. */
const IDLE_MS = 0.35

function median(values: number[]): number {
  if (values.length === 0)
    return 0

  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  return sorted.length % 2 === 0
    ? (sorted[middle - 1]! + sorted[middle]!) / 2
    : sorted[middle]!
}

/**
 * Score the mob.
 *
 * The median is the reference rather than the mean, and deliberately: the mean
 * is dragged up by exactly the bolting animals we are trying to find, so a mob
 * with several of them would quietly raise its own bar and stop detecting
 * them.
 */
export function assessDistress(
  tracks: Track[],
  metresPerUnit: number,
  tickSeconds: number,
): DistressReading {
  if (tracks.length === 0)
    return { scores: [], peak: 0, ratio: 0, bolting: 0 }

  const toMs = metresPerUnit / tickSeconds
  const speeds = tracks.map(track => length(track.velocity) * toMs)
  const pace = Math.max(median(speeds), IDLE_MS)

  const middle = tracks.reduce(
    (sum, track) => ({ x: sum.x + track.position.x / tracks.length, y: sum.y + track.position.y / tracks.length }),
    { x: 0, y: 0 },
  )

  const scores = tracks.map((track, index) => {
    const speed = speeds[index]!

    // Standing still is not distress, whatever else it is doing.
    if (speed < IDLE_MS)
      return 0

    const excess = clamp((speed / pace - 1) / (EXCESS_MULTIPLE - 1), 0, 1)
    const erratic = clamp(track.turnRate / ERRATIC_TURN, 0, 1)

    // Away from the mob, as a fraction of this animal's own pace. An animal
    // walking sideways is with the mob; one whose whole speed is outbound is
    // leaving it.
    const outward = distance(track.position, middle) < 1e-6
      ? 0
      : clamp(
          (track.velocity.x * normalise(sub(track.position, middle)).x
            + track.velocity.y * normalise(sub(track.position, middle)).y) / Math.max(length(track.velocity), 1e-9),
          0,
          1,
        )

    /*
     * Erratic and outward are both gated on speed rather than added to it.
     * A slow animal turning is looking around and a slow animal drifting off
     * is grazing, and neither is worth backing a drone off for. The scaling
     * keeps a fast animal from scoring high on speed alone: something has to
     * be odd about how it is moving, not just how fast.
     */
    const motion = clamp(speed / BOLT_SPEED_MS, 0, 1)

    return clamp(excess * 0.5 + motion * erratic * 0.3 + motion * outward * 0.35, 0, 1)
  })

  const distressed = scores.filter(score => score >= DISTRESS_THRESHOLD).length

  return {
    scores,
    peak: scores.reduce((worst, score) => Math.max(worst, score), 0),
    ratio: distressed / tracks.length,
    bolting: speeds.filter(speed => speed >= BOLT_SPEED_MS).length,
  }
}

/**
 * Smooth a heading change into a turn rate.
 *
 * Exponential, with the previous value carrying most of the weight, so one
 * frame of tracker noise cannot read as a frightened animal but three seconds
 * of genuine zig-zag can.
 */
export function smoothTurn(previous: number, from: Vec, to: Vec, alpha = 0.25): number {
  if (length(from) < 1e-9 || length(to) < 1e-9)
    return previous * (1 - alpha)

  const a = normalise(from)
  const b = normalise(to)
  const dot = clamp(a.x * b.x + a.y * b.y, -1, 1)

  return previous * (1 - alpha) + Math.acos(dot) * alpha
}

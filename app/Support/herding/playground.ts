/**
 * One scenario, worked up into everything a page needs to show it.
 *
 * The view stays thin on purpose. Running the controller, sampling the frames,
 * drawing the SVG and totting up the readings are all things a test can call,
 * and a template is the one place in this codebase nothing can. So the view
 * asks for a `PlaygroundRun` and prints it.
 *
 * Everything here is deterministic, so a figure quoted in the page's copy and
 * a figure asserted in `tests/unit/herding-sim.test.ts` are the same figure by
 * construction. That is the same promise the arable side of the site makes
 * about the demonstration field, and it is the only reason a playground is
 * worth publishing rather than a video.
 */

import type { SimState, World } from './sim'
import type { Envelope } from './envelope'
import { envelopeFor } from './envelope'
import { renderHerdMap, renderTrace, sampleFrames } from './herdmap'
import { corridorClearanceM } from './planner'
import { createSim, step, TICK_SECONDS } from './sim'
import { scenario, scenarios } from './scenarios'

export interface Reading {
  label: string
  value: string
  /** The envelope limit this was measured against, already formatted. */
  limit?: string
  /** True only when this reading is what stopped the move. */
  breached?: boolean
  /**
   * A reading that went outside its limit without stopping anything.
   *
   * Kept separate from `breached` because conflating them makes the page lie
   * in one direction or the other. An animal that walks toward the aircraft
   * closes the standoff on its own and the yield takes a second or two: that
   * is inside the tolerance and is not a breach, but hiding it would be
   * exactly the sort of tidying-up this site is written against.
   */
  note?: string
}

export interface PlaygroundRun {
  world: World
  envelope: Envelope
  /** `arrived` or `aborted`. */
  status: string
  /** One line, in the words a farmer would get in the report. */
  verdict: string
  abortReason: string
  map: string
  trace: string
  readings: Reading[]
  /** How long the modelled move took. */
  driveMinutes: number
  head: number
  arrived: number
  stragglers: number
  /** Every scenario, for the picker. */
  others: { slug: string, name: string, current: boolean }[]
}

const MAX_TICKS = 1800

/**
 * How many frames the map animates from.
 *
 * See `sampleFrames` in herdmap.ts for why this number and not a larger one.
 * It lives here too because `runScenario` decimates as it goes and needs the
 * target before the run starts.
 */
const FRAME_TARGET = 32

function minutes(value: number): string {
  const whole = Math.floor(value)
  const seconds = Math.round((value - whole) * 60)
  return `${whole} min ${String(seconds).padStart(2, '0')} s`
}

/** The whole-run figures the readings are made of. */
export interface RunAggregates {
  peakSpeed: number
  peakAltitude: number
  peakDistress: number
  peakAgitated: number
  closest: number
}

export interface ScenarioRun {
  /** Only the frames the SVG will draw, evenly spaced across the move. */
  frames: SimState[]
  last: SimState
  /** Computed across every tick, not just the drawn ones. */
  aggregates: RunAggregates
}

/**
 * Run a scenario, keeping the frames the map needs and nothing else.
 *
 * The obvious implementation keeps every tick and thins the array afterwards,
 * and that is what this did first. It is wrong on a box with a memory ceiling:
 * `must-abort` is seven hundred ticks of a hundred and thirty animals, so the
 * discarded array is tens of megabytes of short-lived objects, and Bun grows
 * the heap to fit them and does not hand it back. Warming all six scenarios
 * took RSS from 36 MB to 131 MB and left it there, to retain 342 KB of markup.
 * This site is a tenant on a shared box with a 768 MB hard ceiling, so that is
 * real.
 *
 * So the frames are decimated as they are produced. The buffer is allowed to
 * grow to twice the target and is then halved by dropping every other frame,
 * which doubles the effective stride; repeat and the buffer never exceeds
 * `2 * target` however long the run turns out to be. That matters because the
 * length is not known in advance - a move ends when it arrives or aborts - so
 * a fixed stride cannot be chosen up front.
 *
 * The readings still come from every tick. They are running maxima and one
 * minimum, so they cost nothing to carry and do not need the frames retained.
 */
export function runScenario(world: World, target = FRAME_TARGET): ScenarioRun {
  let state = createSim(world)

  const frames: SimState[] = [state]
  let stride = 1
  let since = 0

  const aggregates: RunAggregates = {
    peakSpeed: 0,
    peakAltitude: state.altitudeM,
    peakDistress: 0,
    peakAgitated: 0,
    closest: state.closestApproachM,
  }

  while (state.tick < MAX_TICKS && state.status === 'driving') {
    state = step(state)

    aggregates.peakSpeed = Math.max(aggregates.peakSpeed, state.mobSpeedMs)
    aggregates.peakAltitude = Math.max(aggregates.peakAltitude, state.altitudeM)
    aggregates.peakDistress = Math.max(aggregates.peakDistress, state.distress.peak)
    aggregates.peakAgitated = Math.max(aggregates.peakAgitated, state.distress.ratio)
    aggregates.closest = Math.min(aggregates.closest, state.closestApproachM)

    if (++since >= stride) {
      since = 0
      frames.push(state)

      if (frames.length > target * 2) {
        // Halve it: keep every other frame, and take twice as long to fill up
        // again. Evenly spaced before, evenly spaced after.
        for (let read = 2, write = 1; read < frames.length; read += 2, write++)
          frames[write] = frames[read]!

        frames.length = Math.ceil(frames.length / 2)
        stride *= 2
      }
    }
  }

  // The last tick is the outcome and the decimation will usually have skipped
  // it, so it replaces the final kept frame rather than being appended - the
  // spacing is even and one frame either way is not visible.
  if (frames[frames.length - 1] !== state)
    frames[frames.length - 1] = state

  return { frames, last: state, aggregates }
}

/**
 * Every scenario, computed once per process.
 *
 * The whole point of these runs being deterministic is that the answer never
 * changes, and a page that recomputed it per request would be burning CPU to
 * arrive at a byte-identical result. On the biggest scenario that is most of a
 * second of solid arithmetic - the flocking model is O(head squared) per tick
 * and `must-abort` is a hundred and thirty animals over seven hundred ticks -
 * and this site is a tenant on a shared box, so it is somebody else's CPU too.
 *
 * A plain module-level Map is the right cache here rather than anything from
 * `@stacksjs/cache`: the value is a pure function of a constant, it can never
 * go stale, and there is nothing to invalidate. A deploy is what busts it,
 * which is exactly when the answer could have changed.
 */
const cache = new Map<string, PlaygroundRun>()

/*
 * There is deliberately no background warm here, and the reason is worth
 * writing down because the idea is tempting and it took production down.
 *
 * An earlier version scheduled all six remaining scenarios on a `setTimeout`
 * after the first playground request, so the picker would be instant from the
 * second click. Two things wrong with that, both invisible in development:
 *
 *  1. It is 1.6 s of SYNCHRONOUS work on the event loop. Nothing else is
 *     served while it runs - not another page, not a health probe.
 *  2. It allocates hard. Locally that showed as RSS growth the process
 *     absorbed; inside a cgroup with `memory.high` set, crossing the line puts
 *     the thread into `mem_cgroup_handle_over_high` in uninterruptible sleep,
 *     and it does not come back on its own.
 *
 * Together with the liveness probe that ts-cloud restarts the service from,
 * that is a death spiral rather than a slow page: stall, miss three probes,
 * get restarted, stall again. The site served nothing for twenty minutes.
 *
 * Each scenario is still cached for the life of the process, so the cost is
 * one visitor waiting once for the page they actually asked for - at most
 * 740 ms on the heaviest, and nothing thereafter. That is the whole benefit
 * the warm was buying, without a burst that can wedge the process.
 */

export function playgroundRun(slug: string): PlaygroundRun | null {
  const cached = cache.get(slug)
  if (cached)
    return cached

  const world = scenario(slug)
  if (!world)
    return null

  const envelope = envelopeFor(world.profile)
  const { frames, last, aggregates } = runScenario(world)
  const sampled = sampleFrames(frames, FRAME_TARGET)

  const { peakSpeed, peakAltitude, peakDistress, peakAgitated, closest } = aggregates

  const arrived = last.animals.filter((animal) => {
    const ring = world.toBlock
    let inside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]!
      const [xj, yj] = ring[j]!
      if ((yi > animal.y) !== (yj > animal.y) && animal.x < ((xj - xi) * (animal.y - yi)) / (yj - yi) + xi)
        inside = !inside
    }
    return inside
  }).length

  const clearance = corridorClearanceM(
    last.corridor,
    world.hazards.map(hazard => hazard.ring),
    world.metresPerUnit,
  )

  // What actually stopped the move, if anything. Only the reading that matches
  // it is marked as a breach; everything else that brushed a limit gets a note.
  const stoppedBy = last.abort?.kind ?? ''

  const readings: Reading[] = [
    {
      label: 'Closest the aircraft came',
      value: `${closest.toFixed(0)} m`,
      limit: `${envelope.minStandoffM} m standoff`,
      breached: stoppedBy === 'standoff',
      note: closest < envelope.minStandoffM && stoppedBy !== 'standoff'
        ? 'Briefly closer than the standoff, because an animal walked toward it and the aircraft took a moment to yield. Inside the tolerance, and the move would have stopped had it persisted.'
        : undefined,
    },
    {
      label: 'Fastest the mob moved',
      value: `${peakSpeed.toFixed(2)} m/s`,
      limit: `${envelope.maxMobSpeedMs} m/s`,
      breached: stoppedBy === 'speed',
    },
    {
      label: 'Highest the aircraft worked',
      value: `${peakAltitude.toFixed(0)} m`,
      limit: `${envelope.maxAltitudeM} m ceiling`,
      note: peakAltitude > envelope.minAltitudeM * 1.5
        ? `It started at ${envelope.minAltitudeM} m. Every metre above that is pressure it chose to take off the mob without giving up its position.`
        : undefined,
    },
    {
      label: 'Most of the mob agitated at once',
      value: `${Math.round(peakAgitated * 100)} per cent`,
      limit: `${Math.round(envelope.maxDistressRatio * 100)} per cent`,
      breached: stoppedBy === 'distress',
      note: peakAgitated > envelope.maxDistressRatio && stoppedBy !== 'distress'
        ? 'Over the line for a stretch, which is what sent the aircraft up. The limit stops a move only if it is still over it a minute later, because climbing is the remedy and climbing takes time.'
        : undefined,
    },
    {
      label: 'Worst individual animal',
      value: peakDistress.toFixed(2),
      note: 'A score out of one, from how that animal was moving. This is the reading the mob average cannot see.',
    },
    {
      label: 'Times it eased off',
      value: String(last.memory.easeOffs),
    },
    {
      label: 'Time under pressure',
      value: minutes(last.driveMinutes),
      limit: `${envelope.maxDriveMinutes} min`,
      breached: stoppedBy === 'duration',
    },
  ]

  if (world.hazards.length > 0) {
    readings.push({
      label: 'Route clearance from the road',
      value: Number.isFinite(clearance) ? `${clearance.toFixed(0)} m` : 'no hazard',
    })
  }

  const verdict = last.status === 'arrived'
    ? `${arrived} of ${world.head} on the new block after ${minutes(last.driveMinutes)}.`
    : `Stopped after ${minutes(last.driveMinutes)} without finishing, and asked for a person.`

  const result: PlaygroundRun = {
    world,
    envelope,
    status: last.status,
    verdict,
    abortReason: last.abort?.reason ?? '',
    map: renderHerdMap(sampled, world, {
      title: `${world.name}: ${world.head} head walked from one block to another by a drone holding a ${envelope.minStandoffM} m standoff`,
      id: `herd-${world.slug}`,
    }),
    trace: renderTrace(
      [
        {
          key: 'speed',
          label: 'Mob speed',
          values: sampled.map(frame => frame.mobSpeedMs),
          limit: envelope.maxMobSpeedMs,
        },
        {
          key: 'altitude',
          label: 'Aircraft height',
          values: sampled.map(frame => frame.altitudeM),
          limit: envelope.maxAltitudeM,
        },
      ],
      {
        title: `Mob speed against its ${envelope.maxMobSpeedMs} m/s limit, and aircraft height against the ${envelope.maxAltitudeM} m ceiling, across the whole move`,
        ticks: last.tick,
      },
    ),
    readings,
    driveMinutes: Number(last.driveMinutes.toFixed(2)),
    head: world.head,
    arrived,
    stragglers: last.stragglers,
    others: scenarios.map(other => ({
      slug: other.slug,
      name: other.name,
      current: other.slug === world.slug,
    })),
  }

  cache.set(slug, result)

  return result
}

/** Seconds of modelled time the playback covers, for the page's caption. */
export function modelledSeconds(ticks: number): number {
  return ticks * TICK_SECONDS
}

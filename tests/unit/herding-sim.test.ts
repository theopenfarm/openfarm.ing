import { describe, expect, it } from 'bun:test'
import { envelopeFor } from '../../app/Support/herding/envelope'
import { pointInRing, vec } from '../../app/Support/herding/geometry'
import { scenario, scenarios } from '../../app/Support/herding/scenarios'
import { createSim, run, step } from '../../app/Support/herding/sim'
import { runScenario } from '../../app/Support/herding/playground'

/**
 * The controller, run against the modelled paddocks.
 *
 * This file is the reason the simulator exists. `app/Support/herding/pilot.ts`
 * is the code that would fly an aircraft over somebody's cattle, and there is
 * no honest way to change it without being able to replay what it does. So
 * every scenario is asserted on an exact outcome, and every world is
 * deterministic - no `Date`, no `Math.random` anywhere in the chain.
 *
 * The numbers below are tight on purpose. If a tuning change moves them, that
 * is the point: somebody has to look at the new behaviour and decide it is
 * better, rather than finding out from a farmer.
 */

const MAX_TICKS = 1800

describe('every scenario is deterministic', () => {
  it('gives the same run twice', () => {
    for (const world of scenarios) {
      const once = run(world)
      const twice = run(world)

      expect({ status: once.status, ticks: once.ticks, arrived: once.arrived })
        .toEqual({ status: twice.status, ticks: twice.ticks, arrived: twice.arrived })
    }
  })

  it('steps to the same state as a full run', () => {
    // The playground steps tick by tick and the tests call `run`. If those two
    // ever disagreed, the page would be showing something the tests do not
    // cover.
    const world = scenario('rotation')!
    let state = createSim(world)
    while (state.tick < MAX_TICKS && state.status === 'driving')
      state = step(state)

    expect(state.tick).toBe(run(world).ticks)
  })
})

describe('the moves that should finish', () => {
  const finishing = ['rotation', 'narrow-gate', 'road-hazard', 'shy-mob', 'spooked']

  for (const slug of finishing) {
    it(`${slug} gets the mob onto the new block`, () => {
      const world = scenario(slug)!
      const outcome = run(world)

      expect(outcome.status).toBe('arrived')
      // Most of the mob across, and inside the time a mob may be driven.
      expect(outcome.arrived / world.head).toBeGreaterThan(0.6)
      expect(outcome.driveMinutes).toBeLessThanOrEqual(envelopeFor(world.profile).maxDriveMinutes)
    })

    it(`${slug} never sustains a breach of the envelope`, () => {
      const world = scenario(slug)!
      const envelope = envelopeFor(world.profile)
      const outcome = run(world)

      expect(outcome.abortKind).toBe('')
      expect(outcome.peakMobSpeedMs).toBeLessThanOrEqual(envelope.maxMobSpeedMs)
      expect(outcome.peakAltitudeM).toBeLessThanOrEqual(envelope.maxAltitudeM)

      /*
       * Standoff is allowed a small transient. The aircraft holds its distance,
       * but an animal that walks toward it closes the gap on its own and the
       * yield takes a moment; the envelope tolerates that for a few seconds
       * and stops the move if it persists, which is what `abortKind` above is
       * really asserting.
       */
      expect(outcome.closestApproachM).toBeGreaterThan(envelope.minStandoffM * 0.85)
    })
  }

  it('keeps every animal off the hazards on the road scenario', () => {
    // The outcome this capability exists to prevent. Not a tolerance, not a
    // transient: no animal on the road at any point in the run.
    const world = scenario('road-hazard')!
    let state = createSim(world)

    while (state.tick < MAX_TICKS && state.status === 'driving') {
      state = step(state)

      for (const hazard of world.hazards) {
        const trespass = state.animals.filter(a => pointInRing(vec(a.x, a.y), hazard.ring))
        expect(trespass.length).toBe(0)
      }
    }

    expect(state.status).toBe('arrived')
  })
})

describe('the move that should not finish', () => {
  it('stops rather than forcing a shy mob through a gate it cannot use', () => {
    const world = scenario('must-abort')!
    const outcome = run(world)

    expect(outcome.status).toBe('aborted')
    expect(outcome.abortReason).not.toBe('')
    // It stops at the limit rather than somewhere past it.
    expect(outcome.driveMinutes).toBeLessThanOrEqual(envelopeFor(world.profile).maxDriveMinutes + 0.1)
  })

  it('tries the whole ladder before it gives up', () => {
    /*
     * The assertion that matters most in this file. A controller that aborted
     * on the first sign of trouble would be safe and useless; one that never
     * aborted would be useful and indefensible. This checks it did the work
     * first: climbed, eased off repeatedly, and only then stopped.
     */
    const world = scenario('must-abort')!
    const envelope = envelopeFor(world.profile)
    const outcome = run(world)

    expect(outcome.peakAltitudeM).toBeGreaterThan(envelope.minAltitudeM * 1.5)
    expect(outcome.easeOffs).toBeGreaterThan(2)
    // And it still never got on top of them or ran them.
    expect(outcome.peakMobSpeedMs).toBeLessThanOrEqual(envelope.maxMobSpeedMs)
  })

  it('leaves nothing on the road on its way to giving up', () => {
    const world = scenario('must-abort')!
    let state = createSim(world)

    while (state.tick < MAX_TICKS && state.status === 'driving') {
      state = step(state)
      for (const hazard of world.hazards)
        expect(state.animals.filter(a => pointInRing(vec(a.x, a.y), hazard.ring)).length).toBe(0)
    }

    expect(state.status).toBe('aborted')
  })
})

describe('height is the pressure release the controller reaches for first', () => {
  it('climbs well above its working height for a mob with flighty animals in it', () => {
    /*
     * `spooked` is an ordinary mob with a handful of flighty animals. The mob
     * average never leaves the envelope, so a controller reading only the
     * average would have no reason to do anything at all. This one climbs to
     * roughly three times its working height and still finishes the move.
     */
    const spooked = run(scenario('spooked')!)
    const calm = run(scenario('rotation')!)

    expect(spooked.status).toBe('arrived')
    expect(spooked.peakAltitudeM).toBeGreaterThan(calm.peakAltitudeM * 1.8)
    expect(spooked.peakDistress).toBeGreaterThan(calm.peakDistress * 0.9)

    // And it did it by climbing rather than by running them.
    expect(spooked.peakMobSpeedMs).toBeLessThan(calm.peakMobSpeedMs)
  })

  it('works a shy mob higher and further off than a standard one', () => {
    const shy = run(scenario('shy-mob')!)
    const standard = run(scenario('rotation')!)

    expect(shy.closestApproachM).toBeGreaterThan(standard.closestApproachM)
    expect(shy.peakAltitudeM).toBeGreaterThan(standard.peakAltitudeM)
  })

  it('stays behind the mob rather than sitting over it, whatever height it is at', () => {
    /*
     * Pressure from directly above has no direction in it, and driving stock
     * is entirely about which side the pressure comes from. So height must buy
     * slant range without ever costing the point of balance.
     */
    const world = scenario('spooked')!
    let state = createSim(world)
    let highest = 0

    while (state.tick < 400 && state.status === 'driving') {
      state = step(state)

      const middle = state.animals.reduce(
        (sum, a) => ({ x: sum.x + a.x / state.animals.length, y: sum.y + a.y / state.animals.length }),
        { x: 0, y: 0 },
      )

      const groundM = Math.hypot(state.drone.x - middle.x, state.drone.y - middle.y) * world.metresPerUnit
      highest = Math.max(highest, state.altitudeM)

      // Never directly overhead.
      expect(groundM).toBeGreaterThan(10)
    }

    // And it genuinely used the height axis during that stretch.
    expect(highest).toBeGreaterThan(envelopeFor(world.profile).minAltitudeM)
  })
})

describe('the mob', () => {
  it('starts as a mob rather than scattered over the whole block', () => {
    /*
     * Herd animals graze in company. It also matters for what the simulator is
     * for: a mob sown evenly across thirty hectares is already in half a dozen
     * disconnected bunches at tick zero, so every run aborted on `split`
     * before the aircraft had done anything.
     */
    const world = scenario('rotation')!
    const state = createSim(world)

    const middle = state.animals.reduce(
      (sum, a) => ({ x: sum.x + a.x / state.animals.length, y: sum.y + a.y / state.animals.length }),
      { x: 0, y: 0 },
    )

    const furthest = Math.max(...state.animals.map(a => Math.hypot(a.x - middle.x, a.y - middle.y)))
    expect(furthest * world.metresPerUnit).toBeLessThan(120)

    for (const animal of state.animals)
      expect(pointInRing(vec(animal.x, animal.y), world.fromBlock)).toBe(true)
  })

  it('is counted honestly when animals are left behind', () => {
    // A mob that arrives two short means two animals are still on the old
    // block and somebody has to go and look at them. Reporting that is the
    // product; hiding it is the liability.
    for (const world of scenarios) {
      const outcome = run(world)
      expect(outcome.stragglers).toBeGreaterThanOrEqual(0)
      expect(outcome.arrived + outcome.stragglers).toBeLessThanOrEqual(world.head)
    }
  })
})

describe('the run is kept small enough to serve', () => {
  /*
   * This page is rendered by a tenant on a shared box with a 768 MB ceiling,
   * and `must-abort` is seven hundred ticks of a hundred and thirty animals.
   * Keeping every tick and thinning afterwards took RSS from 36 MB to 131 MB
   * and left it there, to retain a few hundred kilobytes of markup. So the
   * frames are decimated as they are produced, and these assert that the
   * decimation is bounded, evenly spaced, and does not change the answer.
   */
  it('never holds more than twice the frame target, however long the run', () => {
    for (const world of scenarios) {
      const { frames, last } = runScenario(world, 32)

      expect(frames.length).toBeLessThanOrEqual(64)
      // And it kept enough to animate with.
      expect(frames.length).toBeGreaterThanOrEqual(16)
      // The last frame is the outcome, which is the one that must not be lost.
      expect(frames[frames.length - 1]).toBe(last)
      expect(frames[0]!.tick).toBe(0)
    }
  })

  it('keeps the frames evenly spaced', () => {
    // Uneven spacing would play back as a mob that lurches: SMIL distributes
    // the keyframes evenly across the duration whatever ticks they came from.
    const { frames } = runScenario(scenario('must-abort')!, 32)
    const gaps: number[] = []
    for (let i = 1; i < frames.length - 1; i++)
      gaps.push(frames[i]!.tick - frames[i - 1]!.tick)

    const first = gaps[0]!
    for (const gap of gaps)
      expect(gap).toBe(first)
  })

  it('measures the readings across every tick, not just the kept frames', () => {
    /*
     * The whole point of carrying running aggregates rather than scanning the
     * frames afterwards. A peak that happened between two kept frames still
     * has to appear in the record, because that record is the welfare
     * evidence.
     */
    const world = scenario('spooked')!
    const { frames, aggregates } = runScenario(world, 32)

    const fromKeptFrames = frames.reduce((worst, frame) => Math.max(worst, frame.peakMobSpeedMs), 0)
    expect(aggregates.peakSpeed).toBeGreaterThanOrEqual(fromKeptFrames - 1e-9)

    // And the aggregates agree with the full-fidelity run in sim.ts.
    const full = run(world)
    expect(aggregates.peakSpeed).toBeCloseTo(full.peakMobSpeedMs, 2)
    expect(aggregates.peakAltitude).toBeCloseTo(full.peakAltitudeM, 1)
    expect(aggregates.closest).toBeCloseTo(full.closestApproachM, 1)
  })

  it('gives the same answer as it did before the decimation', () => {
    // Belt and braces: decimating frames must not change where the mob ended
    // up or why the move stopped.
    for (const world of scenarios) {
      const { last } = runScenario(world, 32)
      const full = run(world)

      expect(last.status).toBe(full.status)
      expect(last.tick).toBe(full.ticks)
      expect(last.abort?.kind ?? '').toBe(full.abortKind)
    }
  })
})

describe('the playground does no work it was not asked for', () => {
  /*
   * This is the regression test for an outage, so it runs in a fresh process
   * rather than in-band: the cache is module-level, and by the time the suite
   * above has run, every scenario is already in it.
   *
   * An earlier version scheduled the other five scenarios on a `setTimeout`
   * after the first playground request. That is 1.6 s of synchronous work on
   * the event loop and a hard allocation burst, and inside a cgroup with
   * `memory.high` set it put the thread into uninterruptible sleep in
   * `mem_cgroup_handle_over_high`. The liveness probe then restarted the
   * service, which stalled again. The site served nothing for twenty minutes.
   */
  it('computes only the scenario that was asked for', async () => {
    const probe = `
      const { playgroundRun } = await import('${process.cwd()}/app/Support/herding/playground.ts')
      const { scenarios } = await import('${process.cwd()}/app/Support/herding/scenarios.ts')
      playgroundRun('rotation')
      // Long enough that any setTimeout-scheduled warm would have run.
      await new Promise(r => setTimeout(r, 1500))
      const timings = {}
      for (const w of scenarios) {
        const t = performance.now()
        playgroundRun(w.slug)
        timings[w.slug] = performance.now() - t
      }
      console.log(JSON.stringify(timings))
    `
    const proc = Bun.spawn(['bun', '-e', probe], { stdout: 'pipe', stderr: 'pipe' })
    const out = await new Response(proc.stdout).text()
    await proc.exited

    const timings = JSON.parse(out.trim().split('\n').at(-1)!)

    // The one that was asked for is cached and free.
    expect(timings.rotation).toBeLessThan(5)

    /*
     * The rest must still be uncomputed, which shows as them taking real time
     * on first call. `must-abort` is the heaviest and the least ambiguous: if
     * a warm had run behind our back it would come back instantly.
     */
    expect(timings['must-abort']).toBeGreaterThan(50)
  })
})

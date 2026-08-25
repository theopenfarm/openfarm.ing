import { describe, expect, it } from 'bun:test'
import { assessDistress, DISTRESS_THRESHOLD, smoothTurn } from '../../app/Support/herding/distress'
import { assess, ENVELOPES, envelopeFor } from '../../app/Support/herding/envelope'
import { distanceToNearestRing, pointInRing, vec } from '../../app/Support/herding/geometry'
import { corridorClearanceM, planCorridor } from '../../app/Support/herding/planner'
import { expiryFrom, hasExpired, isTerminal, transition } from '../../app/Support/herding/state'

/**
 * The rules that keep a drone off somebody's animals.
 *
 * Everything in this file is a welfare property or an authorisation property.
 * If one of these breaks, the failure is not a wrong number on a page: it is a
 * drone pushing livestock somewhere it was told not to, or flying a move
 * nobody agreed to. They are asserted separately from the simulator so a
 * change to the modelled animals cannot quietly move the goalposts.
 */

const SQUARE: [number, number][] = [[0.1, 0.1], [0.9, 0.1], [0.9, 0.9], [0.1, 0.9]]
const METRES_PER_UNIT = 700

describe('the move state machine', () => {
  it('only reaches flying through an authorisation', () => {
    // The whole point of the three phases. If `planned` could go straight to
    // `flying`, the authorisation would be decorative.
    expect(transition('planned', 'start').ok).toBe(false)
    expect(transition('planned', 'finish').ok).toBe(false)

    const authorised = transition('planned', 'authorise')
    expect(authorised.ok).toBe(true)
    expect(authorised.status).toBe('authorised')

    expect(transition('authorised', 'start').status).toBe('flying')
    expect(transition('flying', 'finish').status).toBe('complete')
  })

  it('can be aborted from either side of the launch', () => {
    // A farmer who changes their mind between authorising and the aircraft
    // leaving must not have to wait for it to take off first.
    expect(transition('authorised', 'abort').status).toBe('aborted')
    expect(transition('flying', 'abort').status).toBe('aborted')
  })

  it('never reopens a move that has already happened', () => {
    for (const status of ['complete', 'aborted', 'expired', 'rejected']) {
      expect(isTerminal(status)).toBe(true)

      for (const action of ['authorise', 'start', 'finish', 'abort'] as const)
        expect(transition(status, action).ok).toBe(false)
    }
  })

  it('refuses with something a farmer can read', () => {
    const refused = transition('flying', 'authorise')
    expect(refused.ok).toBe(false)
    expect(refused.error).toContain('flying')
  })

  it('lapses an authorisation nobody acted on', () => {
    const now = new Date('2026-08-24T07:00:00.000Z')
    const move = { status: 'authorised', expires_at: expiryFrom(now) }

    expect(hasExpired(move, now)).toBe(false)
    // Consent given at seven is not consent for dusk.
    expect(hasExpired(move, new Date('2026-08-24T20:00:00.000Z'))).toBe(true)
    // A move already flying is not expired by its window passing.
    expect(hasExpired({ ...move, status: 'flying' }, new Date('2026-08-24T20:00:00.000Z'))).toBe(false)
  })
})

describe('the welfare envelope', () => {
  it('asks more of a mob that will take less', () => {
    // Ewes with lambs split under pressure dry cows would walk away from.
    expect(ENVELOPES.shy.minStandoffM).toBeGreaterThan(ENVELOPES.standard.minStandoffM)
    expect(ENVELOPES.shy.maxMobSpeedMs).toBeLessThan(ENVELOPES.standard.maxMobSpeedMs)
    expect(ENVELOPES.shy.maxDriveMinutes).toBeLessThan(ENVELOPES.standard.maxDriveMinutes)
    expect(ENVELOPES.shy.maxDistressRatio).toBeLessThan(ENVELOPES.standard.maxDistressRatio)
    // Stand further off AND work higher.
    expect(ENVELOPES.shy.minAltitudeM).toBeGreaterThan(ENVELOPES.standard.minAltitudeM)
  })

  it('keeps every profile under the Open category ceiling', () => {
    // 120 m AGL. A controller that would climb through it to calm a mob has
    // traded one regulator for another.
    for (const envelope of Object.values(ENVELOPES))
      expect(envelope.maxAltitudeM).toBeLessThanOrEqual(120)
  })

  it('falls back to standard rather than throwing on an unknown profile', () => {
    expect(envelopeFor('nonsense')).toEqual(ENVELOPES.standard)
    expect(envelopeFor(null)).toEqual(ENVELOPES.standard)
  })

  const reading = (over: Partial<Parameters<typeof assess>[0]> = {}) => ({
    closestApproachM: 40,
    distressRatio: 0,
    mobSpeedMs: 1,
    driveMinutes: 2,
    animals: [vec(0.5, 0.5), vec(0.51, 0.5), vec(0.5, 0.51)],
    exclusions: [],
    metresPerUnit: METRES_PER_UNIT,
    ...over,
  })

  it('does not abort on a momentary excursion', () => {
    const memory = {}
    const fast = reading({ mobSpeedMs: 5 })

    // One fast tick is an animal being an animal. A controller that stopped
    // for it would stop on every move.
    expect(assess(fast, ENVELOPES.standard, memory)).toBeNull()

    let breach = null
    for (let tick = 0; tick < 40 && !breach; tick++)
      breach = assess(fast, ENVELOPES.standard, memory)

    expect(breach?.kind).toBe('speed')
  })

  it('forgets an excursion the mob recovered from', () => {
    const memory = {}
    for (let tick = 0; tick < 8; tick++)
      assess(reading({ mobSpeedMs: 5 }), ENVELOPES.standard, memory)

    // Settled, so the count resets rather than accumulating across the move.
    assess(reading({ mobSpeedMs: 0.8 }), ENVELOPES.standard, memory)
    expect(memory).toMatchObject({ speed: 0 })
  })

  it('stops at once for an animal on a road, with no grace at all', () => {
    const road: [number, number][] = [[0.4, 0.4], [0.6, 0.4], [0.6, 0.6], [0.4, 0.6]]
    const breach = assess(
      reading({ exclusions: [road] }),
      ENVELOPES.standard,
      {},
    )

    // Everything else here is a matter of degree. This one is not.
    expect(breach?.kind).toBe('exclusion')
  })

  it('gives distress far longer than a speed excursion before it stops', () => {
    // The controller's answer to distress is to climb, and climbing takes
    // about forty ticks. A grace shorter than that would abort every move
    // before its own remedy had finished being applied.
    const memory: Record<string, number> = {}
    const agitated = reading({ distressRatio: 0.5 })

    for (let tick = 0; tick < 30; tick++)
      expect(assess(agitated, ENVELOPES.standard, memory)).toBeNull()

    let breach = null
    for (let tick = 0; tick < 60 && !breach; tick++)
      breach = assess(agitated, ENVELOPES.standard, memory)

    expect(breach?.kind).toBe('distress')
  })

  it('does not call a mob split just because it is strung out', () => {
    // A mob walking through a gate is in two pieces by definition, and one
    // animal lagging is a straggler. Neither is a reason to stop.
    const strungOut = Array.from({ length: 20 }, (_, i) => vec(0.3 + i * 0.01, 0.5))
    const memory = {}

    let breach = null
    for (let tick = 0; tick < 60 && !breach; tick++)
      breach = assess(reading({ animals: strungOut }), ENVELOPES.standard, memory)

    expect(breach).toBeNull()
  })

  it('does call it split when the main body has genuinely come apart', () => {
    const half = Array.from({ length: 10 }, (_, i) => vec(0.2 + i * 0.004, 0.5))
    const other = Array.from({ length: 10 }, (_, i) => vec(0.8 + i * 0.004, 0.5))
    const memory = {}

    let breach = null
    for (let tick = 0; tick < 60 && !breach; tick++)
      breach = assess(reading({ animals: [...half, ...other] }), ENVELOPES.standard, memory)

    expect(breach?.kind).toBe('split')
  })
})

describe('reading distress off individual animals', () => {
  const still = (n: number) => Array.from({ length: n }, (_, i) => ({
    position: vec(0.5 + i * 0.002, 0.5),
    velocity: vec(0.0012, 0),
    turnRate: 0,
  }))

  it('sees nothing in a mob walking together', () => {
    const reading = assessDistress(still(20), METRES_PER_UNIT, 1)
    expect(reading.ratio).toBe(0)
    expect(reading.peak).toBeLessThan(DISTRESS_THRESHOLD)
  })

  it('finds one animal bolting inside a compliant mob', () => {
    /*
     * The case the whole module exists for. Nineteen animals walking and one
     * running in circles averages out to a legal move, and the one animal is
     * the one that goes through a fence.
     */
    const tracks = still(19)
    tracks.push({ position: vec(0.55, 0.52), velocity: vec(0.004, 0.002), turnRate: 0.6 })

    const reading = assessDistress(tracks, METRES_PER_UNIT, 1)
    expect(reading.peak).toBeGreaterThan(DISTRESS_THRESHOLD)
    expect(reading.ratio).toBeGreaterThan(0)

    // And the mob average would not have told you: it is still a walk.
    const mean = tracks.reduce((sum, t) => sum + Math.hypot(t.velocity.x, t.velocity.y), 0) / tracks.length
    expect(mean * METRES_PER_UNIT).toBeLessThan(ENVELOPES.standard.maxMobSpeedMs)
  })

  it('does not read a standing animal as distressed however it turns', () => {
    const tracks = still(10)
    tracks.push({ position: vec(0.5, 0.5), velocity: vec(0.00001, 0), turnRate: 2 })

    // An animal looking around is not an animal in trouble.
    expect(assessDistress(tracks, METRES_PER_UNIT, 1).scores.at(-1)).toBe(0)
  })

  it('measures against the median so bolters cannot raise their own bar', () => {
    // With a mean reference, a mob with several animals running would quietly
    // decide that running was normal and stop detecting any of them.
    const tracks = still(10)
    for (let i = 0; i < 3; i++)
      tracks.push({ position: vec(0.6, 0.5 + i * 0.01), velocity: vec(0.005, 0.001), turnRate: 0.5 })

    const reading = assessDistress(tracks, METRES_PER_UNIT, 1)
    expect(reading.ratio).toBeGreaterThan(0.2)
  })

  it('smooths a turn rate rather than trusting one frame', () => {
    // One frame of tracker noise must not read as a frightened animal.
    const spike = smoothTurn(0, vec(1, 0), vec(-1, 0))
    expect(spike).toBeLessThan(Math.PI / 2)

    // Three seconds of genuine zig-zag should still get there.
    let turn = 0
    for (let tick = 0; tick < 20; tick++)
      turn = smoothTurn(turn, vec(tick % 2 ? 1 : -1, 0), vec(tick % 2 ? -1 : 1, 0))

    expect(turn).toBeGreaterThan(1)
  })
})

describe('the corridor planner', () => {
  const west: [number, number][] = [[0.05, 0.1], [0.44, 0.1], [0.44, 0.9], [0.05, 0.9]]
  const east: [number, number][] = [[0.56, 0.1], [0.95, 0.1], [0.95, 0.9], [0.56, 0.9]]
  const road: [number, number][] = [[0.0, 0.0], [1.0, 0.0], [1.0, 0.08], [0.0, 0.08]]

  it('routes through the gate rather than straight between the blocks', () => {
    const corridor = planCorridor({
      fromBlock: west,
      toBlock: east,
      gate: { x: 0.5, y: 0.3 },
      metresPerUnit: METRES_PER_UNIT,
      head: 60,
    })

    // A gate is a hole in a fence. A route that ignores it is a route the mob
    // cannot take, however short it is.
    const passesGate = corridor.points.some(([x, y]) =>
      Math.abs(x - 0.5) < 0.01 && Math.abs(y - 0.3) < 0.01)

    expect(passesGate).toBe(true)
    expect(corridor.points.length).toBeGreaterThanOrEqual(3)
  })

  it('pushes the route off a road it would otherwise run along', () => {
    const along = planCorridor({
      fromBlock: west,
      toBlock: east,
      gate: { x: 0.5, y: 0.5 },
      exclusions: [road],
      metresPerUnit: METRES_PER_UNIT,
      head: 60,
    })

    // No waypoint may sit inside the hazard, whatever else the planner did.
    for (const [x, y] of along.points)
      expect(pointInRing(vec(x, y), road)).toBe(false)

    expect(corridorClearanceM(along, [road], METRES_PER_UNIT)).toBeGreaterThan(40)
  })

  it('reports a tight clearance rather than hiding it', () => {
    // Some moves genuinely do run along a road, and the farmer knows the
    // ground better than the planner. The honest answer is a number on the
    // authorisation screen, not a refusal or a silence.
    const tight = planCorridor({
      fromBlock: west,
      toBlock: east,
      gate: { x: 0.5, y: 0.1 },
      exclusions: [road],
      metresPerUnit: METRES_PER_UNIT,
      head: 120,
    })

    const clearance = corridorClearanceM(tight, [road], METRES_PER_UNIT)
    expect(Number.isFinite(clearance)).toBe(true)
    // The gate itself is never moved: it is where the fence opens.
    expect(tight.points.some(([x, y]) => Math.abs(x - 0.5) < 0.01 && Math.abs(y - 0.1) < 0.01)).toBe(true)
  })

  it('widens the corridor for a bigger mob, but sub-linearly', () => {
    const small = planCorridor({ fromBlock: west, toBlock: east, gate: { x: 0.5, y: 0.5 }, metresPerUnit: METRES_PER_UNIT, head: 40 })
    const large = planCorridor({ fromBlock: west, toBlock: east, gate: { x: 0.5, y: 0.5 }, metresPerUnit: METRES_PER_UNIT, head: 160 })

    expect(large.width).toBeGreaterThan(small.width)
    // A mob spreads over an area, so four times the head is about twice the
    // front, not four times.
    expect(large.width).toBeLessThan(small.width * 3)
  })

  it('is deterministic', () => {
    // The playground, the stored move and the map all draw this line. If it
    // varied, they would disagree and the figures on the page would drift.
    const once = planCorridor({ fromBlock: west, toBlock: east, gate: { x: 0.5, y: 0.4 }, exclusions: [road], metresPerUnit: METRES_PER_UNIT, head: 80 })
    const twice = planCorridor({ fromBlock: west, toBlock: east, gate: { x: 0.5, y: 0.4 }, exclusions: [road], metresPerUnit: METRES_PER_UNIT, head: 80 })

    expect(once).toEqual(twice)
  })
})

describe('geometry', () => {
  it('places points in and out of a ring', () => {
    expect(pointInRing(vec(0.5, 0.5), SQUARE)).toBe(true)
    expect(pointInRing(vec(0.05, 0.5), SQUARE)).toBe(false)
  })

  it('reports zero clearance inside a hazard rather than a negative depth', () => {
    // Every caller is asking how much room is left, and inside a hazard the
    // honest answer is none.
    expect(distanceToNearestRing(vec(0.5, 0.5), [SQUARE])).toBe(0)
    expect(distanceToNearestRing(vec(0.05, 0.5), [SQUARE])).toBeCloseTo(0.05, 3)
  })
})

describe('the words a refusal uses', () => {
  /*
   * These strings go straight to a farmer, so they are asserted rather than
   * left to a template. The first version built them as `${action}d`, which
   * gets `authorised` right and produced "A move cannot be abortd while it is
   * planned" for every other action.
   */
  it('conjugates every action properly', () => {
    const refusals = [
      transition('flying', 'authorise'),
      transition('flying', 'reject'),
      transition('planned', 'start'),
      transition('planned', 'finish'),
      transition('planned', 'abort'),
      transition('planned', 'expire'),
    ]

    for (const refusal of refusals) {
      expect(refusal.ok).toBe(false)
      expect(refusal.error).not.toMatch(/\b\w+[^e]d\b(?<!ed)/)
      expect(refusal.error).not.toContain('abortd')
      expect(refusal.error).not.toContain('startd')
      expect(refusal.error).not.toContain('finishd')
    }
  })

  it('says what to do instead', () => {
    // A farmer looking at a proposal they do not want should reject it, not
    // stop it, and the refusal is where they find that out.
    expect(transition('planned', 'abort').error).toContain('rejected')
    expect(transition('planned', 'start').error).toContain('authorised')
  })
})

/**
 * The playground's worlds.
 *
 * Six blocks of ground, each built to ask the controller one question. They
 * are the test suite and the public demonstration at once, which is the point:
 * a playground that only shows the controller succeeding is an advertisement,
 * and an advertisement is not evidence. Two of these are designed for it to
 * fail, and the page shows them failing.
 *
 * Every world is deterministic. Same slug, same run, every time, so a figure
 * quoted from the playground and a figure asserted in a test cannot drift
 * apart - the same discipline `app/Support/content/demo-field.ts` keeps for
 * the arable side of the site.
 *
 * MODELLED ground and modelled animals. Not a customer's stock, and the page
 * says so wherever a number from it appears.
 */

import type { World } from './sim'

/**
 * A grazing platform is a few hundred metres across, so one unit of normalised
 * space is 700 m. Standoff distances in the tens of metres are then a few
 * hundredths of a unit, which keeps the arithmetic well away from both ends of
 * floating point.
 */
const METRES_PER_UNIT = 700

/** The outer fence. Everything happens inside this. */
const EXTENT: [number, number][] = [
  [0.02, 0.03],
  [0.98, 0.02],
  [0.99, 0.97],
  [0.03, 0.98],
]

/** The western block, where the mob starts. */
const WEST: [number, number][] = [
  [0.05, 0.10],
  [0.44, 0.08],
  [0.46, 0.52],
  [0.42, 0.88],
  [0.07, 0.90],
]

/** The eastern block, where it is going. */
const EAST: [number, number][] = [
  [0.56, 0.10],
  [0.95, 0.12],
  [0.94, 0.88],
  [0.58, 0.86],
  [0.54, 0.48],
]

/** The opening in the fence between them. */
const GATE = { x: 0.50, y: 0.48 }

/**
 * A road along the northern headland.
 *
 * The hazard that matters most on a real holding, and the reason the
 * `road-hazard` scenario exists. An animal on a road is the outcome this whole
 * capability is supposed to prevent, not cause.
 */
const ROAD: [number, number][] = [
  [0.02, 0.02],
  [0.98, 0.01],
  [0.98, 0.075],
  [0.02, 0.085],
]

/** A boggy hollow in the middle of the eastern block. */
const BOG: [number, number][] = [
  [0.66, 0.30],
  [0.78, 0.28],
  [0.81, 0.42],
  [0.70, 0.45],
]

/** A narrower gate, and blocks drawn to funnel into it. */
const NARROW_WEST: [number, number][] = [
  [0.05, 0.12],
  [0.40, 0.14],
  [0.47, 0.44],
  [0.47, 0.54],
  [0.40, 0.84],
  [0.06, 0.86],
]

const NARROW_EAST: [number, number][] = [
  [0.53, 0.44],
  [0.60, 0.14],
  [0.95, 0.15],
  [0.94, 0.85],
  [0.60, 0.84],
  [0.53, 0.54],
]

export const scenarios: World[] = [
  {
    slug: 'rotation',
    name: 'The rotation move',
    brief:
      'The everyday job. Forty head walked off a grazed block onto fresh cover, through a gate, with nothing in the way.',
    extent: EXTENT,
    fromBlock: WEST,
    toBlock: EAST,
    gate: GATE,
    hazards: [],
    metresPerUnit: METRES_PER_UNIT,
    head: 40,
    profile: 'standard',
    seed: 20260824,
  },
  {
    slug: 'narrow-gate',
    name: 'The narrow gate',
    brief:
      'The same move through a gap the mob has to funnel into one or two at a time. The front reaches fresh grass long before the back has moved, which is where a mob gets left behind.',
    extent: EXTENT,
    fromBlock: NARROW_WEST,
    toBlock: NARROW_EAST,
    gate: { x: 0.50, y: 0.49 },
    hazards: [],
    metresPerUnit: METRES_PER_UNIT,
    head: 70,
    profile: 'standard',
    seed: 20260825,
  },
  {
    slug: 'road-hazard',
    name: 'The road on the headland',
    brief:
      'A public road runs along the top of both blocks. The corridor has to be planned around it and the mob steered off it, because an animal on a road is the outcome this whole capability exists to prevent.',
    extent: EXTENT,
    fromBlock: WEST,
    toBlock: EAST,
    gate: GATE,
    hazards: [
      { ring: ROAD, label: 'Public road' },
      { ring: BOG, label: 'Wet hollow' },
    ],
    metresPerUnit: METRES_PER_UNIT,
    head: 55,
    profile: 'standard',
    seed: 20260826,
  },
  {
    slug: 'shy-mob',
    name: 'Ewes with lambs',
    brief:
      'The same ground, a mob that will not take pressure. The shy envelope stands 40 m off, accepts a slower walk and gives up sooner, so the aircraft spends the move high and patient rather than close and quick.',
    extent: EXTENT,
    fromBlock: WEST,
    toBlock: EAST,
    gate: GATE,
    hazards: [],
    metresPerUnit: METRES_PER_UNIT,
    head: 90,
    profile: 'shy',
    seed: 20260827,
  },
  {
    slug: 'spooked',
    name: 'One animal spooks',
    brief:
      'A mob whose average speed never leaves the envelope while individual animals come apart inside it. The aircraft reads the individuals, climbs from 20 m to nearly 60 m to take the pressure off, and finishes the move. The mob average would not have shown any of it.',
    extent: EXTENT,
    fromBlock: WEST,
    toBlock: EAST,
    gate: GATE,
    hazards: [],
    metresPerUnit: METRES_PER_UNIT,
    head: 120,
    profile: 'standard',
    // A handful of flighty ones in an otherwise ordinary mob, which is what
    // most mobs are. Watch the altitude trace rather than the speed trace: the
    // mean speed never leaves the envelope, and the aircraft still ends up at
    // three times its working height because individual animals kept breaking.
    // Nothing in the mob average would have told you that.
    skittish: 0.08,
    seed: 20260828,
  },
  {
    slug: 'must-abort',
    name: 'The move that should not finish',
    brief:
      'A shy mob, a hundred and thirty head, and the only gate hard against a public road. There is no way to get them through inside the time a mob may be driven for, so the aircraft stops and asks for a person. Refusing the move is the correct answer here, and it is the one rung of the ladder a demonstration usually leaves out.',
    extent: EXTENT,
    fromBlock: NARROW_WEST,
    toBlock: NARROW_EAST,
    // The only opening is up in the corner, hard against the road. There is no
    // corridor through it that keeps a mob this size clear, and the planner
    // says so rather than drawing a tidy line and hoping.
    gate: { x: 0.50, y: 0.125 },
    hazards: [
      { ring: ROAD, label: 'Public road' },
    ],
    metresPerUnit: METRES_PER_UNIT,
    head: 130,
    profile: 'shy',
    skittish: 0.3,
    seed: 20260829,
  },
]

export function scenario(slug: string): World | null {
  return scenarios.find(world => world.slug === slug) ?? null
}

export const DEFAULT_SCENARIO = 'rotation'

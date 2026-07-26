/**
 * The demonstration field.
 *
 * Every map and figure the marketing site shows is rendered from this dataset
 * rather than drawn by hand, so what a visitor looks at is the same shape of
 * output a real flight produces. It is MODELLED data, not a customer's field,
 * and the site says so wherever a number from it appears.
 *
 * It is generated rather than hand-listed because the interesting property is
 * the spatial structure: weed pressure on a cereal field is not scattered
 * evenly, it concentrates on the headland where the sprayer turns, along the
 * tramlines, and in a couple of established patches. That structure is what
 * makes the treated-area ratio worth arguing about, so it is reproduced here
 * explicitly.
 *
 * Generation is deterministic (a fixed-seed PRNG, no Date, no Math.random) so
 * the seeded database, the API and the rendered SVG always agree, and a reseed
 * never silently changes a number quoted in the copy.
 */

export interface DemoDetection {
  kind: 'weed' | 'disease' | 'moisture' | 'gap'
  label: string
  /** Normalised field space, 0..1 on each axis. */
  x: number
  y: number
  area_m2: number
  confidence: number
  severity: 'low' | 'medium' | 'high'
}

export interface DemoZone {
  /** Normalised field space: top-left corner plus size. */
  x: number
  y: number
  w: number
  h: number
  /** Litres per hectare across this zone. */
  rate: number
}

/** Deterministic PRNG (mulberry32). Same seed, same field, every time. */
function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const WEED_SPECIES = [
  { label: 'Blackgrass', weight: 0.46 },
  { label: 'Cleavers', weight: 0.22 },
  { label: 'Chickweed', weight: 0.18 },
  { label: 'Charlock', weight: 0.14 },
]

function speciesAt(r: number): string {
  let acc = 0
  for (const s of WEED_SPECIES) {
    acc += s.weight
    if (r <= acc)
      return s.label
  }
  return WEED_SPECIES[0]!.label
}

export const DEMO_FARM = {
  name: 'Hofgut Lindenbach',
  slug: 'hofgut-lindenbach',
  region: 'Niederbayern',
  segment: 'winter-wheat',
  hectares: 268,
} as const

export const DEMO_FIELD = {
  name: 'Lindenbach Nord',
  slug: 'lindenbach-nord',
  crop: 'winter wheat',
  hectares: 24.6,
  latitude: 48.7742,
  longitude: 12.9611,
} as const

/**
 * Weed detections across the demonstration field.
 *
 * Three sources of pressure, in the proportions a cereal field actually shows:
 * a headland band where the sprayer turns and the drill overlaps, four
 * tramline corridors, and two established patches that have been building for
 * a couple of seasons.
 */
export function demoDetections(): DemoDetection[] {
  const random = rng(20260726)
  const detections: DemoDetection[] = []

  const push = (x: number, y: number, area: number) => {
    // Clamp so nothing lands outside the boundary the map draws.
    const cx = Math.min(0.985, Math.max(0.015, x))
    const cy = Math.min(0.985, Math.max(0.015, y))
    const confidence = 0.62 + random() * 0.37
    detections.push({
      kind: 'weed',
      label: speciesAt(random()),
      x: Number(cx.toFixed(4)),
      y: Number(cy.toFixed(4)),
      area_m2: Math.round(area),
      confidence: Number(confidence.toFixed(3)),
      severity: area > 900 ? 'high' : area > 260 ? 'medium' : 'low',
    })
  }

  // Headland band: a ring inside the boundary, heaviest on the two short ends
  // where the sprayer turns most often.
  for (let i = 0; i < 34; i++) {
    const side = random()
    const jitter = () => (random() - 0.5) * 0.05
    if (side < 0.3)
      push(0.055 + jitter(), random(), 120 + random() * 420)
    else if (side < 0.6)
      push(0.945 + jitter(), random(), 120 + random() * 420)
    else if (side < 0.8)
      push(random(), 0.055 + jitter(), 90 + random() * 260)
    else
      push(random(), 0.945 + jitter(), 90 + random() * 260)
  }

  // Tramline corridors: narrow, running the length of the field.
  for (const lane of [0.24, 0.42, 0.61, 0.79]) {
    for (let i = 0; i < 9; i++) {
      push(lane + (random() - 0.5) * 0.028, 0.1 + random() * 0.8, 60 + random() * 190)
    }
  }

  // Two established patches, the kind that come back in the same place.
  for (const patch of [{ x: 0.33, y: 0.29, r: 0.085 }, { x: 0.68, y: 0.7, r: 0.062 }]) {
    for (let i = 0; i < 14; i++) {
      const angle = random() * Math.PI * 2
      const dist = Math.sqrt(random()) * patch.r
      push(patch.x + Math.cos(angle) * dist, patch.y + Math.sin(angle) * dist * 0.8, 380 + random() * 900)
    }
  }

  return detections
}

/**
 * The prescription: detections clustered onto a coarse grid, every cell that
 * carries enough weed area buffered into a treatment zone.
 *
 * This is deliberately the same logic the product describes on the feature
 * page. The grid is what a boom's section control can actually resolve, so a
 * prescription finer than that would be a map no machine could follow.
 */
export function demoZones(detections: DemoDetection[] = demoDetections()): DemoZone[] {
  const COLS = 16
  const ROWS = 22
  // A cell is switched on once the weed area inside it would justify opening
  // the nozzle at all.
  const AREA_THRESHOLD_M2 = 150

  const cells = new Map<string, number>()
  for (const d of detections) {
    const col = Math.min(COLS - 1, Math.floor(d.x * COLS))
    const row = Math.min(ROWS - 1, Math.floor(d.y * ROWS))
    const key = `${col}:${row}`
    cells.set(key, (cells.get(key) ?? 0) + d.area_m2)
  }

  const zones: DemoZone[] = []
  for (const [key, area] of cells) {
    if (area < AREA_THRESHOLD_M2)
      continue

    const [col, row] = key.split(':').map(Number) as [number, number]
    zones.push({
      x: Number((col / COLS).toFixed(4)),
      y: Number((row / ROWS).toFixed(4)),
      w: Number((1 / COLS).toFixed(4)),
      h: Number((1 / ROWS).toFixed(4)),
      // Heavier cells get the full label rate, lighter ones a reduced rate.
      rate: area > 1400 ? 180 : area > 600 ? 140 : 110,
    })
  }

  return zones.sort((a, b) => (a.y - b.y) || (a.x - b.x))
}

/** Hectares the prescription actually switches the boom on for. */
export function demoTreatedHectares(zones: DemoZone[] = demoZones()): number {
  const share = zones.reduce((sum, z) => sum + z.w * z.h, 0)
  return Number((share * DEMO_FIELD.hectares).toFixed(2))
}

/**
 * The field boundary, as a normalised ring. Not a rectangle: a real block has
 * a kink where it follows a track and a corner taken out by a copse, and the
 * map should show that rather than a tidy box.
 */
export const DEMO_BOUNDARY: [number, number][] = [
  [0.04, 0.02],
  [0.97, 0.05],
  [0.99, 0.42],
  [0.88, 0.55],
  [0.96, 0.72],
  [0.93, 0.98],
  [0.28, 0.96],
  [0.09, 0.83],
  [0.02, 0.4],
]

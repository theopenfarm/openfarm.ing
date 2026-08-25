/**
 * Plane geometry in the field's own normalised space.
 *
 * Everything on this platform that has a position already uses 0..1 on each
 * axis: `fields.boundary`, `detections.x/y`, the prescription's zones, and the
 * SVG the field map draws from them. Herding reuses it rather than introducing
 * a projection, so a corridor, a mob and a treatment zone can be drawn on one
 * picture without anything being converted.
 *
 * Distances the welfare envelope cares about are in metres, though, because
 * "stay 25 m off the animals" is the rule an actual stockman states and the
 * one a regulator would ask about. `metresPerUnit` is the bridge, and it is
 * carried explicitly on every call rather than kept as a module constant: a
 * 4 ha paddock and a 40 ha hill block have very different scales, and a
 * standoff that silently means something different on each is exactly the bug
 * this feature cannot afford.
 */

export interface Vec {
  x: number
  y: number
}

/** A closed ring, as `fields.boundary` already stores one. */
export type Ring = [number, number][]

export function vec(x: number, y: number): Vec {
  return { x, y }
}

export function add(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function sub(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function scale(a: Vec, k: number): Vec {
  return { x: a.x * k, y: a.y * k }
}

export function length(a: Vec): number {
  return Math.sqrt(a.x * a.x + a.y * a.y)
}

export function distance(a: Vec, b: Vec): number {
  return length(sub(a, b))
}

/** Unit vector, or the zero vector when there is no direction to give. */
export function normalise(a: Vec): Vec {
  const len = length(a)
  return len > 1e-9 ? { x: a.x / len, y: a.y / len } : { x: 0, y: 0 }
}

/** Rotate about the origin. Used to steer a mob around a hazard. */
export function rotate(a: Vec, radians: number): Vec {
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return { x: a.x * cos - a.y * sin, y: a.x * sin + a.y * cos }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Keep a point inside the unit square, so nothing is drawn off the map. */
export function clampToField(a: Vec): Vec {
  return { x: clamp(a.x, 0, 1), y: clamp(a.y, 0, 1) }
}

export function centroid(points: Vec[]): Vec {
  if (points.length === 0)
    return { x: 0.5, y: 0.5 }

  let x = 0
  let y = 0
  for (const point of points) {
    x += point.x
    y += point.y
  }

  return { x: x / points.length, y: y / points.length }
}

/**
 * Ray casting, counting crossings of the ring's edges.
 *
 * A point exactly on an edge is not worth special-casing: nothing here asks
 * about a boundary to the micrometre, and both answers are defensible.
 */
export function pointInRing(point: Vec, ring: Ring): boolean {
  let inside = false

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!
    const [xj, yj] = ring[j]!

    const straddles = (yi > point.y) !== (yj > point.y)
    if (!straddles)
      continue

    const crossingX = ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (point.x < crossingX)
      inside = !inside
  }

  return inside
}

/** Shortest distance from a point to a line segment. */
export function distanceToSegment(point: Vec, a: Vec, b: Vec): number {
  const span = sub(b, a)
  const lengthSquared = span.x * span.x + span.y * span.y

  if (lengthSquared < 1e-12)
    return distance(point, a)

  const t = clamp(((point.x - a.x) * span.x + (point.y - a.y) * span.y) / lengthSquared, 0, 1)

  return distance(point, add(a, scale(span, t)))
}

/**
 * Distance to a ring's nearest edge. Zero inside it.
 *
 * Zero inside rather than a negative depth because every caller is asking the
 * same question - how much clearance is left - and inside a hazard the honest
 * answer is none.
 */
export function distanceToRing(point: Vec, ring: Ring): number {
  if (ring.length < 2)
    return Number.POSITIVE_INFINITY

  if (pointInRing(point, ring))
    return 0

  let nearest = Number.POSITIVE_INFINITY
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = vec(ring[j]![0], ring[j]![1])
    const b = vec(ring[i]![0], ring[i]![1])
    nearest = Math.min(nearest, distanceToSegment(point, a, b))
  }

  return nearest
}

/** Clearance to the nearest of several hazards. */
export function distanceToNearestRing(point: Vec, rings: Ring[]): number {
  let nearest = Number.POSITIVE_INFINITY
  for (const ring of rings)
    nearest = Math.min(nearest, distanceToRing(point, ring))

  return nearest
}

export function ringCentroid(ring: Ring): Vec {
  return centroid(ring.map(([x, y]) => vec(x, y)))
}

/**
 * The mob's diameter: the widest gap between any two animals.
 *
 * O(n squared), which is fine at the scale this runs at - a mob is at most a
 * few hundred head and the sim steps a few thousand times - and it is the
 * measure that actually detects a split. A standard deviation would not: a mob
 * that has broken cleanly into two tight halves has a modest spread and an
 * obvious gap.
 */
export function spread(points: Vec[]): number {
  let widest = 0
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++)
      widest = Math.max(widest, distance(points[i]!, points[j]!))
  }

  return widest
}

/**
 * Split the mob into groups of animals within `reach` of one another.
 *
 * Single-link clustering, which is the right notion here: two animals are in
 * the same mob if you can walk between them through other animals, whatever
 * shape the mob is standing in. A mob strung out along a fence is one mob; two
 * bunches with a hundred metres between them are not.
 */
export function groups(points: Vec[], reach: number): Vec[][] {
  const unvisited = new Set(points.map((_, index) => index))
  const found: Vec[][] = []

  while (unvisited.size > 0) {
    const seed = unvisited.values().next().value as number
    unvisited.delete(seed)

    const group = [points[seed]!]
    const queue = [seed]

    while (queue.length > 0) {
      const current = queue.pop() as number
      for (const index of [...unvisited]) {
        if (distance(points[current]!, points[index]!) > reach)
          continue

        unvisited.delete(index)
        queue.push(index)
        group.push(points[index]!)
      }
    }

    found.push(group)
  }

  return found
}

/**
 * Deterministic PRNG (mulberry32). Same seed, same run, every time.
 *
 * The same generator `app/Support/content/demo-field.ts` uses, and for the
 * same reason: a playground that produced a different answer on every load
 * could not be asserted on in a test, and a herding controller that cannot be
 * regression tested has no business anywhere near livestock.
 */
export function rng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6D2B79F5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Renders a herding move as SVG, server side, from the simulator's own frames.
 *
 * Built the way `app/Support/fieldmap.ts` is, and for the same reason. That
 * module draws every orange mark from a row in `detections` rather than
 * illustrating one, because the argument the page is making is "this is real
 * output". This one draws every animal from a tick of `pilot.ts`, because the
 * argument here is "this is the controller that would fly". An illustration
 * would undercut both.
 *
 * The animation is SMIL - `<animate>` elements carrying the positions the
 * simulator produced - rather than script. Three reasons, in order of how much
 * they mattered:
 *
 *  1. There is nothing to go wrong at runtime. The frames are computed once,
 *     server side, from a deterministic run; the browser is only playing them
 *     back. A page that recomputed the move in the client could disagree with
 *     the tests, and then which one is the product?
 *  2. It matches the house rule against vanilla JS in templates, without
 *     needing a reactive framework to move a hundred circles.
 *  3. It works with JavaScript off, which the rest of this site does too.
 *
 * Coordinates are the same normalised 0..1 field space every other position on
 * this platform uses, so the SVG needs no projection and scales to any
 * container.
 */

import type { SimState, World } from './sim'
import type { Envelope } from './envelope'
import type { Ring } from './geometry'

export interface HerdMapOptions {
  /** Accessible description. Required: the map carries real information. */
  title: string
  /** How long the whole move takes to play back, in seconds. */
  durationSeconds?: number
  /** Unique within a page, so two maps' gradients cannot collide. */
  id?: string
}

/** Escape anything that reaches an attribute or a text node. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function ringPath(ring: Ring): string {
  if (ring.length === 0)
    return ''

  return `${ring.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(4)} ${y.toFixed(4)}`).join(' ')} Z`
}

function linePath(points: [number, number][]): string {
  if (points.length === 0)
    return ''

  return points.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(4)} ${y.toFixed(4)}`).join(' ')
}

/**
 * A coordinate, at the precision the page can actually show.
 *
 * Three decimals, not four. One unit of field space is 700 m here, so the third
 * decimal is 70 cm and the fourth is 7 cm - well under a pixel on any screen
 * this renders at, and a good deal finer than an animal is wide. The fourth
 * decimal is a character per number that nobody can see, and with a hundred and
 * thirty animals across dozens of frames those characters are tens of kilobytes.
 */
function n(value: number): string {
  return Number(value.toFixed(3)).toString()
}

/**
 * One `<animate>`, or nothing when the value never changes.
 *
 * A constant track is a few hundred bytes of markup that tells the browser to
 * interpolate between a number and itself, and with several hundred animals on
 * a page that is most of the page weight for none of the movement.
 */
function track(attribute: string, values: number[], duration: number): string {
  const first = values[0] ?? 0
  if (values.every(value => Math.abs(value - first) < 1e-5))
    return ''

  return [
    `<animate attributeName="${attribute}"`,
    ` values="${values.map(n).join(';')}"`,
    ` dur="${duration}s" repeatCount="indefinite" calcMode="linear"/>`,
  ].join('')
}

/**
 * Thin the run down to something a browser can play.
 *
 * A move is several hundred ticks and a mob is up to a hundred and thirty
 * animals, which is tens of thousands of coordinates if every tick is kept.
 * Nothing is lost by sampling: stock move slowly, SMIL interpolates between
 * whatever frames it is given, and the playback is sped up anyway. Thirty-two
 * frames over a twenty-four second playback is a keyframe every 0.75 s, which
 * is smoother than the movement being described.
 *
 * The number is a page-weight decision as much as a visual one. Each frame
 * costs two coordinates per animal, so the difference between 48 and 32 on the
 * biggest scenario is about thirty kilobytes of markup for movement nobody can
 * distinguish.
 */
export function sampleFrames(frames: SimState[], target = 32): SimState[] {
  if (frames.length <= target)
    return frames

  const stride = (frames.length - 1) / (target - 1)
  const sampled: SimState[] = []

  for (let i = 0; i < target; i++)
    sampled.push(frames[Math.round(i * stride)]!)

  // The last frame is the outcome, and rounding can drop it.
  const last = frames[frames.length - 1]!
  if (sampled[sampled.length - 1] !== last)
    sampled[sampled.length - 1] = last

  return sampled
}

export function renderHerdMap(frames: SimState[], world: World, options: HerdMapOptions): string {
  const { title, durationSeconds = 24, id = 'herd' } = options

  if (frames.length === 0)
    return ''

  const first = frames[0]!
  const head = first.animals.length
  const clip = `${id}-clip`
  const hatch = `${id}-hatch`

  const parts: string[] = []

  parts.push(
    `<svg class="herd-map" viewBox="0 0 1 1" role="img" aria-label="${esc(title)}"`,
    ' xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">',
    `<title>${esc(title)}</title>`,
  )

  parts.push(
    '<defs>',
    `<clipPath id="${clip}"><path d="${ringPath(world.extent)}"/></clipPath>`,
    // Hazards are hatched rather than filled flat: a solid red block reads as
    // a feature of the field, and this is ground the mob must not reach.
    `<pattern id="${hatch}" width="0.03" height="0.03" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">`,
    '<line x1="0" y1="0" x2="0" y2="0.03" class="herd-hatch-line"/>',
    '</pattern>',
    '</defs>',
  )

  parts.push(`<g clip-path="url(#${clip})">`)

  // The two blocks. The one they are leaving is drawn as grazed off, the one
  // they are going to as fresh, because that is the whole reason for the move.
  parts.push(`<path class="herd-block herd-block-from" d="${ringPath(world.fromBlock)}"/>`)
  parts.push(`<path class="herd-block herd-block-to" d="${ringPath(world.toBlock)}"/>`)

  for (const hazard of world.hazards) {
    parts.push(
      `<path class="herd-hazard" d="${ringPath(hazard.ring)}" fill="url(#${hatch})"/>`,
      `<path class="herd-hazard-edge" d="${ringPath(hazard.ring)}"/>`,
    )
  }

  // The corridor: the route a farmer looked at before they authorised it.
  parts.push(
    `<path class="herd-corridor-band" d="${linePath(first.corridor.points)}"`,
    ` stroke-width="${n(first.corridor.width)}"/>`,
    `<path class="herd-corridor" d="${linePath(first.corridor.points)}"/>`,
  )

  parts.push(
    `<circle class="herd-gate" cx="${n(world.gate.x)}" cy="${n(world.gate.y)}" r="0.012"/>`,
  )

  parts.push('</g>')

  parts.push(`<path class="herd-fence" d="${ringPath(world.extent)}"/>`)

  /*
   * The animals.
   *
   * One circle each, carrying its own track. Flighty ones are marked, because
   * the whole point of the distress reading is that they are individuals and
   * the mob average cannot see them.
   */
  const animalRadius = 0.006
  parts.push('<g class="herd-mob">')

  for (let index = 0; index < head; index++) {
    const xs = frames.map(frame => frame.animals[index]?.x ?? 0)
    const ys = frames.map(frame => frame.animals[index]?.y ?? 0)
    const flighty = first.animals[index]?.flighty ?? false

    parts.push(
      `<circle class="herd-animal${flighty ? ' herd-animal-flighty' : ''}"`,
      ` cx="${n(xs[0]!)}" cy="${n(ys[0]!)}" r="${animalRadius}">`,
      track('cx', xs, durationSeconds),
      track('cy', ys, durationSeconds),
      '</circle>',
    )
  }

  parts.push('</g>')

  /*
   * The aircraft, its working distance and its height.
   *
   * The standoff ring is the slant distance it is holding; the altitude ring is
   * how much of that is height. When the mob unsettles you can watch the second
   * one grow while the first stays put, which is the controller reaching for
   * the pressure release that does not cost it the point of balance.
   */
  const droneX = frames.map(frame => frame.drone.x)
  const droneY = frames.map(frame => frame.drone.y)
  const standoff = frames.map(frame => frame.standoffM / world.metresPerUnit)
  const altitude = frames.map(frame => frame.altitudeM / world.metresPerUnit)

  parts.push(
    '<g class="herd-aircraft">',
    `<circle class="herd-standoff" cx="${n(droneX[0]!)}" cy="${n(droneY[0]!)}" r="${n(standoff[0]!)}">`,
    track('cx', droneX, durationSeconds),
    track('cy', droneY, durationSeconds),
    track('r', standoff, durationSeconds),
    '</circle>',
    `<circle class="herd-altitude" cx="${n(droneX[0]!)}" cy="${n(droneY[0]!)}" r="${n(altitude[0]!)}">`,
    track('cx', droneX, durationSeconds),
    track('cy', droneY, durationSeconds),
    track('r', altitude, durationSeconds),
    '</circle>',
    `<circle class="herd-drone" cx="${n(droneX[0]!)}" cy="${n(droneY[0]!)}" r="0.009">`,
    track('cx', droneX, durationSeconds),
    track('cy', droneY, durationSeconds),
    '</circle>',
    '</g>',
  )

  parts.push('</svg>')

  return parts.join('')
}

export interface TraceSeries {
  label: string
  /** One value per sampled frame. */
  values: number[]
  /** The envelope limit this series is measured against. */
  limit?: number
  /** Class suffix, so the stylesheet can colour each series. */
  key: string
}

/**
 * A strip chart of what the aircraft did, against what it was allowed to do.
 *
 * The map shows the move; this shows the argument. A reader can see the mob
 * speed sitting under its ceiling for the whole run while the altitude trace
 * climbs and climbs, which is the case for reading individual animals rather
 * than the average, made in one picture.
 */
export function renderTrace(series: TraceSeries[], options: { title: string, ticks: number }): string {
  const width = 100
  const height = 26
  const parts: string[] = []

  parts.push(
    `<svg class="herd-trace" viewBox="0 0 ${width} ${height}" role="img"`,
    ` aria-label="${esc(options.title)}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">`,
    `<title>${esc(options.title)}</title>`,
  )

  for (const entry of series) {
    // Scaled against the limit rather than the data, so a trace that stays low
    // looks low. Normalising each series to its own peak would draw a mob that
    // never got above a walk as though it had been running.
    const ceiling = Math.max(entry.limit ?? 0, ...entry.values, 1e-6)
    const step = entry.values.length > 1 ? width / (entry.values.length - 1) : width

    const points = entry.values
      .map((value, index) => `${(index * step).toFixed(2)},${(height - (value / ceiling) * height).toFixed(2)}`)
      .join(' ')

    if (entry.limit != null) {
      const y = (height - (entry.limit / ceiling) * height).toFixed(2)
      parts.push(`<line class="herd-trace-limit herd-trace-${entry.key}" x1="0" y1="${y}" x2="${width}" y2="${y}"/>`)
    }

    parts.push(`<polyline class="herd-trace-line herd-trace-${entry.key}" points="${points}"/>`)
  }

  parts.push('</svg>')

  return parts.join('')
}

/** The envelope limits, for the strip chart's reference lines. */
export function traceLimits(envelope: Envelope): { speed: number, altitude: number } {
  return { speed: envelope.maxMobSpeedMs, altitude: envelope.maxAltitudeM }
}

import type { FieldImagery, FieldReport } from './catalog'

/**
 * Renders the demonstration field as SVG, server side, from the flight record.
 *
 * This is the site's main visual, and it is deliberately not an illustration:
 * every marker is a row in `detections`, every orange cell is a row in the
 * prescription's `zones`, and the boundary is the field's stored ring. Change
 * the data and the picture changes. That is the whole argument the page is
 * making, so drawing it any other way would undercut it.
 *
 * Coordinates are the normalised 0..1 field space the records already carry,
 * so the SVG needs no projection and scales to any container.
 */

export interface FieldMapOptions {
  /** Which layers to draw. Detail pages use subsets to make one point at a time. */
  showDetections?: boolean
  showZones?: boolean
  showTramlines?: boolean
  /**
   * Draw the flight's stitched image under the vectors, when it has one.
   *
   * On by default, because a map that has the ground available and shows a
   * flat green rectangle instead is hiding the most useful layer it owns.
   * Whether the viewer actually SEES it is a separate question: the switcher
   * ships both states in one SVG and lets CSS choose, so this only controls
   * whether the layer exists at all.
   */
  showImagery?: boolean
  /** Marker radius in field-space units. */
  markerScale?: number
  /** Accessible description. Required: the map carries real information. */
  title: string
}

function boundaryPath(boundary: [number, number][]): string {
  if (boundary.length === 0)
    return 'M 0 0 L 1 0 L 1 1 L 0 1 Z'

  return `${boundary.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(4)} ${y.toFixed(4)}`).join(' ')} Z`
}

/** Escape anything that reaches an attribute or a text node. */
function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * The stitched image, registered to the field and clipped to its boundary.
 *
 * `preserveAspectRatio="none"` is correct rather than lazy: an orthomosaic is
 * already rectified to a rectangle of ground, and `bounds` says which
 * rectangle, so stretching it to exactly that footprint is what puts a pixel
 * over the square metre it was taken of. Letting it letterbox instead would
 * shift every pixel away from the detection drawn on top of it.
 *
 * Clipped to the boundary because a stitch always overflies the field, and
 * the neighbour's ground is not ours to publish.
 */
function imageryLayer(imagery: FieldImagery, clipId: string): string {
  const [minX, minY, maxX, maxY] = imagery.bounds
  const width = maxX - minX
  const height = maxY - minY

  // A footprint with no area cannot be drawn, and an inverted one would draw
  // the field mirrored, which is worse than showing no imagery at all.
  if (!(width > 0) || !(height > 0))
    return ''

  return [
    `<g clip-path="url(#${clipId})">`,
    `<image class="orthomosaic" href="${esc(imagery.url)}"`,
    ` x="${minX}" y="${minY}" width="${width}" height="${height}"`,
    ' preserveAspectRatio="none"/>',
    '</g>',
  ].join('')
}

export function renderFieldMap(report: FieldReport, options: FieldMapOptions): string {
  const {
    showDetections = true,
    showZones = true,
    showTramlines = true,
    showImagery = true,
    markerScale = 1,
    title,
  } = options

  const clipId = `field-clip-${Math.abs(hash(title))}`
  const parts: string[] = []
  const imagery = showImagery && report.imagery ? imageryLayer(report.imagery, clipId) : ''

  parts.push(`<clipPath id="${clipId}"><path d="${boundaryPath(report.boundary)}"/></clipPath>`)
  parts.push(`<path class="boundary" d="${boundaryPath(report.boundary)}"/>`)

  // Under everything else: the picture is the ground, the vectors are what we
  // found on it. It sits after the boundary path so the boundary's own fill
  // stays available as the backdrop when the imagery is switched off.
  if (imagery)
    parts.push(imagery)

  if (showTramlines) {
    // The four corridors the sprayer runs on. They are where a good share of
    // the weed pressure sits, so showing them explains the map rather than
    // decorating it.
    const lanes = [0.24, 0.42, 0.61, 0.79]
    const lines = lanes
      .map(x => `<line class="tramline" x1="${x}" y1="0" x2="${x}" y2="1"/>`)
      .join('')
    parts.push(`<g clip-path="url(#${clipId})">${lines}</g>`)
  }

  if (showZones && report.zones.length > 0) {
    const rects = report.zones
      .map(z => `<rect class="zone" x="${z.x}" y="${z.y}" width="${z.w}" height="${z.h}"/>`)
      .join('')
    parts.push(`<g clip-path="url(#${clipId})">${rects}</g>`)
  }

  if (showDetections && report.detections.length > 0) {
    // Radius follows mapped area, floored so a small detection stays visible
    // and capped so a large patch does not swamp its neighbours.
    const dots = report.detections
      .map((d) => {
        const r = Math.min(0.014, Math.max(0.0035, Math.sqrt(d.area_m2) / 2600)) * markerScale
        const opacity = 0.55 + d.confidence * 0.45
        return `<circle class="detection" cx="${d.x}" cy="${d.y}" r="${r.toFixed(5)}" fill-opacity="${opacity.toFixed(2)}"/>`
      })
      .join('')
    parts.push(`<g clip-path="url(#${clipId})">${dots}</g>`)
  }

  const classes = imagery ? 'fieldmap fieldmap-imagery' : 'fieldmap'

  return [
    `<svg class="${classes}" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid meet" role="img" aria-label="${esc(title)}" xmlns="http://www.w3.org/2000/svg">`,
    `<title>${esc(title)}</title>`,
    ...parts,
    '</svg>',
  ].join('')
}

/** Stable id suffix so two maps on one page cannot share a clipPath. */
function hash(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h | 0
}

/**
 * A compact bar showing treated ground against the rest of the field.
 *
 * Deliberately not a progress bar with a filled track: this is a proportion of
 * one field, so it is drawn as one bar split in two, with the split at the
 * measured ratio.
 */
export function renderTreatedBar(report: FieldReport): string {
  const pct = Math.max(0, Math.min(100, report.treatedPercent))
  return [
    '<svg viewBox="0 0 100 6" preserveAspectRatio="none" role="img"',
    ` aria-label="${esc(`${report.treatedHectares} of ${report.hectares} hectares flagged for treatment`)}"`,
    ' style="width:100%;height:0.5rem;display:block;border-radius:3px;overflow:hidden" xmlns="http://www.w3.org/2000/svg">',
    '<rect x="0" y="0" width="100" height="6" fill="var(--crop-soft)"/>',
    `<rect x="0" y="0" width="${pct.toFixed(2)}" height="6" fill="var(--accent)"/>`,
    '</svg>',
  ].join('')
}

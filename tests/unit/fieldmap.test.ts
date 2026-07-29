import type { FieldReport } from '../../app/Support/catalog'
import { describe, expect, test } from 'bun:test'
import { renderFieldMap, renderFieldMapSwitch } from '../../app/Support/fieldmap'

/**
 * The imagery layer of the field map.
 *
 * What is worth testing here is registration and restraint: the stitched
 * image has to land on the footprint it was recorded with, or every marker
 * drawn over it is quietly wrong, and it must not be emitted at all on maps
 * that have no way to show it, or the page carries an orthomosaic nobody
 * sees.
 */
function report(overrides: Partial<FieldReport> = {}): FieldReport {
  return {
    sample: true,
    farm: 'Hofgut Lindenbach',
    region: 'Niederbayern',
    field: 'Lindenbach Nord',
    crop: 'winter wheat',
    hectares: 24.6,
    flownAt: '2026-04-18 06:40:00',
    resolutionCm: 1,
    durationMinutes: 31,
    detections: [{ kind: 'weed', label: 'Blackgrass', x: 0.4, y: 0.6, area_m2: 320, severity: 'medium', confidence: 0.9 }],
    zones: [{ x: 0.3, y: 0.5, w: 0.1, h: 0.1, rate: 140 }],
    boundary: [[0, 0], [1, 0], [1, 1], [0, 1]],
    imagery: null,
    treatedHectares: 4.34,
    treatedPercent: 17.6,
    speciesBreakdown: [{ label: 'Blackgrass', count: 1 }],
    ...overrides,
  }
}

const imagery = { url: '/imagery/lindenbach-nord.webp', bounds: [-0.04, -0.03, 1.05, 1.02] as [number, number, number, number], resolutionCm: 4 }

describe('field map imagery', () => {
  test('a map without a stitch draws no image', () => {
    const svg = renderFieldMap(report(), { title: 'plain' })
    expect(svg).not.toContain('<image')
  })

  test('the layer is opt-in, so maps that cannot show it do not fetch it', () => {
    // The switcher is the only thing that can reveal the layer, so a bare map
    // must leave it out even when the flight has one attached.
    const svg = renderFieldMap(report({ imagery }), { title: 'stages' })
    expect(svg).not.toContain('<image')
  })

  test('the image is placed on its recorded footprint, not the unit square', () => {
    const svg = renderFieldMap(report({ imagery }), { title: 'registered', showImagery: true })

    expect(svg).toContain('class="orthomosaic"')
    expect(svg).toContain('href="/imagery/lindenbach-nord.webp"')
    expect(svg).toContain('x="-0.04"')
    expect(svg).toContain('y="-0.03"')
    // 1.05 - -0.04 and 1.02 - -0.03, floating point included: the point is
    // that the width comes from the bounds rather than from the viewBox.
    expect(svg).toMatch(/width="1\.09\d*"/)
    expect(svg).toMatch(/height="1\.05\d*"/)
    // Stretched to the footprint rather than letterboxed into it, which is
    // what keeps a pixel over the ground it was taken of.
    expect(svg).toContain('preserveAspectRatio="none"')
  })

  test('the image is clipped to the boundary, so no neighbour is published', () => {
    const svg = renderFieldMap(report({ imagery }), { title: 'clipped', showImagery: true })
    const layer = svg.slice(svg.indexOf('<image'))
    expect(svg.slice(0, svg.indexOf('<image'))).toContain('<g clip-path="url(#field-clip-')
    expect(layer).toContain('</g>')
  })

  test('a footprint with no area is dropped rather than drawn inside out', () => {
    const flat = renderFieldMap(report({ imagery: { ...imagery, bounds: [0.5, 0, 0.5, 1] } }), { title: 'flat', showImagery: true })
    const mirrored = renderFieldMap(report({ imagery: { ...imagery, bounds: [1, 1, 0, 0] } }), { title: 'mirrored', showImagery: true })

    expect(flat).not.toContain('<image')
    expect(mirrored).not.toContain('<image')
  })

  test('a url cannot break out of its attribute', () => {
    const nasty = renderFieldMap(
      report({ imagery: { ...imagery, url: '/x.webp" onload="alert(1)' } }),
      { title: 'escaped', showImagery: true },
    )

    expect(nasty).not.toContain('onload="alert(1)"')
    expect(nasty).toContain('&quot;')
  })

  test('the imagery class marks the maps that have a picture behind them', () => {
    expect(renderFieldMap(report({ imagery }), { title: 'a', showImagery: true })).toContain('class="fieldmap fieldmap-imagery"')
    expect(renderFieldMap(report(), { title: 'b' })).toContain('class="fieldmap"')
  })
})

describe('field map switcher', () => {
  test('no stitch, no switch', () => {
    const html = renderFieldMapSwitch(report(), { title: 'no imagery' })
    expect(html).not.toContain('mapswitch')
    expect(html.startsWith('<svg')).toBe(true)
  })

  test('a stitch gets two radios, with the plan selected first', () => {
    const html = renderFieldMapSwitch(report({ imagery }), { title: 'switched' })

    expect(html).toContain('class="mapswitch-input mapswitch-input-plan"')
    expect(html).toContain('class="mapswitch-input mapswitch-input-imagery"')
    expect(html).toMatch(/mapswitch-input-plan" name="[^"]+" id="[^"]+-plan" checked/)
    expect(html).toContain('<image')
  })

  test('the radios share one group, and the labels drive it', () => {
    const html = renderFieldMapSwitch(report({ imagery }), { title: 'grouped' })
    const names = [...html.matchAll(/name="([^"]+)"/g)].map(m => m[1])

    expect(new Set(names).size).toBe(1)
    expect(html).toContain(`for="${names[0]}-plan"`)
    expect(html).toContain(`for="${names[0]}-imagery"`)
  })

  test('two maps on one page do not steer each other', () => {
    const first = renderFieldMapSwitch(report({ imagery }), { title: 'hero map' })
    const second = renderFieldMapSwitch(report({ imagery }), { title: 'report map' })

    const group = (html: string): string => html.match(/name="([^"]+)"/)?.[1] ?? ''
    expect(group(first)).not.toBe(group(second))
  })

  test('labels default to translation tokens, because the locale is not known yet', () => {
    const html = renderFieldMapSwitch(report({ imagery }), { title: 'tokens' })
    expect(html).toContain('{t:fieldReport.viewPlan}')
    expect(html).toContain('{t:fieldReport.viewImagery}')
  })
})

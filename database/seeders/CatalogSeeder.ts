import { Seeder } from '@stacksjs/database'
import Detection from '../../app/Models/Detection'
import Drone from '../../app/Models/Drone'
import Farm from '../../app/Models/Farm'
import Feature from '../../app/Models/Feature'
import Field from '../../app/Models/Field'
import Mission from '../../app/Models/Mission'
import TreatmentMap from '../../app/Models/TreatmentMap'
import UseCase from '../../app/Models/UseCase'
import {
  DEMO_BOUNDARY,
  DEMO_FARM,
  DEMO_FIELD,
  demoDetections,
  demoTreatedHectares,
  demoZones,
} from '../../app/Support/content/demo-field'
import { features } from '../../app/Support/content/features'
import { useCases } from '../../app/Support/content/use-cases'

/**
 * Seeds everything the site and the public API serve:
 *
 *  1. The capability catalog and the use cases, from the content modules that
 *     are their source of truth.
 *  2. The demonstration field: one farm, one field, one weed-mapping flight,
 *     its detections and the prescription that came out of it.
 *
 * Written through the models rather than the per-attribute factories on
 * purpose. `useSeeder` and its factories exist to produce plausible RANDOM
 * rows, which is the right tool for filling a dashboard during development
 * and the wrong one here: this content is authored, and the field is a fixed
 * dataset whose figures are quoted in the copy, so it has to come out
 * identical on every machine that runs the seeder.
 *
 * Re-running is safe. Every table is truncated first.
 *
 * Run with `./buddy seed --class=CatalogSeeder`.
 */
export default class CatalogSeeder extends Seeder {
  async run(): Promise<void> {
    // Cross-check the two content modules before writing anything: a feature
    // listing a use case that no longer exists (or the reverse) produces dead
    // links in the mega menu, and that is much cheaper to catch here than in
    // a crawler.
    const featureSlugs = new Set(features.map(f => f.slug))
    const useCaseSlugs = new Set(useCases.map(u => u.slug))

    for (const feature of features) {
      for (const slug of feature.useCases) {
        if (!useCaseSlugs.has(slug))
          throw new Error(`Feature "${feature.slug}" references unknown use case "${slug}"`)
      }
    }

    for (const useCase of useCases) {
      for (const slug of useCase.features) {
        if (!featureSlugs.has(slug))
          throw new Error(`Use case "${useCase.slug}" references unknown feature "${slug}"`)
      }
    }

    // Children first: a truncate that ran the other way would orphan rows.
    await TreatmentMap.truncate()
    await Detection.truncate()
    await Mission.truncate()
    await Field.truncate()
    await Drone.truncate()
    await Farm.truncate()
    await UseCase.truncate()
    await Feature.truncate()

    await Feature.createMany(features.map(f => ({
      slug: f.slug,
      name: f.name,
      category: f.category,
      tagline: f.tagline,
      summary: f.summary,
      problem: f.problem,
      steps: JSON.stringify(f.steps),
      sensors: JSON.stringify(f.sensors),
      outputs: JSON.stringify(f.outputs),
      readings: JSON.stringify(f.readings),
      cadence: f.cadence,
      use_case_slugs: JSON.stringify(f.useCases),
      sort_order: f.order,
    })))

    await UseCase.createMany(useCases.map(u => ({
      slug: u.slug,
      name: u.name,
      segment: u.segment,
      tagline: u.tagline,
      summary: u.summary,
      challenge: u.challenge,
      approach: u.approach,
      season: JSON.stringify(u.season),
      feature_slugs: JSON.stringify(u.features),
      outcomes: JSON.stringify(u.outcomes),
      scale: u.scale,
      sort_order: u.order,
    })))

    // The demonstration field.
    const farm = await Farm.create({
      name: DEMO_FARM.name,
      slug: DEMO_FARM.slug,
      region: DEMO_FARM.region,
      segment: DEMO_FARM.segment,
      hectares: DEMO_FARM.hectares,
    }) as Record<string, any>

    const drone = await Drone.create({
      callsign: 'OF-K12',
      model: 'Scout',
      payload: 'multispectral',
      status: 'docked',
      station: 'Lindenbach dock',
      battery_percent: 100,
      flight_hours: 412,
      farm_id: farm.id,
    }) as Record<string, any>

    const field = await Field.create({
      name: DEMO_FIELD.name,
      slug: DEMO_FIELD.slug,
      crop: DEMO_FIELD.crop,
      hectares: DEMO_FIELD.hectares,
      status: 'active',
      latitude: DEMO_FIELD.latitude,
      longitude: DEMO_FIELD.longitude,
      boundary: JSON.stringify(DEMO_BOUNDARY),
      farm_id: farm.id,
    }) as Record<string, any>

    const detections = demoDetections()
    const zones = demoZones(detections)
    const treated = demoTreatedHectares(zones)

    const mission = await Mission.create({
      purpose: 'targeted-weed-control',
      status: 'complete',
      flown_at: '2026-04-18 06:40:00',
      hectares_covered: DEMO_FIELD.hectares,
      duration_minutes: 31,
      resolution_cm: 1,
      summary: `Weed map flown at 1 cm/px. ${detections.length} detections across ${zones.length} treatment zones.`,
      farm_id: farm.id,
      field_id: field.id,
      drone_id: drone.id,
    }) as Record<string, any>

    await Detection.createMany(detections.map(d => ({
      kind: d.kind,
      label: d.label,
      confidence: d.confidence,
      severity: d.severity,
      area_m2: d.area_m2,
      x: d.x,
      y: d.y,
      // Spread the normalised position back onto real coordinates around the
      // field centroid, roughly a 500 m block at this latitude, so the records
      // carry a position a machine could actually navigate to.
      latitude: Number((DEMO_FIELD.latitude + (d.y - 0.5) * 0.0045).toFixed(6)),
      longitude: Number((DEMO_FIELD.longitude + (d.x - 0.5) * 0.0068).toFixed(6)),
      status: 'confirmed',
      mission_id: mission.id,
      field_id: field.id,
    })))

    await TreatmentMap.create({
      product: 'Herbicide',
      zones: JSON.stringify(zones),
      treated_hectares: treated,
      field_hectares: DEMO_FIELD.hectares,
      rate_per_hectare: 140,
      format: 'isoxml',
      status: 'applied',
      notes: `${zones.length} zones on a 16 by 22 grid. Cells below 150 m² of mapped weed area are left untreated.`,
      mission_id: mission.id,
      field_id: field.id,
    })
  }
}

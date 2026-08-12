import type { CLI } from '@stacksjs/types'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'
import Detection from '../Models/Detection'
import Drone from '../Models/Drone'
import Farm from '../Models/Farm'
import Feature from '../Models/Feature'
import Field from '../Models/Field'
import Mission from '../Models/Mission'
import TreatmentMap from '../Models/TreatmentMap'
import UseCase from '../Models/UseCase'
import {
  DEMO_BOUNDARY,
  DEMO_FARM,
  DEMO_FIELD,
  demoDetections,
  demoTreatedHectares,
  demoZones,
} from '../Support/content/demo-field'
import { features } from '../Support/content/features'
import { useCases } from '../Support/content/use-cases'

/**
 * `buddy catalog:sync` — publish the catalog and the demonstration field.
 *
 * Writes everything the site and the public API serve:
 *
 *  1. The capability catalog and the use cases, from the content modules that
 *     are their source of truth.
 *  2. The demonstration field: one farm, one field, one weed-mapping flight,
 *     its detections and the prescription that came out of it.
 *
 * A command rather than a seeder on purpose. `buddy seed` walks models
 * carrying a `useSeeder` trait and fills them from the per-attribute
 * `factory` functions, which is exactly right for plausible RANDOM rows and
 * exactly wrong here: this is authored content, and the field is a fixed
 * dataset whose figures are quoted in the copy, so it has to come out
 * identical on every machine. Publishing it is a deploy step, not a seed.
 *
 * Re-running is safe. Every table is truncated first, so this is also how a
 * content edit reaches production: `preStart` runs it on every deploy.
 */
export default function (cli: CLI) {
  cli
    .command('catalog:sync', 'Publish the capability catalog and the demonstration field into the database')
    .action(async () => {
      try {
        await syncCatalog()
        log.success(`Catalog synced: ${features.length} capabilities, ${useCases.length} use cases, and the demonstration field.`)
      }
      catch (error) {
        // `log` writes asynchronously; exiting without flushing loses the very
        // line that says what went wrong, which is how this failed silently.
        log.error(`Catalog sync failed: ${error instanceof Error ? error.message : String(error)}`)
        await log.flush()
        process.exit(ExitCode.FatalError)
      }

      await log.flush()
      process.exit(ExitCode.Success)
    })
}

async function syncCatalog(): Promise<void> {
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

  /*
   * Only what this command owns is cleared.
   *
   * It used to truncate every table, which was fine when the database held
   * nothing but the catalog and the demonstration flight. It is not fine now
   * that farmers have accounts: the deploy runs this on every release, and a
   * truncate would take a customer's fields and flights with it. The catalog
   * tables are wholly derived from the content modules and can be replaced;
   * the demonstration records are found by their own slug and removed
   * individually, children first so nothing is orphaned.
   */
  await UseCase.truncate()
  await Feature.truncate()

  /*
   * What `buddy imagery:attach` published outlives the rewrite.
   *
   * The demonstration flight is deleted and recreated below, so a stitch
   * attached to it would be dropped by the next deploy - and attaching one is
   * a publishing step somebody ran by hand against a file the deploy has
   * never seen, so nothing would put it back. The three orthomosaic columns
   * are therefore read off the outgoing flight and written onto the new one.
   *
   * Only the columns, not the file: the image itself lives under `public/`
   * or at a URL, and neither is this command's to manage.
   */
  let publishedImagery: Record<string, unknown> | null = null

  const demoFarm = await Farm.where('slug', DEMO_FARM.slug).first()
  if (demoFarm?.id) {
    const farmId = Number(demoFarm.id)
    const missions = await Mission.where('farm_id', farmId).get()
    const missionIds = missions.map(row => Number(row.id))

    const stitched = missions.find(row => String(row.orthomosaic_url ?? '').length > 0)
    if (stitched) {
      publishedImagery = {
        orthomosaic_url: String(stitched.orthomosaic_url),
        orthomosaic_bounds: String(stitched.orthomosaic_bounds ?? ''),
        orthomosaic_resolution_cm: Number(stitched.orthomosaic_resolution_cm ?? 0),
      }
    }

    for (const missionId of missionIds) {
      await TreatmentMap.where('mission_id', missionId).delete()
      await Detection.where('mission_id', missionId).delete()
    }

    await Mission.where('farm_id', farmId).delete()
    await Field.where('farm_id', farmId).delete()
    await Drone.where('farm_id', farmId).delete()
    await Farm.where('id', farmId).delete()
  }

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
    ...publishedImagery,
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

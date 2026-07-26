import { Database } from 'bun:sqlite'
import { Seeder } from '@stacksjs/database'
import { features } from '../../app/Support/content/features'
import {
  DEMO_BOUNDARY,
  DEMO_FARM,
  DEMO_FIELD,
  demoDetections,
  demoTreatedHectares,
  demoZones,
} from '../../app/Support/content/demo-field'
import { useCases } from '../../app/Support/content/use-cases'
import { dbPath } from '../../app/Support/db'

/**
 * Seeds everything the site and the public API serve:
 *
 *  1. The capability catalog and the use cases, from the content modules that
 *     are their source of truth.
 *  2. The demonstration field: one farm, one field, one weed-mapping flight,
 *     its detections and the prescription that came out of it.
 *
 * Written through Bun's SQLite driver rather than the model factories on
 * purpose: this is curated content and a deterministic dataset, and factories
 * produce random rows. Re-running is safe, every table is cleared first.
 *
 * Run with `./buddy seed --class=CatalogSeeder`.
 */
export default class CatalogSeeder extends Seeder {
  async run(): Promise<void> {
    const db = new Database(dbPath())
    // A fixed timestamp keeps a reseed from showing up as a content change.
    const now = '2026-07-26 08:00:00'

    try {
      // Cross-check the two content modules before writing anything: a
      // feature listing a use case that no longer exists (or the reverse)
      // produces dead links in the mega menu, and that is much cheaper to
      // catch here than in a crawler.
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

      db.run('DELETE FROM treatment_maps')
      db.run('DELETE FROM detections')
      db.run('DELETE FROM missions')
      db.run('DELETE FROM fields')
      db.run('DELETE FROM drones')
      db.run('DELETE FROM farms')
      db.run('DELETE FROM use_cases')
      db.run('DELETE FROM features')

      const insertFeature = db.prepare(`
        INSERT INTO features
          (slug, name, category, tagline, summary, problem, steps, sensors, outputs, readings, cadence, use_case_slugs, sort_order, created_at, uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      features.forEach((f, index) => {
        insertFeature.run(
          f.slug,
          f.name,
          f.category,
          f.tagline,
          f.summary,
          f.problem,
          JSON.stringify(f.steps),
          JSON.stringify(f.sensors),
          JSON.stringify(f.outputs),
          JSON.stringify(f.readings),
          f.cadence,
          JSON.stringify(f.useCases),
          f.order,
          now,
          `feature-${index + 1}`,
        )
      })

      const insertUseCase = db.prepare(`
        INSERT INTO use_cases
          (slug, name, segment, tagline, summary, challenge, approach, season, feature_slugs, outcomes, scale, sort_order, created_at, uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      useCases.forEach((u, index) => {
        insertUseCase.run(
          u.slug,
          u.name,
          u.segment,
          u.tagline,
          u.summary,
          u.challenge,
          u.approach,
          JSON.stringify(u.season),
          JSON.stringify(u.features),
          JSON.stringify(u.outcomes),
          u.scale,
          u.order,
          now,
          `use-case-${index + 1}`,
        )
      })

      // The demonstration field.
      const { lastInsertRowid: farmId } = db
        .prepare('INSERT INTO farms (name, slug, region, segment, hectares, created_at, uuid) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(DEMO_FARM.name, DEMO_FARM.slug, DEMO_FARM.region, DEMO_FARM.segment, DEMO_FARM.hectares, now, 'farm-1')

      const { lastInsertRowid: droneId } = db
        .prepare('INSERT INTO drones (callsign, model, payload, status, station, battery_percent, flight_hours, farm_id, created_at, uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run('OF-K12', 'Scout', 'multispectral', 'docked', 'Lindenbach dock', 100, 412, Number(farmId), now, 'drone-1')

      const { lastInsertRowid: fieldId } = db
        .prepare('INSERT INTO fields (name, slug, crop, hectares, status, latitude, longitude, boundary, farm_id, created_at, uuid) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .run(
          DEMO_FIELD.name,
          DEMO_FIELD.slug,
          DEMO_FIELD.crop,
          DEMO_FIELD.hectares,
          'active',
          DEMO_FIELD.latitude,
          DEMO_FIELD.longitude,
          JSON.stringify(DEMO_BOUNDARY),
          Number(farmId),
          now,
          'field-1',
        )

      const detections = demoDetections()
      const zones = demoZones(detections)
      const treated = demoTreatedHectares(zones)

      const { lastInsertRowid: missionId } = db
        .prepare(`
          INSERT INTO missions
            (purpose, status, flown_at, hectares_covered, duration_minutes, resolution_cm, summary, farm_id, field_id, drone_id, created_at, uuid)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          'targeted-weed-control',
          'complete',
          '2026-04-18 06:40:00',
          DEMO_FIELD.hectares,
          31,
          1,
          `Weed map flown at 1 cm/px. ${detections.length} detections across ${zones.length} treatment zones.`,
          Number(farmId),
          Number(fieldId),
          Number(droneId),
          now,
          'mission-1',
        )

      const insertDetection = db.prepare(`
        INSERT INTO detections
          (kind, label, confidence, severity, area_m2, x, y, latitude, longitude, status, mission_id, field_id, created_at, uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)

      detections.forEach((d, index) => {
        // Spread the normalised position back onto real coordinates around the
        // field centroid so the records carry a usable position, roughly a
        // 500 m block at this latitude.
        const lat = DEMO_FIELD.latitude + (d.y - 0.5) * 0.0045
        const lng = DEMO_FIELD.longitude + (d.x - 0.5) * 0.0068

        insertDetection.run(
          d.kind,
          d.label,
          d.confidence,
          d.severity,
          d.area_m2,
          d.x,
          d.y,
          Number(lat.toFixed(6)),
          Number(lng.toFixed(6)),
          'confirmed',
          Number(missionId),
          Number(fieldId),
          now,
          `detection-${index + 1}`,
        )
      })

      db.prepare(`
        INSERT INTO treatment_maps
          (product, zones, treated_hectares, field_hectares, rate_per_hectare, format, status, notes, mission_id, field_id, created_at, uuid)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'Herbicide',
        JSON.stringify(zones),
        treated,
        DEMO_FIELD.hectares,
        140,
        'isoxml',
        'applied',
        `${zones.length} zones on a 16 by 22 grid. Cells below 150 m² of mapped weed area are left untreated.`,
        Number(missionId),
        Number(fieldId),
        now,
        'treatment-map-1',
      )
    }
    finally {
      db.close()
    }
  }
}

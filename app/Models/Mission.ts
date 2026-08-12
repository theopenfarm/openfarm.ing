import { defineModel } from '@stacksjs/orm'
import * as seed from '../Support/factories'
import { schema } from '@stacksjs/validation'

/**
 * One flight over one field for one purpose.
 *
 * `purpose` is the feature slug the flight was tasked with, which is what ties
 * a capability in the catalog to the work that actually happens over a field.
 */
export default defineModel({
  name: 'Mission',
  table: 'missions',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useSeeder: { count: 24 },
    useUuid: true,
    useTimestamps: true,
    observe: true,
    useApi: {
      uri: 'missions',
      routes: ['index', 'show', 'store', 'update', 'destroy'],
      // A holding's operating data, never public.
      middleware: ['auth', 'farm-scope'],
    },
  },

  belongsTo: ['Farm', 'Field', 'Drone'],
  hasMany: ['Detection', 'TreatmentMap'],

  attributes: {
    /*
     * The relation keys are declared so the API can see them.
     *
     * Writable and filterable columns are built from a model's attributes, so
     * an undeclared key cannot be set by a POST or narrowed with `?key=` -
     * which is what every tenant-scoped read needs. The seeder still wires
     * them: a declared key that comes out empty is filled from the parent it
     * points at.
     */
    /** Denormalised from the field, so a holding’s flights are one query. */
    farm_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The parcel flown. */
    field_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The aircraft that flew it. */
    drone_id: {
      required: false,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** Feature slug this flight was tasked with. */
    purpose: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: faker => seed.capability(faker),
    },

    status: {
      required: false,
      order: 2,
      fillable: true,
      default: 'scheduled',
      validation: {
        rule: schema.enum(['scheduled', 'flying', 'processing', 'complete', 'weather_cancelled', 'failed']),
      },
      factory: () => 'complete',
    },

    flown_at: {
      required: false,
      order: 3,
      fillable: true,
      /*
       * A string, not `schema.date()`.
       *
       * This column holds a moment, not a day: the factory writes an ISO
       * timestamp and the demonstration flight is a dawn one. `schema.date()`
       * takes a `Date` or a date-only `YYYY-MM-DD` string and rejects every
       * datetime string, and a `Date` cannot be bound to SQLite, so there is
       * no value that satisfies both it and the driver.
       */
      validation: { rule: schema.string().max(40) },
      factory: faker => seed.flownOn(faker),
    },

    /** Ground covered on this flight. */
    hectares_covered: {
      required: false,
      order: 4,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 1, max: 90 }),
    },

    duration_minutes: {
      required: false,
      order: 5,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 6, max: 45 }),
    },

    /** Ground sample distance in centimetres per pixel. */
    resolution_cm: {
      required: false,
      order: 6,
      fillable: true,
      validation: { rule: schema.number().min(0) },
      factory: () => 1,
    },

    /** One line for the flight log. */
    summary: {
      required: false,
      order: 7,
      fillable: true,
      validation: { rule: schema.string().max(600) },
      factory: faker => seed.missionNote(faker),
    },

    /**
     * The stitched image of the field this flight produced.
     *
     * Only the address: the file is served from `public/` or a bucket, and an
     * orthomosaic is far too large to sit in a row. Empty until the stitch
     * has been attached, which is why every reader treats it as optional.
     */
    orthomosaic_url: {
      required: false,
      order: 9,
      fillable: true,
      validation: { rule: schema.string().max(600) },
      factory: () => '',
    },

    /**
     * Where the image sits in the field's own normalised space.
     *
     * `[minX, minY, maxX, maxY]`, 0..1 on each axis, matching the coordinates
     * the boundary and the detections already use. A stitch overflies the
     * boundary, so this is normally a little outside 0..1 on every side, and
     * without it the picture would be out of register with the markers drawn
     * over it.
     */
    orthomosaic_bounds: {
      required: false,
      order: 10,
      fillable: true,
      validation: { rule: schema.string().max(200) },
      factory: () => '',
    },

    /** Ground sample distance of the stitched output, usually coarser than the capture. */
    orthomosaic_resolution_cm: {
      required: false,
      order: 11,
      fillable: true,
      validation: { rule: schema.number().min(0) },
      factory: () => null,
    },

    /** Why a flight did not happen, when status says it did not. */
    cancellation_reason: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(300) },
      factory: () => '',
    },
  },
})

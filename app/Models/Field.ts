import { defineModel } from '@stacksjs/orm'
import * as seed from '../Support/factories'
import { schema } from '@stacksjs/validation'

/**
 * A single block of ground. Everything the platform produces is scoped to a
 * field: the flight plan, the detections, the prescription.
 */
export default defineModel({
  name: 'Field',
  table: 'fields',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useSeeder: { count: 12 },
    useUuid: true,
    useTimestamps: true,
    useSoftDeletes: true,
    useApi: {
      uri: 'fields',
      routes: ['index', 'show', 'store', 'update', 'destroy'],
      // A holding's operating data, never public.
      middleware: ['auth', 'farm-scope'],
    },
  },

  belongsTo: ['Farm'],
  hasMany: ['Mission', 'Detection'],

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
    /** The holding this parcel belongs to. */
    farm_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    name: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(1).max(160) },
      factory: faker => seed.fieldName(faker),
    },

    slug: {
      required: true,
      unique: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => seed.fieldSlug(faker),
    },

    crop: {
      required: true,
      order: 3,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: faker => seed.crop(faker),
    },

    hectares: {
      required: true,
      order: 4,
      fillable: true,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 2, max: 120 }),
    },

    status: {
      required: false,
      order: 5,
      fillable: true,
      default: 'active',
      validation: { rule: schema.enum(['active', 'fallow', 'archived']) },
      factory: () => 'active',
    },

    /** Field centroid, for the map and for flight planning. */
    latitude: {
      required: false,
      order: 6,
      fillable: true,
      validation: { rule: schema.number() },
      factory: faker => seed.latitude(faker),
    },

    longitude: {
      required: false,
      order: 7,
      fillable: true,
      validation: { rule: schema.number() },
      factory: faker => seed.longitude(faker),
    },

    /** Boundary as a normalised ring, [[x, y], ...] in 0..1 field space. */
    boundary: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(8000) },
      factory: faker => seed.boundary(faker),
    },
  },
})

import { defineModel } from '@stacksjs/orm'
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
    useUuid: true,
    useTimestamps: true,
    useSoftDeletes: true,
    useApi: {
      uri: 'fields',
      routes: ['index', 'show'],
    },
  },

  belongsTo: ['Farm'],
  hasMany: ['Mission', 'Detection'],

  attributes: {
    name: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(1).max(160) },
      factory: faker => `${faker.location.street()} Field`,
    },

    slug: {
      required: true,
      unique: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => faker.lorem.slug(),
    },

    crop: {
      required: true,
      order: 3,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: () => 'winter wheat',
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
      factory: faker => faker.location.latitude(),
    },

    longitude: {
      required: false,
      order: 7,
      fillable: true,
      validation: { rule: schema.number() },
      factory: faker => faker.location.longitude(),
    },

    /** Boundary as a normalised ring, [[x, y], ...] in 0..1 field space. */
    boundary: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(8000) },
      factory: () => '[]',
    },
  },
})

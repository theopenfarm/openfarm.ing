import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/**
 * One thing found on one flight, located to a patch of ground.
 *
 * Positions are stored in normalised field space (0..1 on each axis) alongside
 * the real coordinate, so a detection can be drawn on the field map without
 * every renderer needing a projection.
 */
export default defineModel({
  name: 'Detection',
  table: 'detections',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useSearch: {
      displayable: ['id', 'kind', 'label', 'severity', 'confidence'],
      searchable: ['kind', 'label'],
      sortable: ['severity', 'confidence', 'area_m2'],
      filterable: ['kind', 'status'],
    },
    useApi: {
      uri: 'detections',
      routes: ['index', 'show'],
    },
  },

  belongsTo: ['Mission', 'Field'],

  attributes: {
    kind: {
      required: true,
      order: 1,
      fillable: true,
      validation: {
        rule: schema.enum(['weed', 'disease', 'pest', 'nutrient', 'moisture', 'compaction', 'wildlife', 'gap', 'livestock']),
      },
      factory: () => 'weed',
    },

    /** What it is, in the grower's language. */
    label: {
      required: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().max(160) },
      factory: faker => faker.lorem.words(2),
    },

    /** Model confidence, 0..1. Anything low is queued for human review. */
    confidence: {
      required: false,
      order: 3,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0).max(1) },
      factory: faker => faker.number.float({ min: 0.5, max: 1 }),
    },

    severity: {
      required: false,
      order: 4,
      fillable: true,
      default: 'low',
      validation: { rule: schema.enum(['low', 'medium', 'high']) },
      factory: () => 'medium',
    },

    area_m2: {
      required: false,
      order: 5,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 4, max: 4000 }),
    },

    /** Normalised position in field space, 0..1. */
    x: {
      required: false,
      order: 6,
      fillable: true,
      validation: { rule: schema.number().min(0).max(1) },
      factory: faker => faker.number.float({ min: 0, max: 1 }),
    },

    y: {
      required: false,
      order: 7,
      fillable: true,
      validation: { rule: schema.number().min(0).max(1) },
      factory: faker => faker.number.float({ min: 0, max: 1 }),
    },

    latitude: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.number() },
      factory: faker => faker.location.latitude(),
    },

    longitude: {
      required: false,
      order: 9,
      fillable: true,
      validation: { rule: schema.number() },
      factory: faker => faker.location.longitude(),
    },

    status: {
      required: false,
      order: 10,
      fillable: true,
      default: 'open',
      validation: { rule: schema.enum(['open', 'review', 'confirmed', 'treated', 'dismissed']) },
      factory: () => 'open',
    },
  },
})

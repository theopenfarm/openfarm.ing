import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/**
 * The prescription a flight produces: the zones a machine should treat, and
 * nothing else.
 *
 * `treated_hectares` against the field's own area is the number the whole
 * product is arguing about, so it is stored rather than derived at read time.
 */
export default defineModel({
  name: 'TreatmentMap',
  table: 'treatment_maps',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useApi: {
      uri: 'treatment-maps',
      routes: ['index', 'show'],
    },
  },

  belongsTo: ['Mission', 'Field'],

  attributes: {
    /** What the machine applies, or the mechanical operation performed. */
    product: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().max(160) },
      factory: () => 'Herbicide',
    },

    /** Ordered zones: [{ x, y, w, h, rate }] in normalised field space. */
    zones: {
      required: false,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().max(20000) },
      factory: () => '[]',
    },

    treated_hectares: {
      required: false,
      order: 3,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.float({ min: 0.2, max: 12 }),
    },

    field_hectares: {
      required: false,
      order: 4,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 5, max: 90 }),
    },

    /** Litres or kilograms per hectare across the treated zones. */
    rate_per_hectare: {
      required: false,
      order: 5,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.float({ min: 0.5, max: 200 }),
    },

    /** The file a terminal actually loads. */
    format: {
      required: false,
      order: 6,
      fillable: true,
      default: 'isoxml',
      validation: { rule: schema.enum(['isoxml', 'shapefile', 'geojson', 'csv']) },
      factory: () => 'isoxml',
    },

    status: {
      required: false,
      order: 7,
      fillable: true,
      default: 'ready',
      validation: { rule: schema.enum(['draft', 'ready', 'applied', 'superseded']) },
      factory: () => 'ready',
    },

    notes: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(600) },
      factory: faker => faker.lorem.sentence(),
    },
  },
})

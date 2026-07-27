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
      routes: ['index', 'show'],
    },
  },

  belongsTo: ['Farm', 'Field', 'Drone'],
  hasMany: ['Detection', 'TreatmentMap'],

  attributes: {
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
      validation: { rule: schema.date() },
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

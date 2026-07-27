import { defineModel } from '@stacksjs/orm'
import * as seed from '../Support/factories'
import { schema } from '@stacksjs/validation'

/** A customer holding. Fields, drones and missions all hang off it. */
export default defineModel({
  name: 'Farm',
  table: 'farms',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useSeeder: { count: 3 },
    useUuid: true,
    useTimestamps: true,
    useSoftDeletes: true,
    useApi: {
      uri: 'farms',
      routes: ['index', 'show'],
    },
  },

  // A holding belongs to the account that signed up for it, which is what
  // scopes the dashboard: a farmer sees their own fields and nobody else's.
  // The demonstration farm has no owner, so it belongs to no account and
  // shows up on no dashboard.
  belongsTo: ['User'],

  hasMany: ['Field', 'Drone', 'Mission'],

  attributes: {
    name: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(2).max(160) },
      factory: faker => seed.farmName(faker),
    },

    slug: {
      required: true,
      unique: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => seed.farmSlug(faker),
    },

    region: {
      required: false,
      order: 3,
      fillable: true,
      validation: { rule: schema.string().max(120) },
      factory: faker => seed.region(faker),
    },

    /** Which use case this holding is set up as. */
    segment: {
      required: false,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: faker => seed.segment(faker),
    },

    hectares: {
      required: false,
      order: 5,
      fillable: true,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 20, max: 900 }),
    },
  },
})

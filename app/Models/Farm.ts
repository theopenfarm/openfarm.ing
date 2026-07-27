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
    /**
     * The owner, declared so the seeder does not invent one.
     *
     * `belongsTo: ['User']` alone would have the seeder point every seeded
     * holding at a random existing account — which on a real database means
     * handing a farmer somebody else's invented fields. Declaring the column
     * with a null factory keeps seeded farms unowned; `buddy demo:seed`
     * assigns them deliberately, and the demonstration farm stays unowned so
     * it shows up on no dashboard.
     */
    user_id: {
      required: false,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

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

import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/** A customer holding. Fields, drones and missions all hang off it. */
export default defineModel({
  name: 'Farm',
  table: 'farms',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    useSoftDeletes: true,
    useSearch: {
      displayable: ['id', 'name', 'region', 'hectares'],
      searchable: ['name', 'region'],
      sortable: ['hectares', 'name'],
      filterable: ['segment'],
    },
    useApi: {
      uri: 'farms',
      routes: ['index', 'show'],
    },
  },

  hasMany: ['Field', 'Drone', 'Mission'],

  attributes: {
    name: {
      required: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(2).max(160) },
      factory: faker => `${faker.person.lastName()} Farm`,
    },

    slug: {
      required: true,
      unique: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => faker.lorem.slug(),
    },

    region: {
      required: false,
      order: 3,
      fillable: true,
      validation: { rule: schema.string().max(120) },
      factory: faker => faker.location.state(),
    },

    /** Which use case this holding is set up as. */
    segment: {
      required: false,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: () => 'arable',
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

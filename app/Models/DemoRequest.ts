import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/**
 * A booking enquiry from the site. The only model here that takes writes from
 * the public internet, so everything it accepts is validated and nothing about
 * the record is exposed back through the API.
 */
export default defineModel({
  name: 'DemoRequest',
  table: 'demo_requests',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useUuid: true,
    useTimestamps: true,
    observe: true,
    useSearch: {
      displayable: ['id', 'name', 'email', 'farm_name', 'status'],
      searchable: ['name', 'email', 'farm_name', 'message'],
      sortable: ['created_at'],
      filterable: ['status', 'segment'],
    },
  },

  attributes: {
    name: {
      required: true,
      order: 1,
      fillable: true,
      validation: {
        rule: schema.string().min(2).max(160),
        message: { min: 'Please give us a name we can use' },
      },
      factory: faker => faker.person.fullName(),
    },

    email: {
      required: true,
      order: 2,
      fillable: true,
      validation: {
        rule: schema.string().email().max(255),
        message: { email: 'That email address does not look right' },
      },
      factory: faker => faker.internet.email(),
    },

    farm_name: {
      required: false,
      order: 3,
      fillable: true,
      validation: { rule: schema.string().max(200) },
      factory: faker => `${faker.person.lastName()} Farm`,
    },

    /** Which use case they identify with, so the reply is not generic. */
    segment: {
      required: false,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: () => 'winter-wheat',
    },

    hectares: {
      required: false,
      order: 5,
      fillable: true,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 10, max: 2000 }),
    },

    message: {
      required: false,
      order: 6,
      fillable: true,
      validation: { rule: schema.string().max(2000) },
      factory: faker => faker.lorem.sentences(2),
    },

    status: {
      required: false,
      order: 7,
      fillable: true,
      default: 'new',
      validation: { rule: schema.enum(['new', 'contacted', 'scheduled', 'closed']) },
      factory: () => 'new',
    },

    /** Which page the enquiry came from, so the follow-up has context. */
    source: {
      required: false,
      order: 8,
      fillable: true,
      validation: { rule: schema.string().max(160) },
      factory: () => 'home',
    },
  },
})

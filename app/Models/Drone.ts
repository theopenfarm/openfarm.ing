import { defineModel } from '@stacksjs/orm'
import { schema } from '@stacksjs/validation'

/** An aircraft in the fleet, and the dock it returns to. */
export default defineModel({
  name: 'Drone',
  table: 'drones',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useSeeder: { count: 5 },
    useUuid: true,
    useTimestamps: true,
    useApi: {
      uri: 'drones',
      routes: ['index', 'show'],
    },
  },

  belongsTo: ['Farm'],
  hasMany: ['Mission'],

  attributes: {
    callsign: {
      required: true,
      unique: true,
      order: 1,
      fillable: true,
      validation: { rule: schema.string().min(2).max(40) },
      factory: faker => `OF-${faker.string.alphanumeric(4).toUpperCase()}`,
    },

    model: {
      required: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().max(80) },
      factory: () => 'Scout',
    },

    /** The sensor payload fitted, which decides what it can be tasked with. */
    payload: {
      required: true,
      order: 3,
      fillable: true,
      validation: {
        rule: schema.enum(['rgb', 'multispectral', 'thermal', 'lidar', 'hopper']),
        message: { enum: 'Payload must be rgb, multispectral, thermal, lidar or hopper' },
      },
      factory: () => 'multispectral',
    },

    status: {
      required: false,
      order: 4,
      fillable: true,
      default: 'docked',
      validation: { rule: schema.enum(['docked', 'in_flight', 'charging', 'maintenance', 'offline']) },
      factory: () => 'docked',
    },

    /** The dock this aircraft belongs to. */
    station: {
      required: false,
      order: 5,
      fillable: true,
      validation: { rule: schema.string().max(120) },
      factory: faker => `${faker.location.city()} dock`,
    },

    battery_percent: {
      required: false,
      order: 6,
      fillable: true,
      default: 100,
      validation: { rule: schema.number().min(0).max(100) },
      factory: faker => faker.number.int({ min: 20, max: 100 }),
    },

    flight_hours: {
      required: false,
      order: 7,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 0, max: 900 }),
    },
  },
})

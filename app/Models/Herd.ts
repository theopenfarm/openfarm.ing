import { defineModel } from '@stacksjs/orm'
import * as seed from '../Support/factories'
import { schema } from '@stacksjs/validation'

/**
 * A mob of animals, and the block it is standing on.
 *
 * A mob rather than a block, because a block holds different mobs across a
 * season and a herding move is of a mob. `field_id` is where it is *now*: a
 * completed move rewrites it, which is what makes "which block are the
 * in-calf heifers on" a single read rather than a walk back through the move
 * log.
 *
 * `expected_head` against `head_count` is the reading the livestock patrol
 * already produces (`livestock-and-fences`), stored here so a herding move can
 * be checked against it: a mob that arrives two short did not finish moving.
 */
export default defineModel({
  name: 'Herd',
  table: 'herds',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useSeeder: { count: 6 },
    useUuid: true,
    useTimestamps: true,
    useSoftDeletes: true,
    observe: true,
    useApi: {
      uri: 'herds',
      routes: ['index', 'show', 'store', 'update', 'destroy'],
      // A holding's operating data, never public.
      middleware: ['auth', 'farm-scope'],
    },
  },

  belongsTo: ['Farm', 'Field'],
  hasMany: ['HerdMove'],

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
    /** The holding the mob belongs to. */
    farm_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The block it is standing on now. A completed move rewrites this. */
    field_id: {
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
      validation: { rule: schema.string().min(1).max(160) },
      factory: faker => seed.herdName(faker),
    },

    slug: {
      required: true,
      unique: true,
      order: 2,
      fillable: true,
      validation: { rule: schema.string().min(2).max(80) },
      factory: faker => seed.herdSlug(faker),
    },

    species: {
      required: true,
      order: 3,
      fillable: true,
      default: 'cattle',
      validation: {
        rule: schema.enum(['cattle', 'sheep', 'goats', 'horses']),
        message: { enum: 'Species must be cattle, sheep, goats or horses' },
      },
      factory: faker => seed.herdSpecies(faker),
    },

    /**
     * What the mob is, in the stockman's words: "ewes with lambs", "weaned
     * calves", "in-calf heifers".
     *
     * Free text rather than an enum because it varies by country, by species
     * and by farm, and because nothing branches on it. What the herding
     * controller actually reads is `pressure_profile`.
     */
    mob_class: {
      required: false,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(120) },
      factory: () => seed.mobClass(),
    },

    head_count: {
      required: false,
      order: 5,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 18, max: 240 }),
    },

    /** What the block should hold. A patrol counts against this. */
    expected_head: {
      required: false,
      order: 6,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: () => null,
    },

    /**
     * How close a drone may work this mob, and how hard it may push.
     *
     * This is the one attribute the herding controller branches on, so it is
     * an enum rather than prose. `shy` is not a nicety: ewes with lambs at
     * foot split under pressure that a mob of dry cows would walk away from,
     * and a split mob is the failure this whole capability has to avoid.
     * `app/Support/herding/envelope.ts` turns it into the actual limits.
     */
    pressure_profile: {
      required: false,
      order: 7,
      fillable: true,
      default: 'standard',
      validation: {
        rule: schema.enum(['calm', 'standard', 'shy']),
        message: { enum: 'Pressure profile must be calm, standard or shy' },
      },
      factory: () => 'standard',
    },

    status: {
      required: false,
      order: 8,
      fillable: true,
      default: 'grazing',
      validation: { rule: schema.enum(['grazing', 'moving', 'housed', 'archived']) },
      factory: () => 'grazing',
    },

    notes: {
      required: false,
      order: 9,
      fillable: true,
      validation: { rule: schema.string().max(500) },
      factory: () => '',
    },
  },
})

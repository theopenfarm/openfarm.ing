import { defineModel } from '@stacksjs/orm'
import * as seed from '../Support/factories'
import { schema } from '@stacksjs/validation'

/**
 * One automated herding move: the work, the authorisation and the audit
 * record, in one row.
 *
 * Every other capability in the catalog acts on ground. This one acts on live
 * animals, and that decides the shape of the row. Under §3 TierSchG an animal
 * may not be driven beyond its capacity, so the pressure a drone is allowed to
 * apply has to be bounded before the flight, recorded during it, and
 * answerable afterwards. Three groups of columns do that:
 *
 *  - the **envelope** (`min_standoff_m` and the three beside it) is what the
 *    move was authorised under. It is copied onto the row at authorisation
 *    rather than read from config at flight time, so a later settings change
 *    cannot rewrite what somebody agreed to.
 *  - the **outcome** (`peak_mob_speed_ms` and the three beside it) is what
 *    actually happened, against that envelope.
 *  - `authorised_by` / `authorised_at` / `expires_at` name the person and the
 *    window. A move nobody authorised does not fly.
 *
 * `status` is a state machine, not a label:
 *
 *   planned -> authorised -> flying -> complete
 *      |            |          |
 *      |            +-> expired (window passed unstarted)
 *      +-> rejected           +-> aborted (envelope breached, or a person
 *                                          pressed stop)
 *
 * `app/Support/herding/state.ts` is the only place that transition table
 * lives, so an endpoint cannot invent a fifth way into `flying`.
 */
export default defineModel({
  name: 'HerdMove',
  table: 'herd_moves',
  primaryKey: 'id',
  autoIncrement: true,

  traits: {
    useSeeder: { count: 14 },
    useUuid: true,
    useTimestamps: true,
    // Worth an event on every change: planning, authorising and aborting a
    // move are each something an operator elsewhere needs to hear about.
    observe: true,
    useApi: {
      uri: 'herd-moves',
      // No `destroy`. A move that happened is the welfare record of a drone
      // pushing somebody's animals around; it is answerable to a regulator,
      // and an endpoint that erases it is a liability rather than a feature.
      // A move that should not have been planned is `rejected`.
      routes: ['index', 'show', 'store', 'update'],
      middleware: ['auth', 'farm-scope'],
    },
  },

  belongsTo: [
    'Farm',
    'Herd',
    'Mission',
    /*
     * Two relations to `Field`, which is why each names its own column.
     *
     * A bare `'Field'` twice would put both on `field_id`, and the second would
     * shadow the first. Naming the key is what separates them, and honouring
     * that name is the stacksjs/stacks fix `fix(orm): honour a declared
     * foreignKey on belongsTo` - before it, the schema got these two columns
     * and the ORM went looking for `field_id`, which no migration had created.
     *
     * There is no `relationName` here, and it is not an oversight: the
     * framework's `BelongsToEntry` admits `model`, `foreignKey` and `onDelete`
     * and nothing else, so the two relations cannot yet be given distinct
     * accessor names. It costs nothing today because every read of these goes
     * through `app/Support/herding/moves.ts`, which looks both blocks up by id
     * rather than through the relation. Worth revisiting if `BelongsToEntry`
     * grows a name.
     */
    { model: 'Field', foreignKey: 'from_field_id' },
    { model: 'Field', foreignKey: 'to_field_id' },
  ],

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
    /** Denormalised from the herd, so a holding's moves are one query. */
    farm_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The mob being moved. */
    herd_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The flight that executed it. Empty until one is dispatched. */
    mission_id: {
      required: false,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The block the mob starts on. */
    from_field_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /** The block it is being moved to. */
    to_field_id: {
      required: true,
      order: 0,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /**
     * Why this move was raised.
     *
     * `rotation` is the nightly job doing its job. `fence_breach` and `hazard`
     * are raised off a detection and are the ones somebody needs to see now,
     * so the dashboard sorts on this before it sorts on time.
     */
    reason: {
      required: true,
      order: 1,
      fillable: true,
      default: 'rotation',
      validation: {
        rule: schema.enum(['rotation', 'gather', 'hazard', 'fence_breach', 'weather', 'manual']),
        message: { enum: 'Reason must be rotation, gather, hazard, fence_breach, weather or manual' },
      },
      factory: () => 'rotation',
    },

    status: {
      required: false,
      order: 2,
      fillable: true,
      default: 'planned',
      validation: {
        rule: schema.enum(['planned', 'authorised', 'flying', 'complete', 'aborted', 'expired', 'rejected']),
      },
      factory: () => 'complete',
    },

    /**
     * The path the mob is pushed along, in the field's own normalised space.
     *
     * `{ points: [[x, y], ...], width: number }`, 0..1 on each axis, the same
     * space the boundary and the detections already use, so the playground,
     * the map and the API all draw the same line without a projection.
     */
    corridor: {
      required: false,
      order: 3,
      fillable: true,
      validation: { rule: schema.string().max(8000) },
      factory: () => '',
    },

    /**
     * Ground the mob must never be pushed toward: a road, a watercourse, a
     * ditch, a bog. `[[[x, y], ...], ...]`, one ring per polygon.
     *
     * Stored on the move rather than looked up at flight time for the same
     * reason the envelope is: this is the hazard picture the move was
     * authorised against.
     */
    exclusions: {
      required: false,
      order: 4,
      fillable: true,
      validation: { rule: schema.string().max(20000) },
      factory: () => '[]',
    },

    /*
     * The welfare envelope, frozen at authorisation.
     */

    /** How close the aircraft may come to the nearest animal. */
    min_standoff_m: {
      required: false,
      order: 5,
      fillable: true,
      default: 25,
      validation: { rule: schema.number().min(0) },
      factory: () => 25,
    },

    /** Above this the mob is running, not walking, and the drone backs off. */
    max_mob_speed_ms: {
      required: false,
      order: 6,
      fillable: true,
      default: 1.6,
      validation: { rule: schema.number().min(0) },
      factory: () => 1.6,
    },

    /** A drive longer than this is stopped, finished or not. */
    max_drive_minutes: {
      required: false,
      order: 7,
      fillable: true,
      default: 20,
      validation: { rule: schema.number().min(0) },
      factory: () => 20,
    },

    /** How long the mob is left alone before it may be driven again. */
    rest_after_minutes: {
      required: false,
      order: 8,
      fillable: true,
      default: 120,
      validation: { rule: schema.number().min(0) },
      factory: () => 120,
    },

    /*
     * What actually happened, against the envelope above.
     */

    peak_mob_speed_ms: {
      required: false,
      order: 9,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.float({ min: 0.4, max: 1.5 }),
    },

    drive_minutes: {
      required: false,
      order: 10,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 4, max: 18 }),
    },

    /** The closest the aircraft came to an animal. Checked against standoff. */
    closest_approach_m: {
      required: false,
      order: 11,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 26, max: 60 }),
    },

    /** Set when status is `aborted`, and says which limit stopped it. */
    abort_reason: {
      required: false,
      order: 12,
      fillable: true,
      validation: { rule: schema.string().max(300) },
      factory: () => '',
    },

    head_before: {
      required: false,
      order: 13,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: faker => faker.number.int({ min: 18, max: 240 }),
    },

    head_after: {
      required: false,
      order: 14,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: () => null,
    },

    /**
     * Animals that did not come with the mob.
     *
     * The number that decides whether a move counts as finished. A mob that
     * arrives two short means two animals are still on the old block, and
     * somebody has to go and look at them.
     */
    head_stragglers: {
      required: false,
      order: 15,
      fillable: true,
      default: 0,
      validation: { rule: schema.number().min(0) },
      factory: () => 0,
    },

    /** The account that authorised it. Nothing flies without one. */
    authorised_by: {
      required: false,
      order: 16,
      fillable: true,
      validation: { rule: schema.number() },
      factory: () => null,
    },

    /*
     * The four moments below are strings, not `schema.date()`.
     *
     * Each holds a moment rather than a day, and these are written as
     * `new Date().toISOString()`. `schema.date()` takes a `Date` or a
     * date-only `YYYY-MM-DD` string and rejects every datetime string, and a
     * `Date` cannot be bound to SQLite, so no value satisfies both it and the
     * driver. Same reasoning as `missions.flown_at`.
     */
    authorised_at: {
      required: false,
      order: 17,
      fillable: true,
      validation: { rule: schema.string().max(40) },
      factory: () => null,
    },

    /**
     * When the authorisation lapses.
     *
     * An authorised move that has not started by this point becomes `expired`
     * rather than flying. Somebody agreed to a drone working their stock at
     * seven this morning; that is not consent to it happening at dusk.
     */
    expires_at: {
      required: false,
      order: 18,
      fillable: true,
      validation: { rule: schema.string().max(40) },
      factory: () => null,
    },

    started_at: {
      required: false,
      order: 19,
      fillable: true,
      validation: { rule: schema.string().max(40) },
      factory: faker => seed.flownOn(faker),
    },

    completed_at: {
      required: false,
      order: 20,
      fillable: true,
      validation: { rule: schema.string().max(40) },
      factory: () => null,
    },

    /** One line for the move log. */
    summary: {
      required: false,
      order: 21,
      fillable: true,
      validation: { rule: schema.string().max(600) },
      factory: faker => seed.herdMoveNote(faker),
    },
  },
})

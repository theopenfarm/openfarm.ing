import type { CLI } from '@stacksjs/types'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'
import Farm from '../Models/Farm'

/**
 * `buddy demo:account` — give the demo login a farm to look at.
 *
 * The seeded holdings come out of `buddy seed`, which fills them from the
 * per-attribute factories. What it deliberately does not do is decide who
 * owns them: `Farm.user_id` seeds as null, because a seeder that points a
 * holding at a random existing account would, on a real database, hand a
 * farmer somebody else's invented fields.
 *
 * So ownership is assigned here, on purpose and by name. The demonstration
 * farm published by `catalog:sync` is left alone: it has no owner so that it
 * shows up on no dashboard, and it is the worked example behind the public
 * field report.
 *
 * The usual sequence on a fresh machine:
 *
 *   buddy migrate
 *   buddy seed
 *   buddy catalog:sync
 *   buddy user:add demo@openfarm.ing --password '…'
 *   buddy demo:account demo@openfarm.ing
 */

/** The published demonstration farm, which must stay unowned. */
const DEMO_FARM_SLUG = 'hofgut-lindenbach'

export default function (cli: CLI) {
  cli
    .command('demo:account [email]', 'Attach the seeded holdings to the demo login')
    .option('--all', 'Attach every unowned seeded farm, not just the busiest', { default: false })
    .option('--detach', 'Hand the holdings back and leave the account with nothing', { default: false })
    .example('buddy demo:account demo@openfarm.ing')
    .example('buddy demo:account demo@openfarm.ing --all')
    .action(async (email?: string, options?: { all?: boolean, detach?: boolean }) => {
      const address = String(email || 'demo@openfarm.ing').trim().toLowerCase()

      // The framework's User model: this app does not override it, so it
      // comes from the ORM package rather than from app/Models.
      const { User } = await import('@stacksjs/orm') as any

      const account = await User.where('email', address).first()

      if (!account?.id) {
        log.error(`No account for ${address}. Create it first: buddy user:add ${address} --password '…'`)
        await log.flush()
        process.exit(ExitCode.FatalError)
      }

      const userId = Number(account.id)

      // Start from a clean slate so re-running does not accumulate holdings,
      // and so --detach is just this step on its own.
      const held = await Farm.where('user_id', userId).get() as any[]
      for (const farm of held)
        await Farm.where('id', Number(farm.id)).update({ user_id: null } as any)

      if (options?.detach) {
        log.success(`${address} now holds nothing (${held.length} released)`)
        await log.flush()
        process.exit(ExitCode.Success)
      }

      const farms = await Farm.orderBy('id').get() as any[]
      const candidates = farms.filter((farm: any) =>
        farm.user_id == null && String(farm.slug) !== DEMO_FARM_SLUG,
      )

      if (candidates.length === 0) {
        log.error('No unowned seeded farms to attach. Run `buddy seed` first.')
        await log.flush()
        process.exit(ExitCode.FatalError)
      }

      // Busiest first: the point of the demo login is a dashboard with
      // something on it, and an empty holding makes the product look empty.
      const { default: Mission } = await import('../Models/Mission')
      const flights = await Mission.orderBy('id').get() as any[]
      const flightsByFarm = new Map<number, number>()
      for (const flight of flights) {
        const id = Number((flight as any).farm_id)
        flightsByFarm.set(id, (flightsByFarm.get(id) ?? 0) + 1)
      }

      const ranked = [...candidates].sort((a: any, b: any) =>
        (flightsByFarm.get(Number(b.id)) ?? 0) - (flightsByFarm.get(Number(a.id)) ?? 0),
      )

      const chosen = options?.all ? ranked : ranked.slice(0, 1)

      for (const farm of chosen)
        await Farm.where('id', Number((farm as any).id)).update({ user_id: userId } as any)

      for (const farm of chosen)
        log.success(`${address} now holds ${(farm as any).name} (${flightsByFarm.get(Number((farm as any).id)) ?? 0} flights)`)

      await log.flush()
      process.exit(ExitCode.Success)
    })
}

import type { CLI } from '@stacksjs/types'
import process from 'node:process'
import { ExitCode } from '@stacksjs/types'
import { envelopeFor } from '../Support/herding/envelope'
import { scenario, scenarios } from '../Support/herding/scenarios'
import { run } from '../Support/herding/sim'

/**
 * `buddy herding:sim`
 *
 * Runs the herding controller against the modelled paddocks and prints what it
 * did, without a browser, a database or an aircraft.
 *
 * The same worlds the playground page draws and the same ones
 * `tests/unit/herding-sim.test.ts` asserts on, which is the point: a figure
 * quoted on the site, a figure in the test suite and a figure printed here are
 * the same figure by construction. Somebody changing a tuning constant can see
 * every scenario move in one command, before the change reaches a page.
 */

interface HerdingSimOptions {
  scenario?: string
  ticks?: number
  json?: boolean
}

/** Right-align a number under a fixed-width heading. */
function pad(value: string | number, width: number): string {
  return String(value).padStart(width)
}

function summary(slug: string, maxTicks: number): string {
  const world = scenario(slug)!
  const envelope = envelopeFor(world.profile)
  const outcome = run(world, maxTicks)

  return [
    slug.padEnd(13),
    outcome.status.padEnd(8),
    pad(`${(outcome.driveMinutes).toFixed(1)}m`, 6),
    pad(`${outcome.arrived}/${world.head}`, 8),
    pad(outcome.stragglers, 6),
    pad(outcome.peakMobSpeedMs.toFixed(2), 7),
    pad(`${envelope.maxMobSpeedMs}`, 6),
    pad(`${outcome.closestApproachM.toFixed(0)}m`, 8),
    pad(`${outcome.peakAltitudeM.toFixed(0)}m`, 6),
    pad(outcome.easeOffs, 6),
    `  ${outcome.abortKind}`,
  ].join(' ')
}

const HEAD = [
  'scenario'.padEnd(13),
  'result'.padEnd(8),
  pad('time', 6),
  pad('arrived', 8),
  pad('left', 6),
  pad('peak', 7),
  pad('limit', 6),
  pad('closest', 8),
  pad('high', 6),
  pad('eased', 6),
  '  stopped by',
].join(' ')

export default function (cli: CLI) {
  cli
    .command('herding:sim', 'Run the drone herding controller against the modelled paddocks')
    .option('--scenario <slug>', 'One scenario by slug. Omit for all of them')
    .option('--ticks <n>', 'Give up after this many ticks', { default: 1800 })
    .option('--json', 'Print the raw outcome instead of a table', { default: false })
    .action((options: HerdingSimOptions) => {
      const maxTicks = Number(options.ticks ?? 1800)
      const slugs = options.scenario ? [options.scenario] : scenarios.map(world => world.slug)

      const unknown = slugs.filter(slug => !scenario(slug))
      if (unknown.length > 0) {
        console.error(`Unknown scenario: ${unknown.join(', ')}`)
        console.error(`Known: ${scenarios.map(world => world.slug).join(', ')}`)
        process.exit(ExitCode.FatalError)
      }

      if (options.json) {
        const rows = slugs.map((slug) => {
          const world = scenario(slug)!
          const outcome = run(world, maxTicks)
          // `state` carries every animal's position and is megabytes of noise
          // in a terminal; the summary beside it is the whole answer.
          // eslint-disable-next-line pickier/no-unused-vars
          const { state, ...rest } = outcome
          return { slug, head: world.head, profile: world.profile, ...rest }
        })

        console.log(JSON.stringify(rows, null, 2))
        process.exit(ExitCode.Success)
      }

      console.log('')
      console.log(HEAD)
      console.log('-'.repeat(HEAD.length))

      for (const slug of slugs)
        console.log(summary(slug, maxTicks))

      console.log('')
      console.log('Modelled animals on modelled ground. The controller is the real one.')
      console.log('Every run is deterministic: the same seeds give the same numbers each time.')
      console.log('')

      process.exit(ExitCode.Success)
    })
}

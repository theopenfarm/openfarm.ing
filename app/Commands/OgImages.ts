import type { CLI } from '@stacksjs/types'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'
import { generateSocialImages } from 'ts-images'

/**
 * `buddy og:generate` — build the share cards.
 *
 * Every page gets an image chosen for what the page is about rather than one
 * card for the whole site: a vineyard page shares a vineyard, the grassland
 * page shares a cut meadow. Sizes come from ts-images' `generateSocialImages`,
 * which crops each source to the aspect every network expects.
 *
 * The cards carry no text. Composing a title onto one needs a text
 * rasteriser, which ts-images does not have and which is a real piece of work
 * rather than a flag: font loading, shaping and an SVG rasteriser. The
 * per-page `og:title` and `og:description` do that job in the markup
 * meanwhile, which is what every scraper reads first anyway.
 */
const CARDS: { name: string, source: string }[] = [
  { name: 'home', source: 'public/images/photos/field-aerial.jpg' },
  { name: 'arable', source: 'public/images/photos/field-aerial.jpg' },
  { name: 'permanent', source: 'public/images/photos/vineyard-aerial.jpg' },
  { name: 'protected', source: 'public/images/photos/farm-patchwork.jpg' },
  { name: 'livestock', source: 'public/images/photos/grassland-aerial.jpg' },
  { name: 'operator', source: 'public/images/photos/drone-over-wheat.jpg' },
  { name: 'capabilities', source: 'public/images/photos/drone-over-wheat.jpg' },
  { name: 'field-report', source: 'public/images/photos/farm-patchwork.jpg' },
]

export default function (cli: CLI) {
  cli
    .command('og:generate', 'Build the social share cards into public/images/og')
    .action(async () => {
      const root = process.cwd()

      try {
        for (const card of CARDS) {
          const outDir = join(root, 'public/images/og', card.name)
          await mkdir(outDir, { recursive: true })
          // JPEG, and only the two cards that are actually consumed: the
          // default PNG output ran to 2 MB per card across five networks.
          await generateSocialImages(join(root, card.source), outDir, {
            quality: 78,
            format: 'jpeg',
            networks: ['og-facebook', 'og-twitter'],
          })
          log.info(`  ${card.name}`)
        }
      }
      catch (error) {
        log.error(`Could not build the share cards: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(ExitCode.FatalError)
      }

      log.success(`Built share cards for ${CARDS.length} page groups.`)
      process.exit(ExitCode.Success)
    })
}

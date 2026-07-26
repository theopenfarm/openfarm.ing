import type { CLI } from '@stacksjs/types'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'
import { generateSocialCard, loadFont } from 'ts-images'
import { allFeatures, allUseCases, fieldReport, useCaseSegments } from '../Support/catalog'

/**
 * `buddy og:generate` — build a share card for every page.
 *
 * One card per URL, carrying that page's own headline in the site's own
 * typeface over a photograph chosen for what the page is about: a vineyard
 * page shares a vineyard with the vineyard headline on it.
 *
 * Text is drawn by ts-images' rasteriser, which was added for this. Because
 * the cards are built from the same catalog the pages render, renaming a
 * capability updates its card on the next run, and the deploy runs this, so a
 * copy edit ships its card with it.
 */

const BRAND = 'Open Farming'
const ACCENT = { r: 226, g: 87, b: 30 }

/** Which photograph belongs to which kind of page. */
const PHOTOS: Record<string, string> = {
  arable: 'public/images/photos/field-aerial.jpg',
  permanent: 'public/images/photos/vineyard-aerial.jpg',
  protected: 'public/images/photos/farm-patchwork.jpg',
  livestock: 'public/images/photos/grassland-aerial.jpg',
  operator: 'public/images/photos/drone-over-wheat.jpg',
  capabilities: 'public/images/photos/drone-over-wheat.jpg',
  home: 'public/images/photos/field-aerial.jpg',
  report: 'public/images/photos/farm-patchwork.jpg',
}

/** Which photograph suits a capability, by what the capability does. */
const FEATURE_PHOTO: Record<string, string> = {
  detect: 'capabilities',
  act: 'arable',
  operate: 'operator',
}

const CATEGORY_LABEL: Record<string, string> = {
  detect: 'Detect',
  act: 'Act',
  operate: 'Operate',
}

interface Card {
  /** Path under public/images/og, without an extension. */
  slug: string
  title: string
  eyebrow?: string
  subtitle?: string
  photo: string
}

export default function (cli: CLI) {
  cli
    .command('og:generate', 'Build a share card for every page into public/images/og')
    .action(async () => {
      const root = process.cwd()

      try {
        const [titleFont, bodyFont] = await Promise.all([
          readFile(join(root, 'public/fonts/satoshi/Satoshi-Bold.ttf')).then(bytes => loadFont(new Uint8Array(bytes))),
          readFile(join(root, 'public/fonts/satoshi/Satoshi-Medium.ttf')).then(bytes => loadFont(new Uint8Array(bytes))),
        ])

        const cards = await collectCards()

        for (const card of cards) {
          const outputPath = join(root, 'public/images/og', `${card.slug}.jpg`)
          await mkdir(dirname(outputPath), { recursive: true })

          await generateSocialCard(outputPath, {
            background: join(root, card.photo),
            brand: BRAND,
            eyebrow: card.eyebrow,
            title: card.title,
            subtitle: card.subtitle,
            titleFont,
            bodyFont,
            accent: ACCENT,
            quality: 80,
          })
        }

        log.success(`Built ${cards.length} share cards.`)
      }
      catch (error) {
        log.error(`Could not build the share cards: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(ExitCode.FatalError)
      }

      process.exit(ExitCode.Success)
    })
}

async function collectCards(): Promise<Card[]> {
  const report = await fieldReport()

  const cards: Card[] = [
    {
      slug: 'home',
      title: 'Most of your field is fine. Stop treating it like it isn\'t.',
      subtitle: 'Drone scouting and targeted treatment for farms',
      photo: PHOTOS.home!,
    },
    {
      slug: 'features',
      eyebrow: 'Capabilities',
      title: 'Every capability is the same loop, pointed at a different problem',
      subtitle: 'Eighteen jobs a drone does better than a walk',
      photo: PHOTOS.capabilities!,
    },
    {
      slug: 'use-cases',
      eyebrow: 'Use cases',
      title: 'The same platform, set up sixteen different ways',
      subtitle: 'Cereals, roots, vines, glass, grassland, contractors',
      photo: PHOTOS.arable!,
    },
    {
      slug: 'how-it-works',
      eyebrow: 'How it works',
      title: 'Four steps, and a map at the end of them',
      subtitle: 'Fly the grid, find the problem, zone it, treat the zones',
      photo: PHOTOS.capabilities!,
    },
    {
      slug: 'pricing',
      eyebrow: 'Pricing',
      title: 'Priced by the hectare, not by the aircraft',
      subtitle: 'A single field, a season calendar, or a docked fleet',
      photo: PHOTOS.operator!,
    },
    {
      slug: 'contact',
      eyebrow: 'Book a field visit',
      title: 'Bring us one field and we will fly it',
      subtitle: 'You read the report before anyone talks about a calendar',
      photo: PHOTOS.arable!,
    },
    {
      slug: 'field-report',
      eyebrow: 'Field report',
      title: 'One weed map, every number behind it',
      // The real figure from the seeded flight, so the card cannot drift from
      // the page it is advertising.
      subtitle: report
        ? `${report.treatedHectares} of ${report.hectares} hectares flagged for treatment`
        : 'The whole flight record behind the maps',
      photo: PHOTOS.report!,
    },
  ]

  for (const feature of await allFeatures()) {
    cards.push({
      slug: `features/${feature.slug}`,
      eyebrow: CATEGORY_LABEL[feature.category] ?? 'Capability',
      title: feature.name,
      subtitle: feature.tagline,
      photo: PHOTOS[FEATURE_PHOTO[feature.category] ?? 'capabilities']!,
    })
  }

  for (const useCase of await allUseCases()) {
    cards.push({
      slug: `use-cases/${useCase.slug}`,
      eyebrow: useCaseSegments[useCase.segment].label,
      title: useCase.name,
      subtitle: useCase.tagline,
      photo: PHOTOS[useCase.segment] ?? PHOTOS.arable!,
    })
  }

  return cards
}

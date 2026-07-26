import type { CLI } from '@stacksjs/types'
import { mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'
import { drawLine, fillCircle, generateSocialCard, loadFont, strokeRoundedRect } from 'ts-images'
import { allFeatures, allUseCases, fieldReport, localiseFeatures, localiseUseCases } from '../Support/catalog'

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
 *
 * One set per locale. Sharing a /de/ URL should not put an English card in a
 * German feed, so the headline, the eyebrow and the subtitle all come from
 * that locale's translations, falling back to the English where a string is
 * not translated.
 */
const LOCALES = ['en', 'de', 'nl'] as const

const BRAND = 'Open Farming'
const ACCENT = { r: 226, g: 87, b: 30 }
/** The site's ink, for the mark's outline and rule. */
const INK = { r: 16, g: 22, b: 13 }

/**
 * The mark, drawn to the same geometry as the one in the navigation.
 *
 * That mark is an SVG in `resources/partials/nav.stx`, on a 24-unit grid: a
 * rounded-square outline, two detections on it, and the flight line between
 * them. Redrawn here rather than rasterised from the file because nothing in
 * the toolchain rasterises SVG, and because the card wants it in the ink
 * colour on a light plate regardless of the visitor's theme. The unit grid is
 * shared with the SVG, so the two stay the same shape: change one, change the
 * numbers in the other.
 */
function drawMark(card: Parameters<typeof fillCircle>[0], box: { x: number, y: number, size: number }): void {
  const unit = box.size / 24
  const at = (x: number, y: number): { x: number, y: number } => ({ x: box.x + x * unit, y: box.y + y * unit })

  const frame = at(1.5, 1.5)
  strokeRoundedRect(
    card,
    { x: frame.x, y: frame.y, width: 21 * unit, height: 21 * unit, radius: 4 * unit },
    1.6 * unit,
    INK,
  )

  const from = at(4.5, 19.5)
  const to = at(19.5, 4.5)
  drawLine(card, { x1: from.x, y1: from.y, x2: to.x, y2: to.y, width: 1.1 * unit }, { ...INK, a: 0.35 })

  const first = at(8, 9)
  const second = at(15.5, 15)
  fillCircle(card, { cx: first.x, cy: first.y, radius: 2.1 * unit }, ACCENT)
  fillCircle(card, { cx: second.x, cy: second.y, radius: 1.5 * unit }, ACCENT)
}

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

/** Translations, read from the same files the stx translation pass uses. */
function translations(locale: string): Record<string, Record<string, string>> {
  // eslint-disable-next-line ts/no-require-imports
  return require(`../../resources/translations/${locale}.json`)
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

        let built = 0
        for (const locale of LOCALES) {
          const cards = await collectCards(locale)
          built += cards.length

          for (const card of cards) {
            // The English set sits at the root so its paths mirror the URLs;
            // the others are nested under their locale, exactly as the pages
            // are.
            const prefix = locale === 'en' ? '' : `${locale}/`
            const outputPath = join(root, 'public/images/og', `${prefix}${card.slug}.jpg`)
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
              drawMark,
              quality: 80,
            })
          }
        }

        log.success(`Built ${built} share cards across ${LOCALES.length} locales.`)
      }
      catch (error) {
        log.error(`Could not build the share cards: ${error instanceof Error ? error.message : String(error)}`)
        process.exit(ExitCode.FatalError)
      }

      process.exit(ExitCode.Success)
    })
}

async function collectCards(locale: string): Promise<Card[]> {
  const report = await fieldReport()
  const t = translations(locale)

  const cards: Card[] = [
    {
      slug: 'home',
      title: `${t.home!.headlineOne} ${t.home!.headlineTwo}`,
      subtitle: t.footer!.blurb!.split('.')[0]!,
      photo: PHOTOS.home!,
    },
    {
      slug: 'features',
      eyebrow: t.nav!.capabilities,
      title: t.home!.bentoTitle!,
      subtitle: t.home!.loopTitle!,
      photo: PHOTOS.capabilities!,
    },
    {
      slug: 'use-cases',
      eyebrow: t.nav!.useCases,
      title: t.home!.railTitle!,
      subtitle: t.megaMenu!.unsureBody!,
      photo: PHOTOS.arable!,
    },
    {
      slug: 'how-it-works',
      eyebrow: t.nav!.howItWorks,
      title: t.megaMenu!.flightTitle!,
      subtitle: t.home!.loopTitle!,
      photo: PHOTOS.capabilities!,
    },
    {
      slug: 'pricing',
      eyebrow: t.nav!.pricing,
      title: t.home!.closeTitle!,
      subtitle: t.subscribe!.body!,
      photo: PHOTOS.operator!,
    },
    {
      slug: 'contact',
      eyebrow: t.cta!.book,
      title: t.contact!.title!,
      subtitle: t.contact!.lede!.split('.')[0]!,
      photo: PHOTOS.arable!,
    },
    {
      slug: 'field-report',
      eyebrow: t.nav!.fieldReport,
      title: t.fieldReport!.cardTitle!,
      // The real figures from the seeded flight, interpolated into the
      // locale's sentence, so the card cannot drift from the page it
      // advertises and still reads naturally in each language.
      subtitle: report
        ? t.fieldReport!.cardSubtitle!
            .replace('{treated}', String(report.treatedHectares))
            .replace('{total}', String(report.hectares))
        : t.nav!.fieldReport!,
      photo: PHOTOS.report!,
    },
  ]

  for (const feature of localiseFeatures(await allFeatures(), locale)) {
    cards.push({
      slug: `features/${feature.slug}`,
      eyebrow: t.nav!.capabilities,
      title: feature.name,
      subtitle: feature.tagline,
      photo: PHOTOS[FEATURE_PHOTO[feature.category] ?? 'capabilities']!,
    })
  }

  for (const useCase of localiseUseCases(await allUseCases(), locale)) {
    cards.push({
      slug: `use-cases/${useCase.slug}`,
      eyebrow: t.nav!.useCases,
      title: useCase.name,
      subtitle: useCase.tagline,
      photo: PHOTOS[useCase.segment] ?? PHOTOS.arable!,
    })
  }

  return cards
}

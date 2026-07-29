import type { CLI } from '@stacksjs/types'
import { copyFile, mkdir, stat } from 'node:fs/promises'
import nodePath from 'node:path'
import process from 'node:process'
import { log } from '@stacksjs/cli'
import { ExitCode } from '@stacksjs/types'
import Field from '../Models/Field'
import Mission from '../Models/Mission'

/**
 * `buddy imagery:attach` — put a flight's stitched image behind its map.
 *
 * A mapping flight lands two things. The vectors — detections, zones, the
 * prescription — are already published by `catalog:sync`. The other is the
 * orthomosaic: every frame from the flight stitched and rectified into one
 * picture of the whole field. Attaching it is what turns the site's map from
 * a plan OF the ground into the ground, with the same detections over it.
 *
 * A command rather than an upload form because this is a publishing step, run
 * once per flight by whoever did the stitching, against a file that is not
 * the sort of thing anyone wants to push through a browser.
 *
 *   buddy imagery:attach ./lindenbach-2026-04-18.webp
 *   buddy imagery:attach https://cdn.example/ortho.webp --field lindenbach-nord
 *   buddy imagery:attach ./ortho.webp --bounds="-0.04,-0.03,1.05,1.02" --resolution 4
 *
 * `--bounds` is the image's footprint in the field's own normalised 0..1
 * space, as `minX,minY,maxX,maxY`. A stitch always covers more ground than
 * the boundary, because the aircraft overflies the edges, so the numbers are
 * normally slightly outside 0..1 — and without them the picture sits out of
 * register with every marker drawn on top of it. Omitted, it is assumed to
 * cover the field exactly.
 *
 * Note the `=`. A leading minus is the ordinary case for a footprint, and
 * `--bounds -0.04,…` would be read as a flag by any argument parser, this one
 * included, so the value has to be attached to the option.
 *
 * Serve a web-sized derivative, not the master. The map ships the image
 * inside the page, so a 400 MB GeoTIFF would be 400 MB on the wire; a few
 * thousand pixels across is more than the map can show.
 */

/** The demonstration field, which is what the public pages render. */
const DEFAULT_FIELD_SLUG = 'lindenbach-nord'

/** Where a copied-in image lands, relative to `public/`. */
const IMAGERY_DIR = 'imagery'

interface Options {
  field?: string
  bounds?: string
  resolution?: number
}

export default function (cli: CLI) {
  cli
    .command('imagery:attach [source]', "Attach a stitched orthomosaic to a field's latest flight")
    .option('--field <slug>', 'Which field, by slug', { default: DEFAULT_FIELD_SLUG })
    .option('--bounds <box>', 'Image footprint in normalised field space, as --bounds="minX,minY,maxX,maxY"')
    .option('--resolution <cm>', 'Ground sample distance of the stitch, cm per pixel')
    .example('buddy imagery:attach ./lindenbach-2026-04-18.webp')
    .example('buddy imagery:attach ./ortho.webp --bounds="-0.04,-0.03,1.05,1.02" --resolution 4')
    .action(async (source?: string, options?: Options) => {
      try {
        const result = await attach(source, options ?? {})
        log.success(`Attached ${result.url} to ${result.field} (flight ${result.mission}).`)
      }
      catch (error) {
        log.error(`Could not attach the imagery: ${error instanceof Error ? error.message : String(error)}`)
        await log.flush()
        process.exit(ExitCode.FatalError)
      }

      await log.flush()
      process.exit(ExitCode.Success)
    })
}

/**
 * Read a footprint, or fall back to the field exactly.
 *
 * Rejected rather than repaired when it is malformed: a footprint that is
 * silently corrected puts the image a few metres off, which reads as bad
 * detection data rather than a bad argument on a command line.
 */
function parseBounds(raw: string | undefined): [number, number, number, number] | null {
  if (!raw)
    return null

  const parts = raw.split(',').map(part => Number(part.trim()))

  if (parts.length !== 4 || parts.some(n => !Number.isFinite(n)))
    throw new Error(`--bounds needs four numbers, "minX,minY,maxX,maxY", not "${raw}"`)

  const [minX, minY, maxX, maxY] = parts

  if (maxX <= minX || maxY <= minY)
    throw new Error('--bounds must run from the top-left corner to the bottom-right one')

  return [minX, minY, maxX, maxY]
}

/**
 * Get the image to somewhere the site can serve it, and return that address.
 *
 * A URL is taken at its word — the stitch may well live in a bucket. A local
 * file is copied into `public/imagery/` under the field's slug, so the
 * attachment survives the working copy the file happened to be sitting in.
 */
async function publish(source: string, fieldSlug: string): Promise<string> {
  if (/^https?:\/\//.test(source) || source.startsWith('/imagery/'))
    return source

  const from = nodePath.resolve(process.cwd(), source)

  const info = await stat(from).catch(() => null)
  if (!info?.isFile())
    throw new Error(`No such file: ${from}`)

  const target = nodePath.join(process.cwd(), 'public', IMAGERY_DIR)
  await mkdir(target, { recursive: true })

  // Named for the field rather than for whatever the stitcher called it, so
  // re-attaching a corrected stitch replaces the old one instead of leaving
  // both on disk with the live map pointing at the wrong one.
  const name = `${fieldSlug}${nodePath.extname(from).toLowerCase()}`
  await copyFile(from, nodePath.join(target, name))

  return `/${IMAGERY_DIR}/${name}`
}

async function attach(source: string | undefined, options: Options): Promise<{ url: string, field: string, mission: number }> {
  if (!source)
    throw new Error('Give it an image: buddy imagery:attach ./ortho.webp')

  const slug = String(options.field || DEFAULT_FIELD_SLUG)
  const bounds = parseBounds(options.bounds)

  const field = await Field.where('slug', slug).first()
  if (!field?.id)
    throw new Error(`No field with slug "${slug}". Run \`buddy catalog:sync\` for the demonstration field.`)

  // The most recent flight, because an orthomosaic is what the last pass over
  // the field actually saw. An older flight's image would be a picture of a
  // crop that has since been sprayed, harvested or drilled again.
  const mission = await Mission.where('field_id', Number(field.id)).orderBy('flown_at', 'desc').first()
  if (!mission?.id)
    throw new Error(`No flight recorded for "${slug}" to attach an image to.`)

  const url = await publish(source, slug)

  await Mission.where('id', Number(mission.id)).update({
    orthomosaic_url: url,
    orthomosaic_bounds: bounds ? JSON.stringify(bounds) : '',
    orthomosaic_resolution_cm: options.resolution ? Number(options.resolution) : null,
  } as any)

  return { url, field: String(field.name), mission: Number(mission.id) }
}

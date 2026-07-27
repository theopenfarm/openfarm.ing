/**
 * The vocabulary the model factories seed from.
 *
 * A factory is only as useful as the data it invents. `faker.lorem.slug()` for
 * a field name and `faker.location.latitude()` for a centroid produce rows that
 * are technically valid and obviously fake: a parcel called "quia-magni-odit"
 * somewhere in the South Atlantic, planted with the same crop as every other
 * parcel. A seeded account is the first thing a prospect sees on the demo
 * login, so the seed speaks the domain: German arable regions, a real rotation,
 * coordinates inside the region they claim, and a boundary ring the field map
 * can actually draw.
 *
 * Nothing here is random-access state. Every helper takes the faker instance
 * the seeder hands the factory, so a seeded run stays reproducible.
 */

type Faker = any

/** Farms are named the way they are named on a German land register. */
const FARM_PREFIXES = ['Hofgut', 'Gut', 'Landgut', 'Hof', 'Domäne']

const PLACE_NAMES = [
  'Lindenbach', 'Ellwangen', 'Rothenfeld', 'Wiesengrund', 'Altenbrück',
  'Steinfurt', 'Moorhausen', 'Birkenau', 'Sonnenberg', 'Kirchdorf',
  'Weidenhof', 'Talheim', 'Erlensee', 'Hohenwart', 'Buchenrode',
]

/** Where the fields are, and roughly where on the map that puts them. */
const REGIONS: { name: string, lat: number, lng: number }[] = [
  { name: 'Baden-Württemberg', lat: 48.66, lng: 9.35 },
  { name: 'Bayern', lat: 48.79, lng: 11.50 },
  { name: 'Niedersachsen', lat: 52.64, lng: 9.85 },
  { name: 'Sachsen-Anhalt', lat: 51.95, lng: 11.69 },
  { name: 'Mecklenburg-Vorpommern', lat: 53.61, lng: 12.43 },
  { name: 'Rheinland-Pfalz', lat: 49.91, lng: 7.45 },
  { name: 'Nordrhein-Westfalen', lat: 51.43, lng: 7.66 },
]

/** Parcel names: what a farmer actually calls the field over the radio. */
const FIELD_NAMES = [
  'Am Bachlauf', 'Hinter der Scheune', 'Oberer Acker', 'Langer Schlag',
  'Mühlenfeld', 'Breite Wiese', 'Am Waldrand', 'Unterfeld', 'Steinacker',
  'Sonnenhang', 'Kirchweg', 'Nordkoppel', 'Sandbreite', 'Lehmgrund',
  'Am Weiher', 'Hangfeld', 'Krummer Schlag', 'Espenstück',
]

/** A plausible rotation rather than one crop repeated across the holding. */
const CROPS = [
  'winter wheat', 'winter barley', 'oilseed rape', 'sugar beet',
  'grain maize', 'silage maize', 'spring oats', 'field beans', 'rye',
]

const SEGMENTS = ['arable', 'arable', 'arable', 'mixed', 'orchard']

/** The capabilities a flight is actually booked for. */
const CAPABILITIES = [
  'plant-disease-detection',
  'weed-mapping',
  'nutrient-status',
  'crop-scouting',
  'yield-forecasting',
  'irrigation-planning',
]

const MISSION_NOTES = [
  'Rust pressure on the eastern headland, treatment map issued the same evening.',
  'Flown after the rain window; canopy dry enough for a clean multispectral pass.',
  'Two patches of blackgrass picked up along the tramlines.',
  'Nitrogen variation across the slope, prescription split into three zones.',
  'Follow-up pass to confirm the previous treatment took.',
  'Early scouting flight ahead of the first fungicide decision.',
  'Waterlogging on the northern corner, that block left out of the prescription.',
  'Clean flight, nothing above threshold. No prescription issued.',
]

function pick<T>(faker: Faker, list: T[]): T {
  // The index is always in range; the non-null assertion is for
  // noUncheckedIndexedAccess, not a claim about the data.
  return list[faker.number.int({ min: 0, max: list.length - 1 })]!
}

/**
 * Draw without replacement until the pool is exhausted.
 *
 * Names are the one thing a random draw gets visibly wrong: twelve fields
 * picked at random from eighteen names put two parcels called "Nordkoppel" on
 * the same holding, which no land register would allow and every reader
 * notices. The cursor starts at a random offset so runs still differ, then
 * walks the pool in order.
 */
const cursors = new Map<string[], number>()

function rotate(faker: Faker, list: string[]): string {
  const start = cursors.get(list) ?? faker.number.int({ min: 0, max: list.length - 1 })
  cursors.set(list, start + 1)

  return list[start % list.length]!
}

/**
 * The name this row was just given, so its slug can be built from it.
 *
 * A slug factory that calls `farmName()` again would name the row one thing
 * and address it as another - and, because each call advances the rotation,
 * would burn through the pool twice as fast and start repeating names. The
 * seeder builds one record at a time in declaration order, so `slug` reads
 * back what `name` produced a moment earlier.
 */
let lastFarmName = ''
let lastFieldName = ''

function slugify(value: string, faker: Faker): string {
  const stem = value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Sliced rather than trusting the length argument: the bundled faker ignores
  // it and hands back ten characters, which makes for a scruffy URL.
  return `${stem}-${faker.string.alphanumeric(4).toLowerCase().slice(0, 4)}`
}

export function farmName(faker: Faker): string {
  lastFarmName = `${pick(faker, FARM_PREFIXES)} ${rotate(faker, PLACE_NAMES)}`
  return lastFarmName
}

export function farmSlug(faker: Faker): string {
  return slugify(lastFarmName || farmName(faker), faker)
}

export function fieldSlug(faker: Faker): string {
  return slugify(lastFieldName || fieldName(faker), faker)
}

export function region(faker: Faker): string {
  return pick(faker, REGIONS).name
}

export function segment(faker: Faker): string {
  return pick(faker, SEGMENTS)
}

export function fieldName(faker: Faker): string {
  lastFieldName = rotate(faker, FIELD_NAMES)
  return lastFieldName
}

export function crop(faker: Faker): string {
  return pick(faker, CROPS)
}

export function capability(faker: Faker): string {
  return pick(faker, CAPABILITIES)
}

export function missionNote(faker: Faker): string {
  return pick(faker, MISSION_NOTES)
}

/**
 * A centroid inside one of the regions above rather than anywhere on earth.
 * The jitter is roughly a 30 km box, so the fields of one seeded farm sit near
 * each other the way real parcels do.
 */
export function latitude(faker: Faker): number {
  const home = pick(faker, REGIONS)
  return Number((home.lat + faker.number.float({ min: -0.15, max: 0.15 })).toFixed(5))
}

export function longitude(faker: Faker): number {
  const home = pick(faker, REGIONS)
  return Number((home.lng + faker.number.float({ min: -0.2, max: 0.2 })).toFixed(5))
}

/**
 * A closed ring in the 0..1 field space the map draws in.
 *
 * Built as an irregular polygon around the centre rather than a rectangle:
 * a field with four right angles reads as a placeholder immediately, and the
 * renderer clips its zones to this path, so the shape is what gives the
 * picture its character.
 */
export function boundary(faker: Faker): string {
  const points = faker.number.int({ min: 6, max: 9 })
  const ring: [number, number][] = []

  for (let i = 0; i < points; i++) {
    const angle = (i / points) * Math.PI * 2
    const radius = faker.number.float({ min: 0.32, max: 0.46 })

    ring.push([
      Number((0.5 + Math.cos(angle) * radius).toFixed(4)),
      Number((0.5 + Math.sin(angle) * radius * 0.78).toFixed(4)),
    ])
  }

  return JSON.stringify(ring)
}

/**
 * What the model found, as a set rather than three independent draws.
 *
 * A detection's kind, label and severity have to agree: `kind: 'weed'` with
 * the label "yellow rust" is not a plausible row, it is three factories that
 * never met. The seeder builds one record at a time and walks the attributes
 * in declaration order, so `kind` picks the finding and `label` and `severity`
 * read back the one just picked.
 */
interface Finding {
  kind: string
  label: string
  severity: string
}

const FINDINGS: Finding[] = [
  { kind: 'weed', label: 'Blackgrass', severity: 'high' },
  { kind: 'weed', label: 'Cleavers', severity: 'medium' },
  { kind: 'weed', label: 'Charlock', severity: 'low' },
  { kind: 'disease', label: 'Yellow rust', severity: 'high' },
  { kind: 'disease', label: 'Septoria tritici', severity: 'medium' },
  { kind: 'disease', label: 'Powdery mildew', severity: 'low' },
  { kind: 'pest', label: 'Cabbage stem flea beetle', severity: 'medium' },
  { kind: 'pest', label: 'Aphid colony', severity: 'low' },
  { kind: 'nutrient', label: 'Nitrogen deficiency', severity: 'medium' },
  { kind: 'nutrient', label: 'Magnesium deficiency', severity: 'low' },
  { kind: 'moisture', label: 'Waterlogging', severity: 'high' },
  { kind: 'compaction', label: 'Headland compaction', severity: 'medium' },
  { kind: 'gap', label: 'Establishment gap', severity: 'low' },
  { kind: 'wildlife', label: 'Deer browsing', severity: 'low' },
]

let current: Finding = FINDINGS[0]!

export function findingKind(faker: Faker): string {
  current = pick(faker, FINDINGS)
  return current.kind
}

export function findingLabel(): string {
  return current.label
}

export function findingSeverity(): string {
  return current.severity
}

/** A flight date spread across the season, not all inside the last week. */
export function flownOn(faker: Faker): string {
  // Date objects, not ISO strings: older faker builds call `.getTime()` on the
  // bound directly, and the resulting throw is caught by the seeder and turned
  // into a null column rather than an error anyone sees.
  const from = new Date('2026-03-01T06:00:00.000Z')
  const to = new Date('2026-07-20T18:00:00.000Z')

  return faker.date.between({ from, to }).toISOString()
}

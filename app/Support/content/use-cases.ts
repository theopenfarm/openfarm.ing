/**
 * Use cases: the same platform seen from the seat of one kind of operation.
 *
 * A use case is deliberately NOT a feature list. It answers three questions a
 * grower asks before anything else: what goes wrong on this crop, what the
 * flight calendar looks like across a season, and which capabilities carry
 * the weight. The feature slugs listed here are validated against
 * `features.ts` by the seeder, so a rename cannot silently break the links.
 */

export type UseCaseSegment = 'arable' | 'permanent' | 'protected' | 'livestock' | 'operator'

export interface SeasonStage {
  /** Growth stage or calendar window, in the grower's language. */
  window: string
  /** What the flights are looking for in that window. */
  focus: string
}

export interface UseCaseContent {
  slug: string
  name: string
  segment: UseCaseSegment
  /** One line for menus and cards. */
  tagline: string
  /** Under 25 words. */
  summary: string
  /** What actually goes wrong on this crop or operation. */
  challenge: string
  /** How the platform is normally set up for it. */
  approach: string
  /** The flight calendar across a season. */
  season: SeasonStage[]
  /** Feature slugs, most load bearing first. */
  features: string[]
  /** What the operation gets out of it, stated as measurements. */
  outcomes: string[]
  /** Typical field or block size this is set up for. */
  scale: string
  order: number
}

export const useCases: UseCaseContent[] = [
  {
    slug: 'winter-wheat',
    name: 'Winter wheat and barley',
    segment: 'arable',
    order: 1,
    tagline: 'The long season, flown in stages',
    summary: 'Establishment gaps, patchy weed pressure, septoria risk and a nitrogen plan that has to follow the field, not a flat rate.',
    challenge:
      'A cereal crop is in the ground for the better part of a year and every problem in it is patchy. Blackgrass concentrates along the tramlines and headlands. Septoria starts in the thickest, wettest part of the canopy. The nitrogen plan gets split three ways and applied flat because there is no map that says otherwise. Each of those is a decision made blind, repeated across every field on the farm.',
    approach:
      'A base map at establishment, then a fortnightly multispectral cadence through the stem extension and flag leaf windows, tightening when the weather turns favourable for septoria. Weed scans land before each herbicide window and produce a prescription your sprayer can load. Nitrogen splits are prescribed from measured biomass rather than a target applied evenly.',
    season: [
      { window: 'Post drilling', focus: 'Establishment counts, gap mapping and a corrected boundary for the field record.' },
      { window: 'Tillering', focus: 'Weed mapping before the autumn or spring herbicide window.' },
      { window: 'Stem extension', focus: 'Biomass and chlorophyll for the first and second nitrogen split.' },
      { window: 'Flag leaf to ear', focus: 'Disease surveillance on a tight cadence, plus ear counts for the yield estimate.' },
      { window: 'Pre harvest', focus: 'Yield forecast update, lodging map and harvest sequencing.' },
    ],
    features: ['plant-disease-detection', 'precision-fertilisation', 'targeted-weed-control', 'yield-forecasting', 'soil-compaction', 'field-mapping'],
    outcomes: [
      'Treated area recorded against total area for every herbicide pass',
      'Nitrogen prescribed per zone with the measured shortfall behind it',
      'Disease flags dated and located, days before a cab-level diagnosis',
      'A yield estimate that narrows through grain fill instead of arriving at harvest',
    ],
    scale: 'Blocks of 10 to 120 hectares, flown as one route.',
  },
  {
    slug: 'maize',
    name: 'Maize',
    segment: 'arable',
    order: 2,
    tagline: 'Early weeks decide it, and birds finish it',
    summary: 'Establishment counts, early weed competition, corn borer pressure and flocks working the cobs at ripening.',
    challenge:
      'Maize forgives nothing in the first six weeks. A gappy stand cannot be fixed later, and weeds that get away before the canopy closes take yield directly. Then at the other end of the season, once the cobs are filling, flocks move in and a fixed deterrent stops working after a fortnight. Between those two ends the crop is too tall to walk into and too dense to see through.',
    approach:
      'A counting flight at the three to five leaf stage sets the establishment number and finds the gaps. Weed scans run before the post-emergence window and produce a spot-spray prescription. Once the crop is over head height, flights are the only practical way to see inside the block, so pest surveillance runs on a fixed cadence. At ripening, camera triggered deterrence responds to flocks rather than running on a timer.',
    season: [
      { window: 'Three to five leaves', focus: 'Plant counts per square metre and the gap map.' },
      { window: 'Pre canopy closure', focus: 'Weed mapping for the post-emergence spot-spray prescription.' },
      { window: 'Stem extension to tasselling', focus: 'Nitrogen top-up zoning and pest surveillance from above.' },
      { window: 'Grain fill', focus: 'Bird pressure monitoring and on-demand deterrence.' },
      { window: 'Pre harvest', focus: 'Yield estimate and lodging assessment for the chopping order.' },
    ],
    features: ['targeted-weed-control', 'yield-forecasting', 'pest-monitoring', 'bird-deterrence', 'precision-fertilisation', 'autonomous-network'],
    outcomes: [
      'Establishment counted rather than estimated from a pacing walk',
      'Weed treatment confined to mapped zones before canopy closure',
      'Pest and bird pressure logged by block and hour across the season',
      'Chopping order set from measured yield, not from the gate view',
    ],
    scale: 'Blocks of 5 to 80 hectares, with deterrence stations on the blocks under pressure.',
  },
  {
    slug: 'oilseed-rape',
    name: 'Oilseed rape',
    segment: 'arable',
    order: 3,
    tagline: 'Uneven from the day it goes in',
    summary: 'Patchy establishment, flea beetle damage, and a canopy that needs measuring before the nitrogen decision is worth anything.',
    challenge:
      'Rape establishes unevenly and then the gaps get worse. Flea beetle damage is concentrated and easy to miss until the affected patch has thinned out entirely. Canopy size drives the whole nitrogen decision, and a canopy that varies threefold across a field makes a flat rate close to meaningless. Deciding whether to keep or redrill a struggling field is one of the more expensive calls of the year, and it is usually made from the gateway.',
    approach:
      'Two establishment flights turn keep-or-redrill into a decision with an area behind it. Pest surveillance through the autumn tracks damage patches as they grow or stall. Canopy measurement before the spring nitrogen produces the zoning, with the green area index measured rather than guessed.',
    season: [
      { window: 'Post emergence', focus: 'Establishment counts and the keep-or-redrill area calculation.' },
      { window: 'Autumn', focus: 'Flea beetle damage tracking, patch by patch.' },
      { window: 'Late winter', focus: 'Canopy measurement for the spring nitrogen zoning.' },
      { window: 'Flowering', focus: 'Uniformity check and disease surveillance through the risk window.' },
      { window: 'Pod fill', focus: 'Yield estimate and desiccation timing by zone.' },
    ],
    features: ['pest-monitoring', 'precision-fertilisation', 'plant-disease-detection', 'yield-forecasting', 'field-assistant'],
    outcomes: [
      'Keep-or-redrill decided from a measured established area',
      'Damage patches tracked across flights instead of found once',
      'Spring nitrogen zoned to the measured canopy',
      'Desiccation timed by zone rather than by field',
    ],
    scale: 'Blocks of 10 to 100 hectares.',
  },
  {
    slug: 'sugar-beet',
    name: 'Sugar beet',
    segment: 'arable',
    order: 4,
    tagline: 'Where spot spraying pays first',
    summary: 'Wide rows and slow early growth make beet the crop where weed mapping and spot treatment save the most.',
    challenge:
      'Beet sits in wide rows and grows slowly at first, so bare soil stays exposed for weeks and weeds have an open run at it. The herbicide programme is repeated and expensive, and it is applied across the whole field because the actual weed distribution has never been mapped. Beet is also a heavy crop moved by heavy machines, so the compaction from last year\'s lifting shows up in this year\'s stand.',
    approach:
      'Weed scans ahead of every pass in the programme, producing a prescription per pass rather than a single map for the season. Compaction analysis reads the crop over the traffic lines your terminals recorded. A base elevation map handles the standing water that beet punishes hardest.',
    season: [
      { window: 'Emergence', focus: 'Establishment counts and the first weed map before the herbicide programme starts.' },
      { window: 'Herbicide programme', focus: 'A fresh weed map before each pass, exported as a prescription.' },
      { window: 'Canopy closure', focus: 'Foliar disease surveillance and nitrogen top-up zoning.' },
      { window: 'Late season', focus: 'Compaction analysis over recorded traffic and the yield estimate.' },
      { window: 'Post lifting', focus: 'Traffic damage map for next season\'s remediation plan.' },
    ],
    features: ['targeted-weed-control', 'soil-compaction', 'field-mapping', 'precision-fertilisation', 'plant-disease-detection'],
    outcomes: [
      'A prescription per herbicide pass rather than one blanket rate',
      'Treated area recorded pass by pass across the programme',
      'Compaction located against recorded machine traffic',
      'Standing water areas mapped from the elevation model',
    ],
    scale: 'Blocks of 10 to 80 hectares.',
  },
  {
    slug: 'potatoes',
    name: 'Potatoes',
    segment: 'arable',
    order: 5,
    tagline: 'Blight, irrigation and a crop you cannot see',
    summary: 'Blight surveillance on a tight cadence, irrigation uniformity from thermal imaging, and a yield estimate before lifting.',
    challenge:
      'Potatoes carry two problems at once. Late blight moves fast enough that a few days of delay changes the outcome, and the standard answer is a protective spray programme applied across everything on a calendar. Irrigation is the other: a blocked nozzle or an under-delivering arc runs for weeks while the crop underneath quietly fails, and none of it is visible from the headland.',
    approach:
      'Multispectral flights on a short cadence through the blight risk window, always compared against the field\'s own history rather than an absolute threshold. Thermal flights during the irrigation season locate leaks and dry patches to a coordinate. A counting flight before lifting gives the estimate that the storage and haulage booking depends on.',
    season: [
      { window: 'Emergence', focus: 'Establishment counts and ridge uniformity.' },
      { window: 'Canopy development', focus: 'Nitrogen zoning and the first irrigation uniformity check.' },
      { window: 'Blight risk window', focus: 'Short cadence disease surveillance with a change layer per flight.' },
      { window: 'Bulking', focus: 'Thermal irrigation flights fortnightly, plus a check after every repair.' },
      { window: 'Pre lifting', focus: 'Yield estimate and the haulm destruction plan by zone.' },
    ],
    features: ['plant-disease-detection', 'irrigation-analysis', 'yield-forecasting', 'precision-fertilisation', 'soil-compaction', 'field-assistant'],
    outcomes: [
      'Blight flags dated and located, with the change since the last flight attached',
      'Irrigation anomalies given coordinates instead of a general area',
      'Water applied recorded per irrigated hectare',
      'Storage and haulage booked against a measured estimate',
    ],
    scale: 'Blocks of 5 to 60 hectares, usually irrigated.',
  },
  {
    slug: 'vineyards',
    name: 'Vineyards',
    segment: 'permanent',
    order: 1,
    tagline: 'Steep ground, tight rows, high value',
    summary: 'Vigour mapping by row, downy and powdery mildew surveillance, frost pockets, and the terrain where drone application is actually permitted.',
    challenge:
      'A vineyard is the same plants for thirty years, which makes every uneven patch a compounding problem rather than a one-season one. Vigour varies row by row and often vine by vine. Mildew pressure builds inside a canopy that nobody can see into from outside. And on steep sites the machinery that can legally treat the crop is limited by the slope itself, which is precisely the terrain where the EU permits aerial application by exemption.',
    approach:
      'Row-resolution vigour mapping that reports per row and per panel, not per block average. Disease surveillance timed to the infection periods rather than a calendar. Frost profiling across the site through spring, because cold air pooling in a vineyard is repeatable and therefore predictable. On steep parcels where the exemption applies, application follows the same maps.',
    season: [
      { window: 'Bud break', focus: 'Frost pocket profiling and the overnight risk brief on clear nights.' },
      { window: 'Shoot growth', focus: 'Vigour mapping by row for canopy management and pruning decisions.' },
      { window: 'Flowering to bunch closure', focus: 'Mildew surveillance timed to infection periods.' },
      { window: 'Veraison', focus: 'Water status by thermal imaging and the harvest sequencing map.' },
      { window: 'Post harvest', focus: 'Missing and declining vine census for replanting.' },
    ],
    features: ['plant-disease-detection', 'frost-protection', 'irrigation-analysis', 'field-mapping', 'targeted-weed-control', 'field-assistant'],
    outcomes: [
      'Vigour reported per row and per panel, not as a block average',
      'Mildew surveillance tied to infection periods with dated evidence',
      'Cold pockets named before dusk rather than diagnosed after sunrise',
      'Harvest sequencing built from measured ripeness variation',
    ],
    scale: 'Parcels of 0.5 to 20 hectares, including slopes machinery cannot work.',
  },
  {
    slug: 'orchards',
    name: 'Orchards',
    segment: 'permanent',
    order: 2,
    tagline: 'Count the fruit, protect the blossom',
    summary: 'Fruit counting for the pack house booking, blossom frost protection, tree by tree health, and birds at ripening.',
    challenge:
      'An orchard\'s year turns on two short windows. A frost during blossom can remove the crop in a single night, and protection is expensive enough that it needs to go exactly where the cold actually collects. Then at harvest, the pack house, the labour and the storage all need a number weeks ahead, and that number traditionally comes from counting a few trees and multiplying. Between those, individual trees decline, and a declining tree in row 14 looks like every other tree from the end of the row.',
    approach:
      'Frost profiling through blossom, with a nightly brief when the forecast is near the threshold. Fruit counting flights at set points after fruit set, aggregated per row and per block. Tree by tree health tracking that carries an identity across seasons, so decline is a trend rather than a discovery.',
    season: [
      { window: 'Blossom', focus: 'Frost pocket mapping and nightly risk briefs.' },
      { window: 'Fruit set', focus: 'Set counts against reference rows and the first crop estimate.' },
      { window: 'Summer', focus: 'Tree by tree health tracking, irrigation uniformity, canopy vigour.' },
      { window: 'Pre harvest', focus: 'Fruit counts per row, sizing estimate and picking sequence.' },
      { window: 'Ripening', focus: 'Bird pressure monitoring and on-demand deterrence.' },
    ],
    features: ['frost-protection', 'yield-forecasting', 'plant-disease-detection', 'irrigation-analysis', 'bird-deterrence', 'pollination-support'],
    outcomes: [
      'Frost protection deployed to mapped cold pockets',
      'Pack house and labour booked against counted fruit',
      'Individual trees tracked across seasons rather than sampled',
      'Picking sequenced from measured ripeness by row',
    ],
    scale: 'Blocks of 1 to 40 hectares.',
  },
  {
    slug: 'berries',
    name: 'Soft fruit and berries',
    segment: 'permanent',
    order: 3,
    tagline: 'High value per square metre, short windows',
    summary: 'Picking forecasts for labour planning, irrigation uniformity under tunnels, bird pressure and frost on early varieties.',
    challenge:
      'Soft fruit is the crop where a scheduling mistake costs the most per hectare. Pickers are booked days ahead against a forecast, and a forecast that is out by a quarter means either fruit left on the plant or a crew standing idle. Under tunnels, irrigation problems compound quickly because there is no rainfall to mask them. Birds take a meaningful share in the fortnight before picking.',
    approach:
      'Frequent counting flights through ripening so the picking forecast is updated rather than set once. Thermal irrigation checks on the tunnel blocks, where a blocked line shows within days. Detection-triggered bird deterrence rather than a permanent noise source next to a public road.',
    season: [
      { window: 'Early spring', focus: 'Frost risk profiling on early varieties.' },
      { window: 'Flowering', focus: 'Pollination assist on poor weather days and fruit set counts.' },
      { window: 'Green fruit', focus: 'Irrigation uniformity under tunnels and canopy health.' },
      { window: 'Ripening', focus: 'Counting flights for the picking forecast and active bird deterrence.' },
      { window: 'Between flushes', focus: 'Plant health census and replacement planting list.' },
    ],
    features: ['yield-forecasting', 'irrigation-analysis', 'bird-deterrence', 'frost-protection', 'pollination-support', 'pest-monitoring'],
    outcomes: [
      'Picking crews booked against a forecast that updates through ripening',
      'Irrigation faults under tunnels found in days rather than weeks',
      'Bird response logged by block and hour instead of running continuously',
      'Plant replacement lists built from a census, not a walk',
    ],
    scale: 'Blocks of 0.5 to 15 hectares, open field and tunnels.',
  },
  {
    slug: 'hops',
    name: 'Hops',
    segment: 'permanent',
    order: 4,
    tagline: 'A wall of canopy you cannot see into',
    summary: 'Downy mildew and spider mite surveillance from above, plus vigour mapping across a trellis that hides everything at ground level.',
    challenge:
      'A hop yard in July is a seven metre wall of canopy. Walking it tells you about the outside row and almost nothing about the middle of the block. Downy mildew and spider mite both start in pockets, and both are far cheaper to deal with early. The crop is high value, the treatment programme is intensive, and the whole thing is applied on the assumption that the block is uniform.',
    approach:
      'Overhead multispectral flights read the canopy the ground crew cannot reach, on a cadence tight enough to catch a pocket while it is still a pocket. Vigour mapping runs by row and by bine position. Findings are ranked into a scouting route so the crew walks to the worst rows first rather than sampling.',
    season: [
      { window: 'Training', focus: 'Establishment and bine count per hill.' },
      { window: 'Rapid growth', focus: 'Vigour mapping by row and nitrogen zoning.' },
      { window: 'Canopy closure', focus: 'Mildew and mite surveillance on a tight cadence, ranked scouting routes.' },
      { window: 'Cone development', focus: 'Health surveillance and the yield estimate for the contract.' },
      { window: 'Pre harvest', focus: 'Picking sequence by block from measured maturity.' },
    ],
    features: ['plant-disease-detection', 'pest-monitoring', 'precision-fertilisation', 'yield-forecasting', 'field-assistant'],
    outcomes: [
      'The middle of the block surveyed as often as the edge rows',
      'Scouting routed to ranked areas rather than sampled at random',
      'Nitrogen zoned to measured vigour by row',
      'Contract volumes estimated from counted cones',
    ],
    scale: 'Yards of 2 to 50 hectares.',
  },
  {
    slug: 'grassland-and-hay',
    name: 'Grassland and silage',
    segment: 'livestock',
    order: 1,
    tagline: 'Search before the mower moves',
    summary: 'Thermal fawn searches ahead of first cut, sward quality mapping, and reseeding where the ground has gone back.',
    challenge:
      'First cut silage is the single most lethal operation of the farming year for wildlife. Roe deer leave fawns lying in tall grass and a fawn will press flat rather than run from a mower. In Germany the duty to take reasonable precautions falls on whoever is doing the mowing, and a line of volunteers walking a 12 hectare field before dawn is neither reliable nor repeatable. Separately, sward quality drifts: patches go back to weed grasses and nobody maps it until the analysis comes back poor.',
    approach:
      'A thermal search flown in the cool hours before the mower starts, with finds pushed live to the phone of whoever is on the ground, and a coverage record kept per field. Sward composition is mapped between cuts so reseeding is targeted. Drone broadcast handles the wet hollows and steep banks a machine should not be on.',
    season: [
      { window: 'Before first cut', focus: 'Thermal wildlife search with live find marking and a coverage record.' },
      { window: 'Between cuts', focus: 'Sward quality and weed grass mapping.' },
      { window: 'Later cuts', focus: 'Repeat searches on fields with known activity, plus yield estimates per cut.' },
      { window: 'Late summer', focus: 'Overseeding of thin areas by drone where machinery cannot travel.' },
      { window: 'Autumn', focus: 'Drainage and wet area mapping for the winter works list.' },
    ],
    features: ['wildlife-rescue', 'field-mapping', 'drone-seeding', 'yield-forecasting', 'livestock-and-fences'],
    outcomes: [
      'A search record per field, signed off before the mower starts',
      'Finds logged with coordinates and outcome',
      'Reseeding targeted at mapped thin areas',
      'Cut yields estimated rather than counted off the clamp',
    ],
    scale: 'Fields of 2 to 40 hectares, flown at dawn.',
  },
  {
    slug: 'dairy-pasture',
    name: 'Dairy and grazing livestock',
    segment: 'livestock',
    order: 2,
    tagline: 'The outlying block, checked every morning',
    summary: 'Daily head counts, fence line inspection and flagged animals, without the drive to every outlying block.',
    challenge:
      'The blocks furthest from the yard get checked least, and they are the ones where a fence going down matters most. A daily round of outlying grazing is an hour of driving that finds nothing on most days. On the days it would have found something, the delay between the event and the check is the whole cost: an animal through a fence onto a road, or a cow down in a corner since the previous evening.',
    approach:
      'A scheduled patrol per block, flown from a dock rather than driven to. Head count against expected, fence line imagery, and thermal signatures that separate an animal lying and ruminating from an animal lying and not. Anything ambiguous goes to a person before it becomes an alert.',
    season: [
      { window: 'Turnout', focus: 'Fence line survey of every block before stock go out.' },
      { window: 'Grazing season', focus: 'Daily patrols with head counts and flagged animal reports.' },
      { window: 'Peak growth', focus: 'Grass cover mapping for the grazing rotation.' },
      { window: 'Autumn', focus: 'Poaching and damage mapping for the reseeding plan.' },
      { window: 'Housing', focus: 'Fence and water point condition survey for the winter works list.' },
    ],
    features: ['livestock-and-fences', 'wildlife-rescue', 'field-mapping', 'autonomous-network', 'drone-seeding'],
    outcomes: [
      'Head count per block recorded daily against expected',
      'Fence faults reported the morning they appear',
      'Flagged animals delivered with imagery for a human decision',
      'Grazing rotation planned from mapped cover',
    ],
    scale: 'Grazing platforms of 20 to 300 hectares, docks placed by battery range.',
  },
  {
    slug: 'organic-farms',
    name: 'Organic farms',
    segment: 'arable',
    order: 6,
    tagline: 'Mechanical weeding needs a map more than anyone',
    summary: 'Without herbicides, weed location decides where the hoe goes, when, and how many passes the field actually needs.',
    challenge:
      'An organic rotation has no rescue treatment, so timing is everything and the tool is mechanical. Hoeing and harrowing are expensive in fuel, time and soil disturbance, and they get run across the whole field because the weed distribution is unknown. Run too early and the weeds return; too late and the crop takes the damage. Meanwhile nutrient supply comes from the rotation and manure, both of which vary across a field far more than a bought fertiliser does.',
    approach:
      'Weed mapping ahead of each mechanical pass, which turns a whole-field operation into a targeted one and often removes a pass entirely. Nutrient status is measured rather than assumed, so manure and compost go where the rotation has left a gap. Cover crop establishment is verified by counting rather than by eye.',
    season: [
      { window: 'Pre drilling', focus: 'Weed burden mapping and the seedbed plan.' },
      { window: 'Early crop', focus: 'Weed maps before each hoeing or harrowing pass.' },
      { window: 'Mid season', focus: 'Nutrient status mapping for targeted manure and compost.' },
      { window: 'Late season', focus: 'Yield estimate and a weed seed return map for the rotation plan.' },
      { window: 'After harvest', focus: 'Cover crop broadcast and an establishment count two weeks later.' },
    ],
    features: ['targeted-weed-control', 'drone-seeding', 'precision-fertilisation', 'sustainability-dashboard', 'yield-forecasting'],
    outcomes: [
      'Mechanical passes targeted to mapped areas, with passes saved recorded',
      'Manure and compost placed against measured shortfall',
      'Cover crop establishment counted, not assumed',
      'Certification evidence assembled from flight records',
    ],
    scale: 'Blocks of 5 to 100 hectares.',
  },
  {
    slug: 'greenhouses',
    name: 'Glasshouses and protected crops',
    segment: 'protected',
    order: 1,
    tagline: 'Indoors, where the weather never helps',
    summary: 'Pollination assist through flowering, canopy health by row, and irrigation uniformity across a house with no rain to mask it.',
    challenge:
      'A glasshouse removes the weather and with it the pollinators, the natural water and the margin for error. Hired hives are expensive and cannot be timed to a specific week. Irrigation problems compound within days because nothing else waters the crop. And because the crop is uniform by design, a problem that starts in one row is easy to miss until it is in twenty.',
    approach:
      'Small indoor aircraft on a fixed path per house. Pollination assist runs through the flowering window on the days natural activity would be poor. Canopy health is read row by row so an early divergence is visible while it is still one row. Irrigation uniformity is checked on a schedule rather than after a problem appears.',
    season: [
      { window: 'Planting', focus: 'Row by row establishment record for the house.' },
      { window: 'Flowering', focus: 'Daily pollination assist and fruit set counts against reference rows.' },
      { window: 'Production', focus: 'Canopy health by row and irrigation uniformity checks.' },
      { window: 'Peak picking', focus: 'Counting flights for the picking and packing forecast.' },
      { window: 'Crop change', focus: 'End of cycle health census and a plan for the next planting.' },
    ],
    features: ['pollination-support', 'irrigation-analysis', 'plant-disease-detection', 'yield-forecasting', 'field-assistant'],
    outcomes: [
      'Pollination covered on the days natural activity would not be',
      'Fruit set counted against untreated reference rows',
      'Row level divergence caught while it is still one row',
      'Picking and packing planned against counted fruit',
    ],
    scale: 'Houses of 0.2 to 10 hectares under glass or plastic.',
  },
  {
    slug: 'contractors',
    name: 'Agricultural contractors',
    segment: 'operator',
    order: 1,
    tagline: 'A service you can resell by the hectare',
    summary: 'Add scouting, wildlife searches and prescription maps to the work you already do, without buying a fleet.',
    challenge:
      'A contractor already owns the machines, the operators and the customer relationships. What they do not own is a reason for the customer to pay for anything beyond the pass itself. Meanwhile the mowing they do on contract carries the wildlife obligation, and the spraying they do is applied flat because the customer has no map. Both are liabilities that could be services.',
    approach:
      'Contractors run the flights as part of the job: a wildlife search flown before the mower goes in, a weed map before the sprayer, and a prescription that loads straight into the machine already on the yard. The reports carry the contractor\'s name and become the record the customer keeps.',
    season: [
      { window: 'Spring', focus: 'Wildlife searches ahead of every first cut on the books.' },
      { window: 'Herbicide season', focus: 'Weed maps and prescriptions ahead of each spraying job.' },
      { window: 'Fertiliser season', focus: 'Variable rate prescriptions for the spreading work.' },
      { window: 'Harvest', focus: 'Yield estimates that set the trailer and haulage plan per customer.' },
      { window: 'Winter', focus: 'Season reviews per customer and next year\'s flight calendar.' },
    ],
    features: ['drone-service', 'wildlife-rescue', 'targeted-weed-control', 'precision-fertilisation', 'autonomous-network', 'sustainability-dashboard'],
    outcomes: [
      'Search and treatment records held per customer and per field',
      'Prescriptions delivered in the format the customer\'s terminal expects',
      'Hectares flown tracked against hectares worked',
      'A billable service attached to passes that were previously flat rate',
    ],
    scale: 'Portfolios of 500 to 5,000 hectares across many holdings.',
  },
  {
    slug: 'cooperatives',
    name: 'Cooperatives and large estates',
    segment: 'operator',
    order: 2,
    tagline: 'One picture across every member holding',
    summary: 'Fleet coverage across scattered blocks, comparable numbers between holdings, and reporting that rolls up cleanly.',
    challenge:
      'A cooperative or a large estate has the same problem repeated dozens of times, plus one of its own: nothing is comparable. Each holding records differently, applies differently and reports differently, so an aggregate figure is either unavailable or not defensible. The blocks are scattered, which makes a pilot in a van an expensive way to cover them.',
    approach:
      'Docked aircraft placed to cover clusters of blocks, flying a schedule instead of a route driven by travel time. Every holding is measured the same way, so member comparison and benchmarking are meaningful. Reporting rolls up from field to holding to enterprise with the source flight still attached to each figure.',
    season: [
      { window: 'Planning', focus: 'Base mapping across every member block and a shared field register.' },
      { window: 'Growing season', focus: 'Scheduled coverage from docks, with a published weekly calendar.' },
      { window: 'Treatment windows', focus: 'Prescriptions distributed to each holding\'s machines.' },
      { window: 'Pre harvest', focus: 'Yield estimates aggregated for the marketing and logistics plan.' },
      { window: 'Year end', focus: 'Input, water and treated area reporting rolled up with evidence.' },
    ],
    features: ['autonomous-network', 'drone-service', 'sustainability-dashboard', 'field-assistant', 'precision-fertilisation', 'yield-forecasting'],
    outcomes: [
      'Every holding measured the same way, so comparison means something',
      'Coverage set by schedule rather than by driving distance',
      'Aggregate reporting with the source flight attached to each figure',
      'Marketing and logistics planned from estimates that update weekly',
    ],
    scale: '2,000 to 40,000 hectares across scattered member blocks.',
  },
  {
    slug: 'reforestation',
    name: 'Reforestation and land restoration',
    segment: 'operator',
    order: 3,
    tagline: 'Plant the slope nobody can walk',
    summary: 'Terrain mapping, seed pod broadcast onto ground machines cannot reach, and establishment counts that prove it worked.',
    challenge:
      'Restoration work happens on exactly the ground that is hardest to work: steep slopes, burnt or storm damaged stands, wet ground and sites with no access track. Hand planting is slow and dangerous there. And once seed is in, the follow-up question, whether anything actually established, is usually answered by a walk over a small sample and a hopeful extrapolation.',
    approach:
      'A terrain survey first, so the planting plan follows slope, aspect and drainage rather than a shape on a map. Seed pods are broadcast at a controlled rate over the areas machines cannot reach. Establishment flights at fixed intervals count what came up, and the gaps become the next broadcast\'s target area.',
    season: [
      { window: 'Survey', focus: 'Terrain model, slope and aspect analysis, and the planting plan.' },
      { window: 'Broadcast', focus: 'Seed pod application at the planned rate, with an as-applied coverage map.' },
      { window: 'Six weeks', focus: 'First establishment count and the gap map.' },
      { window: 'End of season', focus: 'Survival count and the target area for the follow-up broadcast.' },
      { window: 'Following years', focus: 'Annual canopy development tracking against the restoration plan.' },
    ],
    features: ['drone-seeding', 'field-mapping', 'yield-forecasting', 'sustainability-dashboard'],
    outcomes: [
      'Planting planned against measured slope, aspect and drainage',
      'As-applied coverage recorded for every broadcast',
      'Establishment and survival counted at fixed intervals',
      'Follow-up broadcasts targeted at mapped gaps',
    ],
    scale: 'Sites of 1 to 500 hectares, including terrain with no vehicle access.',
  },
]

export const useCaseSegments: Record<UseCaseSegment, { label: string, blurb: string }> = {
  arable: { label: 'Arable', blurb: 'Combinable crops and root crops, flown in stages across a long season.' },
  permanent: { label: 'Permanent crops', blurb: 'Vines, trees and canes, where the same plants carry every decision forward.' },
  protected: { label: 'Protected crops', blurb: 'Glass and plastic, where nothing is left to the weather.' },
  livestock: { label: 'Grassland and livestock', blurb: 'Silage, grazing and the wildlife obligation that comes with a mower.' },
  operator: { label: 'Operators', blurb: 'Contractors, cooperatives and restoration projects running many holdings at once.' },
}

export function useCaseBySlug(slug: string): UseCaseContent | undefined {
  return useCases.find(u => u.slug === slug)
}

export function useCasesBySegment(segment: UseCaseSegment): UseCaseContent[] {
  return useCases.filter(u => u.segment === segment).sort((a, b) => a.order - b.order)
}

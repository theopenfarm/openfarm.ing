/**
 * The Open Farming capability catalog.
 *
 * This module is the single source of truth for feature content: the seeder
 * writes it into the `features` table, and the marketing views read it back
 * through `app/Support/catalog.ts`. Keeping the copy here (rather than in a
 * migration or inline in a view) means one edit updates the API, the sitemap,
 * the mega menu, and every detail page at once.
 *
 * Regulatory note that shapes several entries: in Germany and most of the EU,
 * aerial application of plant protection products is prohibited by default
 * (Pflanzenschutzgesetz §18) with narrow exemptions, most prominently steep
 * vineyard terrain. So the honest product shape is "drone finds it, and the
 * machine that is already allowed to treat it does the treating" - with drone
 * application only where an exemption applies. The copy below reflects that
 * rather than promising sprayer drones over arable land.
 */

export type FeatureCategory = 'detect' | 'act' | 'operate'

export interface FeatureStep {
  title: string
  text: string
}

export interface FeatureContent {
  slug: string
  name: string
  category: FeatureCategory
  /** One line, sentence case, used under the name in menus and cards. */
  tagline: string
  /** Under 25 words. Card body and meta description. */
  summary: string
  /** What it costs a farm today. Two or three sentences, concrete. */
  problem: string
  /** How the system does it. Three or four steps. */
  steps: FeatureStep[]
  /** Instruments the flight actually carries for this job. */
  sensors: string[]
  /** What lands in the farmer's hands afterwards. */
  outputs: string[]
  /** How often this job is normally flown. */
  cadence: string
  /** Dashboard readings this capability produces. Measurements, not promises. */
  readings: string[]
  /** Use case slugs where this capability does the most work. */
  useCases: string[]
  /** Sort order inside its category. */
  order: number
}

export const features: FeatureContent[] = [
  {
    slug: 'targeted-weed-control',
    name: 'Targeted weed control',
    category: 'act',
    order: 1,
    tagline: 'Spray the weeds, not the field',
    summary: 'Cameras and on-board models find weeds plant by plant, then only the affected square metres get treated.',
    problem:
      'Blanket spraying treats the whole field because nobody knows which parts actually carry weeds. On a typical arable field the weed pressure is patchy: dense along headlands and tramlines, thin across the middle. Every litre applied to clean ground is money spent, residue added, and resistance pressure built for no agronomic return.',
    steps: [
      { title: 'Scan', text: 'The drone flies a fixed grid at low altitude and photographs the canopy at centimetre resolution.' },
      { title: 'Classify', text: 'An on-board model separates crop from weed and tags each detection with a species guess and a confidence score.' },
      { title: 'Map', text: 'Detections are clustered into treatment zones and written to a prescription map with a buffer you set.' },
      { title: 'Treat', text: 'The map loads into your section-control sprayer or spot-spray rig, which opens nozzles only over the marked zones.' },
    ],
    sensors: ['RGB camera at 1 cm/px', 'Downward LiDAR for canopy height', 'RTK positioning'],
    outputs: ['Weed density map', 'ISOXML / shapefile prescription', 'Species breakdown per zone', 'Before and after comparison'],
    cadence: 'Two to four scouting flights per crop, timed to the herbicide windows.',
    readings: ['Treated area as a share of field area', 'Product volume per hectare', 'Detections by species', 'Zone count and mean zone size'],
    useCases: ['winter-wheat', 'maize', 'sugar-beet', 'organic-farms', 'contractors'],
  },
  {
    slug: 'plant-disease-detection',
    name: 'Early disease detection',
    category: 'detect',
    order: 1,
    tagline: 'See the infection before the eye can',
    summary: 'Multispectral imaging picks up stress, fungal infection and nutrient shortfall days before symptoms are visible from the cab.',
    problem:
      'By the time a farmer sees a disease from the tractor seat, the infection has usually been established for a week or more and the treatment window has narrowed to a curative spray instead of a protective one. Walking the field catches it earlier, but nobody has the hours to walk every hectare weekly.',
    steps: [
      { title: 'Capture', text: 'A multispectral camera records red edge and near infrared bands alongside visible light.' },
      { title: 'Index', text: 'The bands are combined into vegetation indices that expose chlorophyll loss and cell structure damage.' },
      { title: 'Compare', text: 'Each flight is compared against the field\'s own history, so a wet spring baseline does not read as disease.' },
      { title: 'Flag', text: 'Divergent patches are ranked by severity and area, with a scouting route so you can ground truth the worst first.' },
    ],
    sensors: ['Five band multispectral camera', 'Downwelling light sensor', 'RGB reference camera'],
    outputs: ['Index maps per flight', 'Change layer against the previous flight', 'Ranked scouting list', 'Ground truth capture form'],
    cadence: 'Weekly through the main growth stages, tightening around high risk weather.',
    readings: ['Affected area per flight', 'Change since the previous flight', 'Severity distribution', 'Days from flag to ground truth'],
    useCases: ['winter-wheat', 'potatoes', 'vineyards', 'orchards', 'hops'],
  },
  {
    slug: 'pest-monitoring',
    name: 'Automated pest monitoring',
    category: 'detect',
    order: 2,
    tagline: 'Standing patrol over every hectare',
    summary: 'Regular flights check fields for pest damage and mark the affected areas on a map you can act on.',
    problem:
      'Pest scouting is sampling: a handful of spots per field, a few times a season, and the rest is inference. Outbreaks that start in a corner get found when they have already spread, and the response is a whole field treatment because the actual extent was never mapped.',
    steps: [
      { title: 'Patrol', text: 'The same route is flown on a fixed schedule so every flight is comparable with the last.' },
      { title: 'Detect', text: 'Feeding damage, lodging and canopy holes are picked out of the imagery and located to the square metre.' },
      { title: 'Track', text: 'Each affected area gets an identity and is followed across flights, so growth or collapse is visible.' },
      { title: 'Alert', text: 'When an area crosses the threshold you set, the alert lands on your phone with the map already drawn.' },
    ],
    sensors: ['RGB camera at 1 cm/px', 'Multispectral camera', 'RTK positioning'],
    outputs: ['Damage map with tracked areas', 'Threshold alerts', 'Season timeline per area', 'Scouting route export'],
    cadence: 'Every three to seven days during the risk window for your crop.',
    readings: ['Affected area and its trend', 'Number of tracked outbreaks', 'Time from first detection to alert', 'Share of field under threshold'],
    useCases: ['maize', 'oilseed-rape', 'potatoes', 'berries', 'cooperatives'],
  },
  {
    slug: 'precision-fertilisation',
    name: 'Precision fertilisation',
    category: 'act',
    order: 2,
    tagline: 'Feed the rows that are short',
    summary: 'The system works out which parts of the crop are under-supplied and builds a variable rate map for the spreader.',
    problem:
      'A flat application rate assumes the field is uniform. It is not. Headlands, old field boundaries, sandy patches and wet hollows each take up nitrogen differently, so a single rate simultaneously overfeeds the strong areas and starves the weak ones. The overfed parts lodge and leach; the starved parts cost yield.',
    steps: [
      { title: 'Measure', text: 'Multispectral flights produce a biomass and chlorophyll picture of the standing crop.' },
      { title: 'Zone', text: 'The field is divided into management zones that follow the actual pattern, not a grid drawn on top of it.' },
      { title: 'Prescribe', text: 'Each zone gets a rate derived from your target, your soil samples and the measured shortfall.' },
      { title: 'Apply', text: 'The prescription exports to your spreader or applicator in the format your terminal expects.' },
    ],
    sensors: ['Five band multispectral camera', 'Downwelling light sensor', 'RTK positioning'],
    outputs: ['Biomass and chlorophyll maps', 'Management zone layer', 'Variable rate prescription', 'Applied versus planned report'],
    cadence: 'Before each split application, typically two to three times per season.',
    readings: ['Total product planned versus flat rate', 'Rate spread across zones', 'Zone area distribution', 'Uptake response after application'],
    useCases: ['winter-wheat', 'maize', 'oilseed-rape', 'sugar-beet', 'cooperatives'],
  },
  {
    slug: 'irrigation-analysis',
    name: 'Irrigation analysis',
    category: 'detect',
    order: 3,
    tagline: 'Find the dry corner and the buried leak',
    summary: 'Thermal imaging exposes dry patches, leaks and uneven coverage so water goes where it is actually needed.',
    problem:
      'Irrigation problems are invisible until the crop shows them, and by then the water has already been wasted. A partially blocked nozzle, a slow leak in a buried line, or a pivot that under-delivers on one arc can run for weeks while the meter keeps counting.',
    steps: [
      { title: 'Fly warm', text: 'Thermal flights are timed for the hottest part of the day, when water stressed plants separate most clearly from watered ones.' },
      { title: 'Normalise', text: 'Canopy temperature is corrected against air temperature and reference surfaces so readings compare across days.' },
      { title: 'Locate', text: 'Cold anomalies point to leaks and pooling; hot anomalies point to under-delivery and stress.' },
      { title: 'Route', text: 'Each anomaly becomes a marked point with coordinates you can walk or drive to directly.' },
    ],
    sensors: ['Radiometric thermal camera', 'Ambient temperature and humidity probe', 'RGB reference camera'],
    outputs: ['Canopy temperature map', 'Anomaly list with coordinates', 'Coverage uniformity score', 'Repair verification flight'],
    cadence: 'Fortnightly during the irrigation season, plus a check flight after any repair.',
    readings: ['Canopy temperature spread', 'Number of open anomalies', 'Uniformity across the irrigated block', 'Water applied per irrigated hectare'],
    useCases: ['potatoes', 'berries', 'orchards', 'greenhouses', 'vineyards'],
  },
  {
    slug: 'yield-forecasting',
    name: 'Yield forecasting',
    category: 'detect',
    order: 4,
    tagline: 'Count what is actually out there',
    summary: 'Drones count plants, fruit or ears and turn the counts into a yield estimate for each part of the field.',
    problem:
      'Harvest planning, storage booking and forward selling all run on an estimate, and the estimate usually comes from a hand count in a few square metres extrapolated across a hundred hectares. A bad estimate books the wrong number of trailers and sells grain that is not there.',
    steps: [
      { title: 'Fly low', text: 'A high resolution pass captures individual plants, ears or fruit at a density the model can count.' },
      { title: 'Count', text: 'Objects are counted per square metre and the counts are aggregated by zone rather than averaged flat.' },
      { title: 'Model', text: 'Counts are combined with your variety, row spacing and historical yields to produce an estimate range.' },
      { title: 'Update', text: 'The forecast is re-run on each later flight, so the range narrows as harvest approaches.' },
    ],
    sensors: ['High resolution RGB camera', 'Multispectral camera', 'RTK positioning'],
    outputs: ['Plant or fruit count per zone', 'Yield estimate with a range', 'Establishment gap map', 'Harvest sequencing suggestion'],
    cadence: 'Once at establishment, then at two or three points through grain fill or fruit set.',
    readings: ['Counted objects per square metre', 'Estimate range width', 'Gap area as a share of the field', 'Estimate against final weighbridge'],
    useCases: ['winter-wheat', 'maize', 'orchards', 'berries', 'cooperatives'],
  },
  {
    slug: 'field-mapping',
    name: 'Automated field mapping',
    category: 'detect',
    order: 5,
    tagline: 'The base layer everything else sits on',
    summary: 'One flight produces a high resolution 3D model of the field: elevation, drainage lines, headlands and problem ground.',
    problem:
      'Most farms are still working from a field boundary drawn once and a memory of where the wet spot is. Without an elevation model there is no way to see why one corner floods, where the water actually runs, or how much of a field is not worth cropping at all.',
    steps: [
      { title: 'Survey', text: 'The drone flies an overlapping photogrammetry grid over the whole block.' },
      { title: 'Reconstruct', text: 'Images are matched into a point cloud, then a surface model and an orthophoto.' },
      { title: 'Derive', text: 'Slope, aspect, flow accumulation and depressions are calculated from the surface.' },
      { title: 'Publish', text: 'Layers are written to your field record so every later flight is measured against the same base.' },
    ],
    sensors: ['High resolution RGB camera', 'RTK positioning', 'Downward LiDAR on wooded or tall canopy blocks'],
    outputs: ['Orthophoto', 'Digital surface and terrain models', 'Drainage and flow layer', 'Corrected field boundary with area'],
    cadence: 'Once per field, then refreshed after drainage work or a boundary change.',
    readings: ['Mapped area', 'Elevation range across the block', 'Depression area and volume', 'Boundary area against the registered area'],
    useCases: ['winter-wheat', 'sugar-beet', 'grassland-and-hay', 'cooperatives', 'reforestation'],
  },
  {
    slug: 'wildlife-rescue',
    name: 'Wildlife detection before mowing',
    category: 'detect',
    order: 6,
    tagline: 'Find the fawn before the mower does',
    summary: 'Thermal drones search grassland ahead of the mower for fawns, hares and ground nesting birds, and mark every find.',
    problem:
      'Roe deer leave their fawns lying in tall grass, and a fawn\'s instinct is to press flat rather than run. The first cut of silage every spring kills a large number of them. In Germany the responsibility to take reasonable precautions sits with the person doing the mowing, and walking a field with a line of helpers rarely covers it in the time available.',
    steps: [
      { title: 'Fly at dawn', text: 'The search runs in the cool hours before mowing, when a warm body contrasts most strongly with the sward.' },
      { title: 'Detect heat', text: 'The thermal camera picks out warm shapes and the model separates animals from stones, molehills and machinery.' },
      { title: 'Mark', text: 'Every find is pinned to a coordinate and pushed live to the phone of the person on the ground.' },
      { title: 'Clear', text: 'The animal is carried out or boxed, the point is closed off in the app, and the mower follows behind the cleared area.' },
    ],
    sensors: ['Radiometric thermal camera', 'RGB spotlight camera for confirmation', 'RTK positioning'],
    outputs: ['Live find map on the ground crew\'s phone', 'Search coverage record', 'Signed off log per field', 'Season summary for the hunting tenant'],
    cadence: 'Every first cut, and any later cut on fields with known activity.',
    readings: ['Area searched per flight', 'Finds per hectare', 'Search completed before the mower started', 'Coverage gaps flagged'],
    useCases: ['grassland-and-hay', 'dairy-pasture', 'contractors', 'cooperatives'],
  },
  {
    slug: 'drone-seeding',
    name: 'Drone seeding',
    category: 'act',
    order: 3,
    tagline: 'Sow where the drill cannot go',
    summary: 'Drones broadcast seed and seed pods onto ground that is too steep, too wet or too awkward for a machine.',
    problem:
      'Cover crops go in late because the drill cannot get on wet stubble. Steep banks, wet hollows and awkward corners are either skipped or damaged by a machine that should not have been there. Reseeding a washed out patch means bringing a drill back for half a hectare.',
    steps: [
      { title: 'Plan', text: 'The target area comes from a boundary you draw or from the gap map produced by an earlier flight.' },
      { title: 'Load', text: 'The hopper is filled with seed or coated pods and calibrated for the rate you want.' },
      { title: 'Broadcast', text: 'The drone flies the pattern at a fixed height and speed, holding the rate across the whole area.' },
      { title: 'Verify', text: 'An establishment flight two to three weeks later counts what actually came up.' },
    ],
    sensors: ['Metering hopper with flow feedback', 'RTK positioning', 'Downward radar for height hold'],
    outputs: ['As applied coverage map', 'Rate achieved against rate planned', 'Establishment count', 'Reseeding list for the gaps'],
    cadence: 'On demand, mostly cover crop establishment and repair work.',
    readings: ['Area covered per flight', 'Seed applied per hectare', 'Establishment rate at the check flight', 'Area unreachable by machine'],
    useCases: ['winter-wheat', 'grassland-and-hay', 'reforestation', 'organic-farms', 'contractors'],
  },
  {
    slug: 'frost-protection',
    name: 'Frost protection',
    category: 'act',
    order: 4,
    tagline: 'Know which hollow will freeze tonight',
    summary: 'Drones measure temperature across the block and identify the pockets that will drop below the damage threshold first.',
    problem:
      'A radiation frost is not uniform. Cold air drains downhill and pools, so one corner of an orchard can sit two or three degrees below the weather station on the shed roof. Protection gets deployed on the station\'s reading, which means either the whole block is protected at great cost or the wrong part of it is.',
    steps: [
      { title: 'Profile', text: 'Flights on clear cold nights build a temperature surface for the block at crop height.' },
      { title: 'Predict', text: 'The recorded drainage pattern is combined with the forecast to name tonight\'s cold pockets before dusk.' },
      { title: 'Warn', text: 'You get the pocket map and a lead time, so wind machines, candles or irrigation go where they will earn their cost.' },
      { title: 'Verify', text: 'A flight during the event records what the treated and untreated areas actually did.' },
    ],
    sensors: ['Radiometric thermal camera', 'Calibrated air temperature probe at crop height', 'RTK positioning'],
    outputs: ['Cold pocket map for the block', 'Overnight risk brief', 'Event temperature record', 'Damage assessment flight'],
    cadence: 'Through the frost risk window, on every clear night with a forecast minimum near the threshold.',
    readings: ['Temperature spread across the block', 'Area below the damage threshold', 'Lead time on the warning', 'Minutes spent below threshold per pocket'],
    useCases: ['vineyards', 'orchards', 'berries'],
  },
  {
    slug: 'pollination-support',
    name: 'Pollination support',
    category: 'act',
    order: 5,
    tagline: 'Cover the gap when the bees cannot',
    summary: 'Small drones assist pollination indoors and in blocks where natural pollinator activity is short.',
    problem:
      'Glasshouse crops and early flowering orchards need pollination at a moment that does not always line up with pollinator activity. Cold, wet or windy flowering weather keeps bees in, hired hives are expensive and cannot be timed precisely, and a missed window shows up directly in fruit set.',
    steps: [
      { title: 'Time', text: 'Flowering is tracked from imagery so the assist runs on the days that actually matter.' },
      { title: 'Fly slow', text: 'A light drone works the rows at canopy height on a repeatable path.' },
      { title: 'Assist', text: 'Controlled airflow moves pollen within the canopy without stripping or bruising the flowers.' },
      { title: 'Check', text: 'Fruit set is counted afterwards and compared against untreated reference rows.' },
    ],
    sensors: ['RGB camera for bloom staging', 'Airflow control', 'Indoor positioning for glasshouse work'],
    outputs: ['Bloom stage timeline', 'Assist coverage log', 'Fruit set count against reference rows', 'Hive supplement recommendation'],
    cadence: 'Daily through the flowering window.',
    readings: ['Rows covered per session', 'Bloom stage distribution', 'Fruit set against reference rows', 'Days of poor natural pollinator weather covered'],
    useCases: ['greenhouses', 'orchards', 'berries'],
  },
  {
    slug: 'livestock-and-fences',
    name: 'Livestock and fence checks',
    category: 'operate',
    order: 3,
    tagline: 'The daily round without the drive',
    summary: 'Drones walk the fence line, count the herd and flag animals that are injured, missing or lying unusually still.',
    problem:
      'Checking outlying grazing means a drive, a gate, a walk and an hour, every day, in all weather. Most days nothing is wrong. The days something is wrong, the delay between the fence going down and somebody noticing is the whole problem.',
    steps: [
      { title: 'Patrol', text: 'A fixed route covers the fence line and the grazing block on a schedule.' },
      { title: 'Count', text: 'Animals are counted and compared against the number the block should hold.' },
      { title: 'Assess', text: 'Thermal and visual signatures flag animals that are separated, lame, or lying still when the herd is grazing.' },
      { title: 'Report', text: 'A short summary lands after each patrol, with photographs of anything that needs a human decision.' },
    ],
    sensors: ['Radiometric thermal camera', 'Zoom RGB camera', 'RTK positioning'],
    outputs: ['Head count per block', 'Fence condition log', 'Flagged animal list with imagery', 'Grazing pressure map'],
    cadence: 'Daily or twice daily through the grazing season.',
    readings: ['Head count against expected', 'Fence sections flagged', 'Animals flagged per patrol', 'Time from patrol to report'],
    useCases: ['dairy-pasture', 'grassland-and-hay', 'cooperatives'],
  },
  {
    slug: 'bird-deterrence',
    name: 'Autonomous bird deterrence',
    category: 'act',
    order: 6,
    tagline: 'Move the flock without living next to a gas gun',
    summary: 'Drones clear birds from ripening crops on demand, instead of a permanent noise source that birds learn to ignore.',
    problem:
      'Fixed deterrents work for about a fortnight. Birds habituate to gas guns, kites and tape, then feed underneath them while the neighbours are still listening to the bangs. Damage in cherries, berries and ripening maize is concentrated in a few weeks and a few blocks.',
    steps: [
      { title: 'Watch', text: 'Cameras on the block detect flock arrival rather than running a fixed schedule.' },
      { title: 'Launch', text: 'A drone lifts from the nearest station and flies the approach the flock is actually using.' },
      { title: 'Move on', text: 'The flock is pushed off the block on a varied path, so the pattern never becomes predictable.' },
      { title: 'Log', text: 'Each response is recorded, so pressure by block and time of day becomes visible over the season.' },
    ],
    sensors: ['Fixed block cameras', 'On-board RGB camera', 'RTK positioning'],
    outputs: ['Pressure map by block and hour', 'Response log', 'Damage assessment flight', 'Deterrent schedule recommendation'],
    cadence: 'On demand through ripening, triggered by detection rather than a timer.',
    readings: ['Responses per day', 'Minutes of flock presence per block', 'Damaged area at assessment', 'Response time from detection'],
    useCases: ['berries', 'orchards', 'maize', 'vineyards'],
  },
  {
    slug: 'soil-compaction',
    name: 'Soil compaction detection',
    category: 'detect',
    order: 7,
    tagline: 'Read the tramlines the crop is drawing for you',
    summary: 'Growth patterns, imagery and machine data together show where heavy traffic has closed the soil up.',
    problem:
      'Compaction is invisible from the surface and expensive to find with a penetrometer, so it usually gets diagnosed years late by a crop that keeps underperforming in the same strips. Headlands, gateways and the lines a full trailer took in a wet harvest are the usual suspects, but suspicion is not a map.',
    steps: [
      { title: 'Overlay', text: 'Crop performance from multispectral flights is laid over the machine traffic your terminals recorded.' },
      { title: 'Correlate', text: 'Persistent underperformance that follows traffic lines is separated from underperformance that follows soil type.' },
      { title: 'Rank', text: 'Suspected areas are ranked by size and yield cost so the penetrometer goes to the worst first.' },
      { title: 'Confirm', text: 'Your ground measurements are recorded against each area and close the loop on the model.' },
    ],
    sensors: ['Multispectral camera', 'High resolution RGB camera', 'Machine telemetry import'],
    outputs: ['Suspected compaction map', 'Ranked verification list', 'Traffic intensity layer', 'Remediation plan by area'],
    cadence: 'Once or twice per season, best read at peak biomass.',
    readings: ['Suspected area as a share of the field', 'Overlap with recorded traffic', 'Yield gap inside suspected areas', 'Areas confirmed on the ground'],
    useCases: ['winter-wheat', 'sugar-beet', 'potatoes', 'cooperatives'],
  },
  {
    slug: 'sustainability-dashboard',
    name: 'Sustainability reporting',
    category: 'operate',
    order: 4,
    tagline: 'The paperwork writes itself from the flights',
    summary: 'Flight data, weather, soil and machine records combine into the input and water figures your buyers and schemes ask for.',
    problem:
      'Reporting obligations keep growing while the underlying numbers still live in a spray diary, a fuel receipt and somebody\'s memory. Assembling a defensible figure for product use or water per hectare takes days, and the result is hard to audit because the evidence is scattered.',
    steps: [
      { title: 'Collect', text: 'Every flight, prescription and as applied record is captured at the moment it happens.' },
      { title: 'Reconcile', text: 'Planned against applied is reconciled per field, so the numbers reflect what went on, not what was ordered.' },
      { title: 'Aggregate', text: 'Field figures roll up to block, farm and enterprise level with the flight evidence still attached.' },
      { title: 'Export', text: 'Reports export in the formats schemes and buyers accept, with the source data one click away.' },
    ],
    sensors: ['No flight of its own: it consumes every other capability\'s output'],
    outputs: ['Input use per hectare and per tonne', 'Water applied per irrigated hectare', 'Treated area versus total area', 'Audit trail per figure'],
    cadence: 'Continuous, with reporting periods you define.',
    readings: ['Product applied per hectare', 'Share of field treated', 'Water per irrigated hectare', 'Records with complete evidence'],
    useCases: ['cooperatives', 'organic-farms', 'contractors', 'winter-wheat'],
  },
  {
    slug: 'drone-service',
    name: 'Flights as a service',
    category: 'operate',
    order: 1,
    tagline: 'Book the flights, not the aircraft',
    summary: 'You book a scouting schedule and get analysis and recommendations. We own the drones, the pilots and the paperwork.',
    problem:
      'Buying a drone means buying a training course, an operator registration, an insurance policy, a maintenance schedule and the risk that the model is obsolete in three seasons. Most farms want the map, not the aircraft, and the aircraft sits in a shed between the six weeks a year it earns anything.',
    steps: [
      { title: 'Scope', text: 'We walk your blocks, agree which capabilities matter and set the flight calendar around your crop.' },
      { title: 'Fly', text: 'Our pilots fly the schedule. Registration, insurance, airspace clearance and maintenance are ours.' },
      { title: 'Report', text: 'Each flight produces a report with problem areas, recommendations and the maps your machines can load.' },
      { title: 'Review', text: 'We sit down at the end of the season with what the data showed and what to change next year.' },
    ],
    sensors: ['Whatever the booked capability requires'],
    outputs: ['Flight calendar', 'Report per flight', 'Machine ready prescriptions', 'End of season review'],
    cadence: 'Set once per crop and adjusted as the season moves.',
    readings: ['Flights completed against scheduled', 'Hectares covered', 'Recommendations acted on', 'Time from flight to report'],
    useCases: ['winter-wheat', 'maize', 'vineyards', 'orchards', 'contractors', 'cooperatives'],
  },
  {
    slug: 'autonomous-network',
    name: 'Autonomous drone network',
    category: 'operate',
    order: 2,
    tagline: 'Docked, charged, and out again at first light',
    summary: 'Drones launch from charging stations on their own schedule, cover the fields and dock again without a driver.',
    problem:
      'A pilot in a van is the bottleneck. Travel time between blocks decides how many fields get flown in a day, which means the outlying ones get flown least and the schedule collapses the moment the weather closes a window.',
    steps: [
      { title: 'Station', text: 'Weatherproof docks are placed to cover your blocks within a single battery.' },
      { title: 'Schedule', text: 'Each field has its own cadence; the network plans the day around weather, wind and daylight.' },
      { title: 'Fly and dock', text: 'Aircraft launch, fly their route, return and charge without anyone attending.' },
      { title: 'Escalate', text: 'Anything the models are unsure about goes to a human reviewer before it reaches you.' },
    ],
    sensors: ['Dock weather station', 'Aircraft sensor payload per mission', 'Redundant RTK positioning'],
    outputs: ['Daily coverage log', 'Missed flight report with the reason', 'Fleet and battery health', 'Escalation queue'],
    cadence: 'Daily, weather permitting, with the calendar published a week ahead.',
    readings: ['Flights completed against planned', 'Hectares per station per day', 'Weather cancelled flights', 'Battery cycles and dock uptime'],
    useCases: ['cooperatives', 'contractors', 'maize', 'winter-wheat'],
  },
  {
    slug: 'field-assistant',
    name: 'Field decision assistant',
    category: 'operate',
    order: 5,
    tagline: 'A recommendation, not another image folder',
    summary: 'The assistant reads every layer for a field and answers in plain language: what is wrong, where, and by when.',
    problem:
      'More sensing produces more imagery, and imagery is not a decision. A folder of index maps and a change layer still leaves somebody to work out whether the yellow patch in the north west matters this week, and what to do about it before Thursday.',
    steps: [
      { title: 'Read', text: 'Every layer for the field is read together: imagery, weather, soil, machine records and your own notes.' },
      { title: 'Reason', text: 'Findings are weighed against growth stage and forecast, so a flag in June is not treated like the same flag in April.' },
      { title: 'Recommend', text: 'You get a written recommendation naming the area, the likely cause, the action and the window.' },
      { title: 'Follow up', text: 'Every recommendation is tracked, and the next flight reports whether it worked.' },
    ],
    sensors: ['No flight of its own: it reasons over the whole field record'],
    outputs: ['Written recommendations per field', 'Priority order across the farm', 'Evidence links back to the source flight', 'Outcome tracking per recommendation'],
    cadence: 'After every flight, plus a weekly farm level brief.',
    readings: ['Open recommendations by priority', 'Recommendations acted on', 'Outcome after action', 'Average lead time on a window'],
    useCases: ['winter-wheat', 'maize', 'potatoes', 'vineyards', 'cooperatives'],
  },
]

export const featureCategories: Record<FeatureCategory, { label: string, blurb: string }> = {
  detect: { label: 'Detect', blurb: 'Sensing flights that find the problem while it is still small.' },
  act: { label: 'Act', blurb: 'Treatment that follows the map, so only the affected ground is touched.' },
  operate: { label: 'Operate', blurb: 'The service, the fleet and the reporting that keep it running.' },
}

export function featureBySlug(slug: string): FeatureContent | undefined {
  return features.find(f => f.slug === slug)
}

export function featuresByCategory(category: FeatureCategory): FeatureContent[] {
  return features.filter(f => f.category === category).sort((a, b) => a.order - b.order)
}

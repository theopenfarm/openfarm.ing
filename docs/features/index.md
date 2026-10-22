# Capabilities

Nineteen capabilities in three groups describe the intended jobs: what a route
would collect, how often, the expected outputs and the readings to retain.
These are development workflows, not a list of field-qualified services.

![Historical capabilities index, grouped into Detect, Act and Operate, showing the earlier 18-capability copy](/screenshots/features.webp)

This screenshot predates the nineteenth capability and the implementation-status
notice. It records an earlier interface, not the current catalog or evidence of
available field services. The marketing catalog is at
[openfarm.ing/features](https://openfarm.ing/features); the current software
status and remaining work are listed below.

Every page follows the same shape, ending with **Build it**: the parts list
with EU and US sources, and the in-house software that replaces the per-hectare
licence. The [build guide](/build/) covers the parts that are common to all of
them.

## Implementation status

The app currently provides catalog, farm/field records, booking, scheduling and
modelled demonstrations. A scheduled `Mission` is a record, not dispatch or
flight completion. The demonstration field, its figures and the herding
playground remain modelled; they are not customer observations or field proof.

The owned [shared drone library](https://github.com/stacksjs/drone) provides
planning, bounded simulations and dataset primitives. Its runtime, sensor,
estimator, control, authority and mission paths are being developed in-house.
ArduPilot and PX4 are optional drivers, not required replacements for that
work. Physical integrations remain receive-only and retain an independent
flight controller and RC authority. See the [flight-stack boundary](/build/software/flight-stack).

The [all-capability roadmap](https://github.com/theopenfarm/openfarm.ing/issues/2)
tracks normal operation, loss/failure behavior, evidence and measurable
completion for every entry below. Shared [planning preview #37](https://github.com/stacksjs/drone/issues/37)
is the first integration slice: explicit declared farm/field scope and metric
configuration produce a plan, not measurements, authenticated ownership or an
operational Mission. [Synthetic collection preview #38](https://github.com/stacksjs/drone/issues/38)
is also implemented in the shared library, with retained raw datasets and explicit
synthetic outcomes. Neither preview establishes field coverage, crop
condition, disease diagnosis, treatment, physical flight or service availability.
Authenticated app integration and hardware/field qualification have their own gates.

| Capability | Current software and remaining work | Roadmap |
|---|---|---|
| [Automated field mapping](/features/field-mapping) | Survey planning and synthetic capture exist in the shared library. Orthophoto, DSM/DTM reconstruction and field accuracy remain to be implemented and qualified. | [#6](https://github.com/theopenfarm/openfarm.ing/issues/6) |
| [Flights as a service](/features/drone-service) | Booking, capability preferences and scheduled records exist. Operator dispatch, flight execution and processing-to-report integration remain pending. | [#7](https://github.com/theopenfarm/openfarm.ing/issues/7) |
| [Early disease detection](/features/plant-disease-detection) | Catalog and records exist. Shared synthetic red/NIR NDVI is not five-band surveillance or disease diagnosis; registered changes and scout confirmation remain pending. | [#8](https://github.com/theopenfarm/openfarm.ing/issues/8) |
| [Automated pest monitoring](/features/pest-monitoring) | Catalog and records exist. Repeated observations, pest attribution, reviewed thresholds and alerts remain pending. | [#9](https://github.com/theopenfarm/openfarm.ing/issues/9) |
| [Yield forecasting](/features/yield-forecasting) | Catalog and records exist. Deduplicated crop counts, calibrated uncertainty and harvest validation remain pending. | [#10](https://github.com/theopenfarm/openfarm.ing/issues/10) |
| [Wildlife detection before mowing](/features/wildlife-rescue) | Shared synthetic thermal search primitives exist. Field detection, crew confirmation and mower clearance remain pending. | [#11](https://github.com/theopenfarm/openfarm.ing/issues/11) |
| [Livestock and fence checks](/features/livestock-and-fences) | Herd records and shared explicit-observation primitives exist. Automatic identity, fence history and reviewed health observations remain pending. | [#12](https://github.com/theopenfarm/openfarm.ing/issues/12) |
| [Targeted weed control](/features/targeted-weed-control) | A modelled demonstration generates detections and coarse treatment zones. A qualified detector, machine-ready prescription and actual application comparison remain pending. | [#13](https://github.com/theopenfarm/openfarm.ing/issues/13) |
| [Precision fertilisation](/features/precision-fertilisation) | Shared ground water/inert-granule application simulations exist. Crop nutrient decisions, terminal integration and actual application evidence remain pending. | [#14](https://github.com/theopenfarm/openfarm.ing/issues/14) |
| [Soil compaction detection](/features/soil-compaction) | Catalog and records exist. Machine-traffic registration, repeated crop analysis and ground confirmation remain pending. | [#15](https://github.com/theopenfarm/openfarm.ing/issues/15) |
| [Drone seeding](/features/drone-seeding) | Catalog and records exist. Aerial hopper control, calibrated swaths, actual application feedback and establishment checks remain pending. | [#16](https://github.com/theopenfarm/openfarm.ing/issues/16) |
| [Automated livestock herding](/features/automated-herding) | Route approval, welfare-envelope logic and a modelled-animal playground exist. Fresh real tracks, metric vehicle integration and physical welfare qualification remain pending. | [#17](https://github.com/theopenfarm/openfarm.ing/issues/17) |
| [Irrigation analysis](/features/irrigation-analysis) | Catalog and records exist. Radiometric canopy analysis, environmental references and reviewed irrigation anomalies remain pending. | [#18](https://github.com/theopenfarm/openfarm.ing/issues/18) |
| [Frost protection](/features/frost-protection) | Catalog and records exist. Calibrated crop-height temperatures, forecast integration and observed warning outcomes remain pending. | [#19](https://github.com/theopenfarm/openfarm.ing/issues/19) |
| [Pollination support](/features/pollination-support) | Catalog and records exist. Indoor positioning, controlled airflow and reference-row fruit-set evidence remain pending. | [#20](https://github.com/theopenfarm/openfarm.ing/issues/20) |
| [Autonomous drone network](/features/autonomous-network) | The scheduler creates scheduled records. Shared docking/charging models are simulations; physical dock, fleet and launch integration remain pending. | [#21](https://github.com/theopenfarm/openfarm.ing/issues/21) |
| [Autonomous bird deterrence](/features/bird-deterrence) | Catalog and records exist. Flock detection, approved dispatch, speaker control and pressure/damage evaluation remain pending. | [#22](https://github.com/theopenfarm/openfarm.ing/issues/22) |
| [Sustainability reporting](/features/sustainability-dashboard) | Dashboard records exist. Source-linked actual input/water ledgers and reconciled reporting remain pending; simulated values are not farm totals. | [#23](https://github.com/theopenfarm/openfarm.ing/issues/23) |
| [Field decision assistant](/features/field-assistant) | Catalog and records exist. Evidence-backed recommendations, review and outcome tracking remain pending; statistical anomalies are not diagnoses. | [#24](https://github.com/theopenfarm/openfarm.ing/issues/24) |

The sections below describe intended workflows and payloads. Available software
and required completion evidence are distinguished in the table above.

## Detect

Sensing flights that find the problem while it is still small.

| Capability | Does | Normal cadence |
|---|---|---|
| [Early disease detection](/features/plant-disease-detection) | Multispectral imaging picks up stress and infection days before it is visible from the cab | Weekly through the main growth stages |
| [Automated pest monitoring](/features/pest-monitoring) | Regular flights check for pest damage and mark the affected areas | Every three to seven days in the risk window |
| [Irrigation analysis](/features/irrigation-analysis) | Thermal imaging exposes dry patches, leaks and uneven coverage | Fortnightly through the irrigation season |
| [Yield forecasting](/features/yield-forecasting) | Counts plants, fruit or ears and turns counts into a per-zone estimate | Establishment, then two or three times through fill |
| [Automated field mapping](/features/field-mapping) | One flight produces elevation, drainage, headlands and problem ground | Once per field, refreshed after drainage work |
| [Wildlife detection before mowing](/features/wildlife-rescue) | Thermal search for fawns, hares and ground nesting birds ahead of the mower | Every first cut |
| [Soil compaction detection](/features/soil-compaction) | Growth patterns over recorded machine traffic show where the soil has closed up | Once or twice per season, at peak biomass |

## Act

Treatment that follows the map, so only the affected ground is touched.

| Capability | Does | Normal cadence |
|---|---|---|
| [Targeted weed control](/features/targeted-weed-control) | Finds weeds plant by plant, treats only the affected square metres | Two to four scouting flights per crop |
| [Precision fertilisation](/features/precision-fertilisation) | Works out which parts are under-supplied and builds a variable rate map | Before each split application |
| [Drone seeding](/features/drone-seeding) | Broadcasts seed onto ground too steep, wet or awkward for a machine | On demand |
| [Frost protection](/features/frost-protection) | Measures temperature across a block and names tonight's cold pockets | Every clear night in the risk window |
| [Pollination support](/features/pollination-support) | Assists pollination indoors and where pollinator activity is short | Daily through flowering |
| [Autonomous bird deterrence](/features/bird-deterrence) | Clears birds on demand instead of a permanent noise source | Triggered by detection, not a timer |
| [Automated livestock herding](/features/automated-herding) | Walks a mob between grazing blocks on a route you approved | Whenever the rotation is due |

## Operate

The service, the fleet and the reporting that keep it running.

| Capability | Does | Normal cadence |
|---|---|---|
| [Flights as a service](/features/drone-service) | You book a schedule, we own the drones, the pilots and the paperwork | Set once per crop |
| [Autonomous drone network](/features/autonomous-network) | Drones launch from docks on their own schedule and dock again | Daily, weather permitting |
| [Livestock and fence checks](/features/livestock-and-fences) | Walks the fence line, counts the herd, flags animals that need a decision | Daily or twice daily in the grazing season |
| [Sustainability reporting](/features/sustainability-dashboard) | Flight, weather, soil and machine records become the figures buyers ask for | Continuous |
| [Field decision assistant](/features/field-assistant) | Reads every layer and answers in plain language: what, where, by when | After every flight |

## What flies what

Payloads, not aircraft. One airframe carries several of these; the payload is
what changes.

| Payload | Capabilities |
|---|---|
| High resolution RGB | Weed control, field mapping, yield forecasting, pest monitoring, compaction, bird deterrence |
| Five band multispectral | Disease, fertilisation, pest monitoring, compaction, yield forecasting |
| Radiometric thermal | Irrigation, wildlife, frost, livestock |
| LiDAR | Field mapping on wooded or tall canopy blocks, canopy height for weed control |
| Hopper | Seeding |
| Airflow | Pollination |
| None | Sustainability reporting and the field assistant, which consume other capabilities' output |

Two capabilities declare no payload of their own. That is deliberate and worth
preserving: they reason over the record rather than adding a flight.

## Which one to start with

The first two shared-library slices are implemented. Start with their explicit
CLI declarations, then qualify the remaining app and hardware integrations:

1. [Planning preview #37](https://github.com/stacksjs/drone/issues/37), with explicit metric configuration and declared farm/field scope. A plan is not a flight or a measurement.
2. [Synthetic collection preview #38](https://github.com/stacksjs/drone/issues/38), retaining source hashes and simulation flags. Authenticated app integration remains separate.
3. [Authenticated app integration](https://github.com/theopenfarm/openfarm.ing/issues/3), with farm/field authorization and a pinned CLI. A scheduled app record does not dispatch an aircraft.
4. Actual collection and reconstruction, each with its own input integrity, calibration, accuracy and physical-operation gates.
5. The capability-specific normal, failure and evidence paths in the [roadmap](https://github.com/theopenfarm/openfarm.ing/issues/2), including ground confirmation where a measurement informs a treatment or an animal-welfare decision.

Do not scale a demonstration into field evidence or mark an operational record
completed because its planning or simulation step succeeded.

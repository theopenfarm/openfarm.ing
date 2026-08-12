# Capabilities

Eighteen capabilities in three groups. A capability is a job the platform does:
what it flies, how often, what it hands back, and what the dashboard can
measure about it afterwards.

Every page follows the same shape, ending with **Build it**: the parts list
with EU and US sources, and the in-house software that replaces the per-hectare
licence. The [build guide](/build/) covers the parts that are common to all of
them.

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

If you are building this rather than buying it, the order that gets a working
system fastest is:

1. [Automated field mapping](/features/field-mapping). It is the base layer
   everything else sits on, the payload is one ordinary camera, and the whole
   pipeline is open source. Nothing else works properly without it.
2. [Wildlife detection before mowing](/features/wildlife-rescue). The cheapest
   payload, the clearest legal footing, an obvious buyer, and the flight is
   short.
3. [Targeted weed control](/features/targeted-weed-control). The one with the
   money in it, and the one that needs a real model and a real prescription
   exporter. Do it third, not first.

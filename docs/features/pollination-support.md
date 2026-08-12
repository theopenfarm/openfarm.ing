# Pollination support

> Cover the gap when the bees cannot

Small drones assist pollination indoors and in blocks where natural pollinator
activity is short.

| | |
|---|---|
| Category | Act |
| Slug | `pollination-support` |
| Cadence | Daily through the flowering window |
| Payload | RGB camera for bloom staging, airflow control, indoor positioning for glasshouse work |
| Needs a visit first | Yes. Indoor aircraft and a house survey come first |

## The problem

Glasshouse crops and early flowering orchards need pollination at a moment that
does not always line up with pollinator activity. Cold, wet or windy flowering
weather keeps bees in, hired hives are expensive and cannot be timed precisely,
and a missed window shows up directly in fruit set.

## How it works

| Step | What happens |
|---|---|
| Time | Flowering is tracked from imagery so the assist runs on the days that actually matter |
| Fly slow | A light drone works the rows at canopy height on a repeatable path |
| Assist | Controlled airflow moves pollen within the canopy without stripping or bruising the flowers |
| Check | Fruit set is counted afterwards and compared against untreated reference rows |

## What you get

- Bloom stage timeline
- Assist coverage log
- Fruit set count against reference rows
- Hive supplement recommendation

## What the dashboard measures

- Rows covered per session
- Bloom stage distribution
- Fruit set against reference rows
- Days of poor natural pollinator weather covered

## Where it matters most

[Glasshouses](/use-cases/protected#glasshouses-and-protected-crops),
[orchards](/use-cases/permanent#orchards),
[berries](/use-cases/permanent#soft-fruit-and-berries).

## Build it

Be honest about the state of the evidence here. Airflow-assisted pollination
works reliably for **wind-tolerant self-pollinating crops** grown indoors,
tomatoes above all, where the alternative is a person with a vibrating wand or
a bumblebee hive. Cross-pollination of an orchard by drone is an active
research area, not a settled product. Sell the first, trial the second, and do
not blur them.

The measured deliverable is the same either way: fruit set counted against
untreated reference rows, in the customer's own house or block. Build the
counting before the flying.

### The hard part is indoors, and it is positioning

There is no GNSS inside a glasshouse. The aircraft has to know where it is from
something else.

| Approach | Cost | Notes |
|---|---|---|
| Visual-inertial odometry | Low | Works, drifts, needs texture. Rows of identical plants are the worst case for it |
| UWB anchors | €1,000 to €3,000 per house | Four to eight anchors, centimetre-class, the pragmatic answer |
| Wire or rail guidance | Low | Not a drone any more, and often the right answer for a house with fixed rows |
| Reflective markers plus a downward camera | Very low | Markers on the gantry rails, read at 30 Hz. Cheap and robust |

Start with markers. A glasshouse is a structured, unchanging environment, which
makes fiducial markers far more reliable than they would be outdoors.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Small indoor airframe, under 1 kg | Prop guards, low downwash, safe near people and glass | [Holybro X250 class](https://holybro.com), or a [Crazyflie](https://www.bitcraze.io) for prototyping | [GetFPV](https://www.getfpv.com) | €200 to €900 |
| UWB positioning | Repeatable paths without GNSS | [Qorvo DWM3000 modules](https://eu.mouser.com) | [Mouser](https://www.mouser.com) | €25 per anchor |
| Alternative | Visual positioning module | [Luxonis OAK-D Lite](https://shop.luxonis.com) | same | €150 to €250 |
| RGB camera for bloom staging | The timing decision | any CSI camera, [Raspberry Pi Camera 3](https://www.raspberrypi.com/products/camera-module-3/) | [Adafruit](https://www.adafruit.com) | €30 |
| Compute | Positioning and bloom detection on board | [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) at [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com) | €80 to €120 |
| Fiducial markers | The cheap positioning fallback | printed AprilTags | same | paper |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Bloom staging | A small classifier over row imagery, or colour and shape heuristics for tomato trusses | own code | manual scouting |
| Path repeatability | Fixed waypoints in house coordinates, flown identically each session | own code | |
| Fiducial tracking | AprilTag or ArUco through OpenCV | BSD | commercial indoor positioning |
| Fruit set counting | Same counting stack as [yield forecasting](/features/yield-forecasting) | own code | |
| Trial design | Treated rows and reference rows assigned and tracked, so the claim is measurable | this repo | |

The trial design row is the important one. This capability lives or dies on
whether the customer's own fruit set numbers improve, so build the comparison
into the product rather than reporting an activity log.

### Cost efficiency

- **Cheapest useful version: no flying at all.** Bloom staging from imagery
  tells a grower which days matter and when to bring hives in. That is a real
  product on its own, and it is a camera and a model.
- **One house, one aircraft, permanently.** Do not move indoor aircraft between
  sites: the positioning setup is per house and the transport risk is high for
  a small airframe.
- **Compare against the actual alternative.** Bumblebee hives cost real money
  per house per cycle, and a wand operator costs labour hours. Those are the
  numbers this competes with.

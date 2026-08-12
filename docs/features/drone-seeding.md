# Drone seeding

> Sow where the drill cannot go

Drones broadcast seed and seed pods onto ground that is too steep, too wet or
too awkward for a machine.

| | |
|---|---|
| Category | Act |
| Slug | `drone-seeding` |
| Cadence | On demand, mostly cover crop establishment and repair work |
| Payload | Metering hopper with flow feedback, RTK, downward radar for height hold |
| Needs a visit first | Yes. The hopper aircraft has to be on site |

## The problem

Cover crops go in late because the drill cannot get on wet stubble. Steep
banks, wet hollows and awkward corners are either skipped or damaged by a
machine that should not have been there. Reseeding a washed out patch means
bringing a drill back for half a hectare.

## How it works

| Step | What happens |
|---|---|
| Plan | The target area comes from a boundary you draw or from the gap map produced by an earlier flight |
| Load | The hopper is filled with seed or coated pods and calibrated for the rate you want |
| Broadcast | The drone flies the pattern at a fixed height and speed, holding the rate across the whole area |
| Verify | An establishment flight two to three weeks later counts what actually came up |

Seed is not a plant protection product, so the §18 prohibition that shapes
[targeted weed control](/features/targeted-weed-control) does not apply here.
Aviation rules still do, and a loaded hopper aircraft is usually over 25 kg,
which puts the flight in the Specific category. See
[Regulation](/build/regulation).

## What you get

- As applied coverage map
- Rate achieved against rate planned
- Establishment count
- Reseeding list for the gaps

## What the dashboard measures

- Area covered per flight
- Seed applied per hectare
- Establishment rate at the check flight
- Area unreachable by machine

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley) cover crops,
[grassland](/use-cases/livestock#grassland-and-silage),
[reforestation](/use-cases/operators#reforestation-and-land-restoration),
[organic farms](/use-cases/arable#organic-farms),
[contractors](/use-cases/operators#agricultural-contractors).

## Build it

The only capability in the catalog that needs a genuinely different aircraft.
Everything else is a camera on a scouting airframe; this one carries mass.

### The mass problem, honestly

| Seed rate | 20 ha at that rate | What that means |
|---|---|---|
| 10 kg/ha, fine grass seed | 200 kg | 20 sorties with a 10 kg hopper |
| 25 kg/ha, mixed cover crop | 500 kg | 50 sorties, or a bigger aircraft |
| 200 kg/ha, cereal | 4,000 kg | Not a drone job. Use the drill |

Drone seeding wins on **inaccessible** ground and on **small awkward areas**,
not on hectares. Price it per site visit and per hectare of difficult ground,
not against a drill's day rate, and be blunt with customers who have done the
arithmetic differently.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Heavy lift airframe, 10 to 25 kg payload | The hopper and its contents | [Foxtech](https://www.foxtechfpv.com) frames, [Tarot X8](https://www.tarotrc.com) | [Foxtech](https://www.foxtechfpv.com) | €1,500 to €6,000 |
| Turnkey alternative | Agras spreading system, already certified and supported | [DJI Agras T25 / T50](https://ag.dji.com/t50) via [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €12,000 to €30,000 |
| Metering hopper | Rate control is the whole capability | [Foxtech seeder](https://www.foxtechfpv.com), or fabricate with a stepper-driven auger | [RobotShop](https://www.robotshop.com) for motors | €600 to €3,000 |
| Flow feedback | So "as applied" is a measurement and not a plan | Load cell under the hopper, [HX711 amplifier](https://www.mouser.de) | [SparkFun](https://www.sparkfun.com) | €20 |
| Radar height hold | Holds the release height over a slope, which is what holds the rate | [Ainstein US-D1](https://ainstein.ai) or [LightWare](https://lightwarelidar.com) | [RobotShop](https://www.robotshop.com) | €200 to €600 |
| Batteries, 12S high capacity | Heavy lift is a battery problem before it is anything else | [Tattu](https://genstattu.com) via [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €300 to €700 each |
| Fast charger, generator | Turnaround decides hectares per day | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €500 to €2,000 |

The honest recommendation: buy the turnkey agricultural aircraft for this one.
A DIY heavy lifter carrying 20 kg over a slope with people nearby is a
different risk class from a 4 kg scouting drone, and the certified aircraft
comes with a spread pattern somebody else has already characterised.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Target area | Draw a polygon, or take the gap map from [yield forecasting](/features/yield-forecasting) | this repo | |
| Pattern planning | Swath width from the calibrated spread pattern, with overlap, following terrain | own code | vendor mission planners |
| Rate control | Closed loop: metering rate versus ground speed, corrected in flight | own code on the flight controller companion | |
| As applied | Log rate, position and height at 5 Hz, rasterise into a coverage map | own code | |
| Verification | An establishment count flight, compared against the as-applied map | this repo | |

Calibrate the spread pattern on the ground before the first job: fly at working
height over a line of collection trays, weigh each tray, and fit the
distribution. Everything about swath width and overlap comes from that curve.
Repeat it per seed type, because a coated clover pod and a fine grass seed do
not fly the same way.

### Cost efficiency

- **Rent, do not buy, until you have the hours.** A seeding aircraft is used a
  few weeks a year. Contractors and Maschinenringe are the natural owners.
- **The verification flight is a scouting flight.** It costs almost nothing to
  add and it is the only proof the job worked. Include it in the price.
- **Coated pods cost more per hectare and establish better on hard ground.**
  Have the comparison ready, because customers will ask and the answer is site
  specific.
- **Watch the batteries, not the airframe.** On heavy lift, battery cycle life
  is the dominant running cost. Log cycles per pack from day one.

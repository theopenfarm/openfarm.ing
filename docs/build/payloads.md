# Payloads

Everything that is not a camera: hoppers, spray systems, deterrents, gimbals
and the mounting that holds them.

## Mounting, which is not an afterthought

Every sensor payload needs the same four things, and getting them wrong costs
you image quality that no processing can recover.

| Requirement | How |
|---|---|
| Vibration isolation | Wire rope isolators or silicone dampers, tuned below the prop frequency. A rolling shutter and a resonating mount produce jelly, not measurements |
| Rigid to the GNSS antenna | The lever arm must not change in flight. Measure it once, keep it true |
| Repeatable | The payload must go back in the same place. Dowel pins, not eyeballing |
| Thermal | A sealed bay cooks a Jetson. Vent it, or heatsink to the frame |

A printed mount is fine for prototyping and marginal for production. Machined
aluminium or carbon plate, with a measured optical centre, is what a survey
payload deserves.

| Item | EU source | US source | Indicative |
|---|---|---|---|
| Wire rope isolators | [Mouser EU](https://eu.mouser.com) | [McMaster-Carr](https://www.mcmaster.com) | €10 to €40 each |
| Vibration damping plate | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €20 to €60 |
| Machined plate, custom | [Fractory](https://fractory.com), local shop | [SendCutSend](https://sendcutsend.com) | €40 to €200 |

## Gimbals

Needed for oblique work: [orchard fruit counting](/features/yield-forecasting),
[vineyard](/use-cases/permanent#vineyards) row imaging, and
[livestock](/features/livestock-and-fences) inspection with a zoom camera.

Not needed for nadir survey work, where a fixed downward mount with good
isolation is more rigid, lighter and cheaper, and keeps the lever arm constant.

| Option | EU source | US source | Indicative |
|---|---|---|---|
| Fixed 45 degree mount | fabricate | fabricate | €30 |
| [Gremsy](https://gremsy.com) 3-axis | [Gremsy resellers](https://gremsy.com) | [GetFPV](https://www.getfpv.com) | €700 to €2,500 |
| Light 2-axis for small cameras | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €150 to €500 |

## Hoppers, for seeding

See [drone seeding](/features/drone-seeding) for the capability and the mass
arithmetic that decides whether it makes sense at all.

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Metering hopper, 10 to 25 L | Rate control is the capability | [Foxtech](https://www.foxtechfpv.com) | [Foxtech](https://www.foxtechfpv.com) | €600 to €3,000 |
| Turnkey spreading system | Already characterised and supported | [DJI Agras](https://ag.dji.com/t50) via [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €12,000 to €30,000 |
| Load cell plus [HX711](https://eu.mouser.com) | Turns "as planned" into "as applied" | [Mouser EU](https://eu.mouser.com) | [SparkFun](https://www.sparkfun.com) | €20 |
| Stepper or brushless auger drive | Rate proportional to ground speed | [Igus](https://www.igus.eu), [Nanotec](https://en.nanotec.com) | [ServoCity](https://www.servocity.com) | €80 to €300 |
| Radar altimeter | Constant release height over a slope holds the rate | [Ainstein US-D1](https://ainstein.ai) | [RobotShop](https://www.robotshop.com) | €200 to €600 |

### Calibrating the spread pattern

Before the first paid job, and again for every seed type:

1. Lay a line of collection trays across the flight path at working height.
2. Fly a single pass at working speed.
3. Weigh each tray.
4. Fit the distribution. That curve gives you the effective swath and the
   overlap you need.

A coated clover pod and a fine grass seed do not fly the same way, and neither
matches the manufacturer's figure.

## Spray systems

**Read this before buying one.** In Germany and most of the EU, aerial
application of plant protection products is prohibited by default under
Pflanzenschutzgesetz §18, with narrow exemptions, most prominently steep
vineyard terrain. Beyond the flight permission, the **equipment itself** is
regulated: application devices are subject to approval and inspection
requirements, and the German authorities maintain lists of approved and
drift-reducing equipment. A drone spray rig is not exempt from that regime
because it flies.

The consequence for a build: do not buy a spray aircraft speculatively. Buy it
against a specific customer with a specific exemption and equipment that is
recognised for the purpose.

Where it is permitted, the aircraft is a turnkey agricultural machine, not a
build project: [DJI Agras T25/T50](https://ag.dji.com/t50) and comparable
platforms from other manufacturers. The nozzles are the interesting part, and
they are the same TeeJet-class components a ground sprayer uses.

| Item | Source | Note |
|---|---|---|
| Nozzles | [TeeJet](https://www.teejet.com), [Lechler](https://www.lechler.com) | Drift reduction class matters legally, not just agronomically |
| Flow meter | [Lechler](https://www.lechler.com), industrial suppliers | As-applied recording |
| Turnkey aircraft | [Solectric](https://www.solectric.de) (EU), [Advexure](https://advexure.com) (US) | Support and training included |

## Deterrent payloads

For [bird deterrence](/features/bird-deterrence). The design constraint is
**unpredictability**, since birds habituate to anything regular.

| Payload | Notes | Indicative |
|---|---|---|
| Directional speaker | Vary the call, the interval and the direction. Log the sound pressure: the neighbours are part of the sale | €80 to €400 |
| Silhouette or kite | Passive, light, surprisingly effective when it moves irregularly | €30 |
| Strobe | Effective at dusk, useless at midday | €40 |

Check the local nature protection and hunting rules first. Protected species,
breeding seasons and permitted deterrent methods vary by German state.

## Lights

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Green flashing anti-collision light | Required for night flight in the EU, which is when the [wildlife search](/features/wildlife-rescue) happens | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €30 to €80 |
| Spotlight | Confirming a thermal find visually | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €60 to €200 |

## Weight budget, class B aircraft

| Item | Mass |
|---|---|
| Camera and lens | 300 to 900 g |
| Mount and isolation | 100 to 250 g |
| Companion computer plus heatsink | 100 to 300 g |
| RTK receiver and antenna | 60 to 120 g |
| Rangefinder | 20 to 100 g |
| Cabling | 50 to 150 g |
| **Total** | **630 g to 1.8 kg** |

Every 500 g of payload costs roughly 10 to 15% of endurance on a 6 kg
multirotor. Weigh the payload before you promise a flight time.

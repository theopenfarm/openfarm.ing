# Wildlife detection before mowing

> Find the fawn before the mower does

Thermal drones search grassland ahead of the mower for fawns, hares and ground
nesting birds, and mark every find.

| | |
|---|---|
| Category | Detect |
| Slug | `wildlife-rescue` |
| Cadence | Every first cut, and any later cut on fields with known activity |
| Payload | Radiometric thermal, RGB spotlight camera for confirmation, RTK |
| Needs a visit first | Yes. A licence check comes before a first flight |

## The problem

Roe deer leave their fawns lying in tall grass, and a fawn's instinct is to
press flat rather than run. The first cut of silage every spring kills a large
number of them. In Germany the responsibility to take reasonable precautions
sits with the person doing the mowing, and walking a field with a line of
helpers rarely covers it in the time available.

## How it works

| Step | What happens |
|---|---|
| Fly at dawn | The search runs in the cool hours before mowing, when a warm body contrasts most strongly with the sward |
| Detect heat | The thermal camera picks out warm shapes and the model separates animals from stones, molehills and machinery |
| Mark | Every find is pinned to a coordinate and pushed live to the phone of the person on the ground |
| Clear | The animal is carried out or boxed, the point is closed off in the app, and the mower follows behind the cleared area |

## What you get

- Live find map on the ground crew's phone
- Search coverage record
- Signed off log per field
- Season summary for the hunting tenant

## What the dashboard measures

- Area searched per flight
- Finds per hectare
- Search completed before the mower started
- Coverage gaps flagged

The third one is the one that matters legally. A record showing the search
finished at 05:40 and the mower started at 06:15 is the evidence that
reasonable precautions were taken.

## Where it matters most

[Grassland and silage](/use-cases/livestock#grassland-and-silage),
[dairy and grazing](/use-cases/livestock#dairy-and-grazing-livestock),
[contractors](/use-cases/operators#agricultural-contractors),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

The best first capability to build: the cheapest payload, the clearest legal
footing, an obvious buyer, a short flight, and a customer who can tell
immediately whether it worked.

### The physics decides the schedule

Detection depends on the temperature difference between a 38 °C animal and the
sward around it. That difference collapses once the sun has been on the grass
for an hour.

| Window | Usable |
|---|---|
| 04:00 to 07:00, before direct sun | Yes. This is the whole operating window |
| Overcast all day | Sometimes, with a much higher false negative rate |
| After 09:00 in May sunshine | No. The grass canopy is warmer than the animal |

That is why this capability has a hard cadence and why a service selling it
needs enough aircraft to cover a morning's mowing, not a day's.

### Flight parameters

| Parameter | Value |
|---|---|
| Altitude | 40 to 60 m AGL for a 640 x 512 sensor with a 13 mm lens |
| Ground resolution | 4 to 8 cm/px thermal |
| Speed | 4 to 7 m/s |
| Overlap | 20% side is enough. This is a search, not a survey |
| Coverage | 8 to 15 ha per battery |

Night and twilight flight is permitted in the EU Open category with a green
flashing light, which this operation depends on. See
[Regulation](/build/regulation).

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Airframe, 2 to 4 kg | Small is fine. The payload is light | [Holybro X500 V2](https://holybro.com/products/x500-v2-kits) via [Drone Parts Center](https://www.drone-parts-center.com) | [GetFPV](https://www.getfpv.com) | €400 to €600 |
| Radiometric thermal, 640 x 512 | Resolution is what sets the altitude, and altitude sets the hectares per hour | [Workswell WIRIS](https://www.drone-thermal-camera.com), [InfiRay](https://www.infiray.com) modules | [FLIR Hadron 640R](https://www.flir.com/products/hadron-640r/), [FLIR Boson+](https://www.flir.com/products/boson-plus/) | €2,500 to €9,000 |
| Budget thermal, 320 x 256 | Halves the altitude, doubles the flights | [Xinfrared / InfiRay Tiny1-C](https://www.infiray.com) | [GroupGets FLIR Lepton 3.5](https://groupgets.com/products/flir-lepton-3-5) | €200 to €900 |
| RGB spotlight camera | Confirming a warm blob before somebody walks 300 m to it | any USB or CSI camera | same | €30 to €150 |
| Green anti-collision light | Required for night flight | [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €30 to €80 |
| LTE link | Live find map to the ground crew's phone | [Teltonika RUTX11](https://teltonika-networks.com/products/routers/rutx11) or a Quectel module | [SparkFun](https://www.sparkfun.com) | €150 to €250 |
| On-board compute | Detection in the air, so finds appear while the drone is still flying | [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) plus [AI Kit](https://www.raspberrypi.com/products/ai-kit/) at [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com), [Seeed](https://www.seeedstudio.com) | €120 to €200 |

Export control note: thermal cameras above certain frame rates and resolutions
are export controlled in the US and the EU. Buying a 640 x 512 core from a US
supplier into the EU is routine but paperwork exists. Buy the module from an EU
distributor if you would rather not deal with it.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Detection | A small YOLO-class or RT-DETR model on 16-bit thermal frames | Apache-2.0 | vendor "AI detection" upgrades |
| Simpler baseline | Adaptive threshold plus blob geometry and a persistence check | own code | |
| Live link | MQTT or WebSocket over LTE to a phone web page | BSD | proprietary ground station apps |
| Coverage proof | Rasterise the flown track with the sensor footprint, report gaps | own code | |
| Record | `Mission` plus `Detection` rows with `kind: 'wildlife'` | this repo | |

Start with the threshold baseline. On a cold sward at 05:00 a fawn is a
genuinely distinct blob, and a simple detector that runs on a Pi at 15 fps with
a human confirming each hit is more useful than a better model that produces
results after the mower has started. Add the learned model to cut false
positives from molehills, stones and fresh cow pats, which is where the
operator's time actually goes.

### Cost efficiency

- **This is the one capability where thermal resolution directly buys
  hectares.** With a lens matched to the array, a 640 x 512 core flies at twice
  the altitude of a 320 x 256 for the same ground resolution and covers twice
  the swath, so it searches roughly twice the area per battery. Given a
  two-hour window, that is the difference between two fields and four. If you
  will fly more than a few hundred hectares a season, the 640 pays for itself
  in one spring.
- **RTK is optional here.** You need to walk to a find, and ordinary GNSS at
  2 to 3 m is enough for that. Skip the RTK on a wildlife-only aircraft and
  spend it on the sensor.
- **No stitching, no photogrammetry, no GPU.** The whole pipeline is frames in,
  points out. This is why it is the cheapest capability to stand up.
- **Public funding exists.** Germany has run federal support programmes for
  fawn rescue drones through the BLE, and hunting associations and
  Maschinenringe often co-fund equipment. Check the current programme before
  buying: the terms change year to year, and some require the equipment to be
  available to a local association.
- **Sell it as a morning, not as a hectare.** The constraint is the two-hour
  window, so price the window.

# Frost protection

> Know which hollow will freeze tonight

Drones measure temperature across the block and identify the pockets that will
drop below the damage threshold first.

| | |
|---|---|
| Category | Act |
| Slug | `frost-protection` |
| Cadence | Through the frost risk window, on every clear night with a forecast minimum near the threshold |
| Payload | Radiometric thermal, calibrated air temperature probe at crop height, RTK |
| Needs a visit first | Yes. Protection equipment and a site profile come first |

## The problem

A radiation frost is not uniform. Cold air drains downhill and pools, so one
corner of an orchard can sit two or three degrees below the weather station on
the shed roof. Protection gets deployed on the station's reading, which means
either the whole block is protected at great cost or the wrong part of it is.

## How it works

| Step | What happens |
|---|---|
| Profile | Flights on clear cold nights build a temperature surface for the block at crop height |
| Predict | The recorded drainage pattern is combined with the forecast to name tonight's cold pockets before dusk |
| Warn | You get the pocket map and a lead time, so wind machines, candles or irrigation go where they will earn their cost |
| Verify | A flight during the event records what the treated and untreated areas actually did |

## What you get

- Cold pocket map for the block
- Overnight risk brief
- Event temperature record
- Damage assessment flight

## What the dashboard measures

- Temperature spread across the block
- Area below the damage threshold
- Lead time on the warning
- Minutes spent below threshold per pocket

## Where it matters most

[Vineyards](/use-cases/permanent#vineyards),
[orchards](/use-cases/permanent#orchards),
[berries](/use-cases/permanent#soft-fruit-and-berries).

## Build it

The insight that makes this capability cheap: **cold air drainage is
repeatable**. The same hollow fills on every clear still night. So the drone's
job is to characterise the site once, over a handful of nights, after which the
nightly product is mostly a forecast plus a fixed sensor network.

That is the opposite of how it is usually sold, and it is both cheaper for the
customer and better for you, because a nightly flight through April is a
staffing problem you do not want.

### The three-part build

| Part | What it does | When |
|---|---|---|
| Profiling flights | Thermal surface at crop height on 5 to 10 clear nights | Once, in the first season |
| Fixed sensor network | 6 to 15 loggers on the block, reporting every few minutes | Permanent |
| Nightly model | Forecast plus the site profile plus live loggers, producing the pocket map before dusk | Every risky night |

The drone builds the model. The loggers run it.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Radiometric thermal | The profiling flights | [Workswell](https://www.drone-thermal-camera.com) | [FLIR Boson+](https://www.flir.com/products/boson-plus/) | €3,000 to €10,000 |
| Calibrated air probe at crop height | Thermal reads surface temperature, and the damage threshold is an air temperature. This is what ties the two together | [Sensirion SHT45](https://eu.mouser.com) in a radiation shield | [Adafruit](https://www.adafruit.com) | €30 plus shield |
| Field loggers, LoRaWAN | The permanent network. Battery life in years, not weeks | [Dragino LSN50 / LHT65](https://www.dragino.com) via [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €40 to €90 each |
| LoRaWAN gateway | One per site, covers the whole block | [Dragino LPS8](https://www.dragino.com), [The Things Indoor Gateway](https://www.thethingsnetwork.org) | [RobotShop](https://www.robotshop.com) | €100 to €250 |
| Reference weather station | Wind speed and dew point decide whether protection will even work | [Davis Vantage Pro2](https://www.davisinstruments.com) | same | €700 to €1,200 |

A LoRaWAN network on a 10 hectare orchard costs under €1,500 all in and reports
every five minutes all season. No drone flight competes with that as a nightly
product.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Thermal processing | The same pipeline as [irrigation](/features/irrigation-analysis#in-house-software) | own code | |
| Cold air drainage | Flow accumulation over the DEM from [field mapping](/features/field-mapping), calibrated against the observed pockets | WhiteboxTools, MIT | |
| Site profile | A per-pixel offset surface: how many degrees below the reference station this spot sits, per wind and sky condition | own code | commercial frost services |
| Forecast ingest | DWD ICON-D2 from [opendata.dwd.de](https://opendata.dwd.de), free | own code | paid weather APIs |
| Nightly brief | Forecast minimum plus the offset surface, thresholded per crop and growth stage | own code | |
| Alerting | Push at a lead time the customer sets, typically 3 to 6 hours before the crossing | this repo | |

Dew point matters more than temperature for whether protection works at all:
overhead irrigation frost protection depends on the latent heat of fusion and
fails badly in dry air. Put the dew point in the brief.

### Cost efficiency

- **Sell the profile once and the briefs every season.** The flying is a
  one-off survey. The recurring product is software and €1,500 of loggers.
- **Free forecast data.** The DWD publishes ICON model output openly. There is
  no reason to pay per site for a forecast API.
- **Growth stage decides the threshold, not the calendar.** Damage temperature
  for a vine at bud swell and at green shoot differ by two degrees or more.
  Make the threshold a per-block, per-week setting, or the alerts will be wrong
  in exactly the fortnight they matter.
- **Do not promise protection.** The capability names the cold pockets and
  gives lead time. Whether candles, wind machines or water save the crop is the
  grower's equipment and the night's dew point.

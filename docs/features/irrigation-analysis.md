# Irrigation analysis

> Find the dry corner and the buried leak

Thermal imaging exposes dry patches, leaks and uneven coverage so water goes
where it is actually needed.

| | |
|---|---|
| Category | Detect |
| Slug | `irrigation-analysis` |
| Cadence | Fortnightly during the irrigation season, plus a check flight after any repair |
| Payload | Radiometric thermal, ambient temperature and humidity probe, RGB reference camera |
| Needs a visit first | No |

## The problem

Irrigation problems are invisible until the crop shows them, and by then the
water has already been wasted. A partially blocked nozzle, a slow leak in a
buried line, or a pivot that under-delivers on one arc can run for weeks while
the meter keeps counting.

## How it works

| Step | What happens |
|---|---|
| Fly warm | Thermal flights are timed for the hottest part of the day, when water stressed plants separate most clearly from watered ones |
| Normalise | Canopy temperature is corrected against air temperature and reference surfaces so readings compare across days |
| Locate | Cold anomalies point to leaks and pooling; hot anomalies point to under-delivery and stress |
| Route | Each anomaly becomes a marked point with coordinates you can walk or drive to directly |

## What you get

- Canopy temperature map
- Anomaly list with coordinates
- Coverage uniformity score
- Repair verification flight

## What the dashboard measures

- Canopy temperature spread
- Number of open anomalies
- Uniformity across the irrigated block
- Water applied per irrigated hectare

## Where it matters most

[Potatoes](/use-cases/arable#potatoes),
[berries](/use-cases/permanent#soft-fruit-and-berries),
[orchards](/use-cases/permanent#orchards),
[glasshouses](/use-cases/protected#glasshouses-and-protected-crops),
[vineyards](/use-cases/permanent#vineyards).

## Build it

The opposite flight to [wildlife detection](/features/wildlife-rescue): same
sensor class, opposite time of day, and the calibration matters far more.

### Radiometric, and what that word has to mean

A thermal camera that outputs a pretty colour image is useless here. You need
**radiometric** output: a temperature per pixel, in a file that preserves it.

| Requirement | Why |
|---|---|
| 16-bit radiometric TIFF or raw output | A JPEG of a palette has thrown the measurement away |
| Shutter-based non-uniformity correction | Sensor drift over a 25 minute flight is larger than the signal you are looking for |
| Known emissivity handling | Canopy, soil and water have different emissivities. Assume 0.98 for a full canopy and be explicit about it |
| Ambient temperature and humidity logged | Every normalisation needs them |

### Flight parameters

| Parameter | Value | Why |
|---|---|---|
| Time of day | 12:00 to 15:00 solar, clear sky | Maximum separation between stressed and unstressed |
| Wind | Under 4 m/s | Wind mixes the canopy boundary layer and flattens the signal |
| Altitude | 40 to 70 m AGL | 5 to 8 cm/px thermal |
| Warm-up | Camera powered 10 minutes before the first frame | A cold-start sensor drifts through the first half of the flight |
| References | A wet and a dry reference surface in frame, or a cross-calibrated ground probe | This is what makes two days comparable |

### The index that makes it comparable

Raw canopy temperature is not comparable across days. Use CWSI, the crop water
stress index:

```
CWSI = (T_canopy - T_wet) / (T_dry - T_wet)
```

`T_wet` is a fully transpiring reference and `T_dry` a non-transpiring one.
Either put physical references in the field (a wet cloth panel and a dry one)
or derive them statistically from the coldest and hottest canopy percentiles in
the block, which is cheaper and good enough for finding anomalies rather than
scheduling irrigation.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Radiometric thermal, 640 x 512 | Per-pixel temperature, not a palette | [Workswell WIRIS Pro / Agro](https://www.drone-thermal-camera.com) | [FLIR Hadron 640R](https://www.flir.com/products/hadron-640r/) | €4,000 to €12,000 |
| Integrated alternative | Thermal, RGB and RTK in one airframe | [DJI Mavic 3 Thermal](https://enterprise.dji.com/mavic-3-enterprise) via [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €4,000 to €6,500 |
| Budget core | Radiometric, 160 x 120 to 320 x 256 | [FLIR Lepton 3.5](https://groupgets.com/products/flir-lepton-3-5) | [GroupGets](https://groupgets.com) | €200 to €400 |
| Air temperature and humidity probe | Every normalisation step needs them | [Sensirion SHT45 breakout](https://www.mouser.de) | [Adafruit](https://www.adafruit.com) | €15 to €40 |
| Ground reference station | Continuous ambient logging at the block | [Davis Vantage Pro2](https://www.davisinstruments.com) | same | €700 to €1,200 |
| Reference panels | The wet and dry ends of CWSI | shade cloth and a wetted mat | same | under €50 |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Radiometric decode | Read the vendor's 16-bit format, apply emissivity and atmospheric correction | own code, ExifTool for metadata | FLIR Thermal Studio, vendor analysis suites |
| Drift correction | Fit and remove per-flight sensor drift using overlapping frames | own code | |
| Mosaic | Thermal mosaicking with RGB-guided alignment, since thermal frames have few features | ODM or OpenCV | per-hectare processing |
| CWSI | Arithmetic over the calibrated raster | numpy | |
| Anomaly extraction | Local statistics, then connected components, then classify cold versus hot | scikit-image, BSD | |
| Output | Points with coordinates, exported as GPX and as `Detection` rows with `kind: 'moisture'` | this repo | |

Thermal frames are hard to mosaic on their own: a uniform canopy at uniform
temperature has almost no features to match. Fly an RGB camera alongside,
solve the geometry from the RGB frames, and apply that solution to the thermal
ones. This is the single most useful trick in the whole thermal pipeline.

### Cost efficiency

- **Anomaly finding needs far less camera than irrigation scheduling.** A leak
  is several degrees different from its surroundings and a 320 x 256 core finds
  it. Charging a scheduling decision to a €400 sensor is where people come
  unstuck. Be clear which product you are selling.
- **Fly the pivot, not the farm.** The value is concentrated on irrigated
  blocks and their infrastructure. A 20 minute flight over one pivot answers
  the question.
- **Verification flights are the recurring revenue.** After a repair, one short
  flight proves it worked. That is a cheap flight to deliver and an easy one to
  justify.
- **Pair with the water meter.** Water applied per irrigated hectare comes from
  the meter, not the drone. Reading it into the same record is what turns four
  anomalies into a cost figure.

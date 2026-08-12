# Early disease detection

> See the infection before the eye can

Multispectral imaging picks up stress, fungal infection and nutrient shortfall
days before symptoms are visible from the cab.

| | |
|---|---|
| Category | Detect |
| Slug | `plant-disease-detection` |
| Cadence | Weekly through the main growth stages, tightening around high risk weather |
| Payload | Five band multispectral, downwelling light sensor, RGB reference camera |
| Needs a visit first | No |

## The problem

By the time a farmer sees a disease from the tractor seat, the infection has
usually been established for a week or more and the treatment window has
narrowed to a curative spray instead of a protective one. Walking the field
catches it earlier, but nobody has the hours to walk every hectare weekly.

## How it works

| Step | What happens |
|---|---|
| Capture | A multispectral camera records red edge and near infrared bands alongside visible light |
| Index | The bands are combined into vegetation indices that expose chlorophyll loss and cell structure damage |
| Compare | Each flight is compared against the field's own history, so a wet spring baseline does not read as disease |
| Flag | Divergent patches are ranked by severity and area, with a scouting route so you can ground truth the worst first |

The third step is the one that separates a working system from a demo. An
absolute NDVI threshold produces a map of soil type. A comparison against the
same field's own previous flight produces a map of what changed.

## What you get

- Index maps per flight
- Change layer against the previous flight
- Ranked scouting list
- Ground truth capture form

## What the dashboard measures

- Affected area per flight
- Change since the previous flight
- Severity distribution
- Days from flag to ground truth

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley),
[potatoes](/use-cases/arable#potatoes),
[vineyards](/use-cases/permanent#vineyards),
[orchards](/use-cases/permanent#orchards),
[hops](/use-cases/permanent#hops).

## Build it

### What "multispectral" has to mean

Five bands, radiometrically calibrated, with a downwelling light sensor. Anything
less does not survive contact with a season.

| Band | Centre | Used for |
|---|---|---|
| Blue | ~475 nm | Reference, water, some pigment work |
| Green | ~560 nm | Chlorophyll reference |
| Red | ~668 nm | Chlorophyll absorption |
| Red edge | ~717 nm | The band that carries early stress. This is the one you cannot do without |
| Near infrared | ~840 nm | Cell structure and biomass |

Indices worth computing: NDVI (saturates early, still expected by everyone),
NDRE (the workhorse for a closed canopy), CIred-edge, and MCARI/OSAVI for soil
background suppression.

### Calibration is not optional

Two flights a week apart under different cloud are not comparable unless you
correct for illumination. That means:

1. A **downwelling light sensor** on top of the aircraft, logging incident
   irradiance per band, per frame.
2. A **reflectance panel** imaged on the ground before and after every flight.
3. Vignetting and lens correction per band, from the camera's calibration data.

Skip these and your "change layer" is mostly a record of the weather.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Multispectral camera, calibrated | The whole capability | [MicaSense RedEdge-P](https://ageagle.com/drone-sensors/rededge-p-high-res-multispectral-camera/) via EU dealers | [AgEagle](https://ageagle.com), [Advexure](https://advexure.com) | €9,000 to €18,000 |
| Alternative | Six band, similar class | [Sentera 6X](https://sentera.com) | [Sentera](https://sentera.com) | €8,000 to €15,000 |
| Integrated aircraft | Cheapest route to a calibrated five band dataset if you are not building | [DJI Mavic 3 Multispectral](https://ag.dji.com/mavic-3-m) via [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €4,500 to €7,000 |
| Budget multispectral | Three separate single-band cameras, hand calibrated | [MAPIR Survey3W OCN and NIR](https://www.mapir.camera/collections/survey3) | [MAPIR](https://www.mapir.camera) | €400 to €700 each |
| Downwelling light sensor | Comparable flights across days | bundled with RedEdge-P and 6X | same | included |
| DIY light sensor | If you built the budget rig | [AS7265x spectral triad](https://www.sparkfun.com/products/15050) at [Mouser EU](https://eu.mouser.com) | [SparkFun](https://www.sparkfun.com/products/15050) | €70 |
| Reflectance panel | The reference every frame is scaled against | [MAPIR calibration target](https://www.mapir.camera/products/mapir-camera-reflectance-calibration-ground-target-package) | same | €150 to €400 |

The honest comparison: a DJI Mavic 3M is a calibrated five band system, in the
air, for less than the price of a bare RedEdge-P. It is the right answer for a
service business that wants to fly next month. Build the payload yourself when
you need a band the integrated systems do not offer, or when you are putting it
on a dock aircraft that has to fly unattended.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Radiometric calibration | Panel plus DLS correction, per band, from the vendor's model | own code, [micasense/imageprocessing](https://github.com/micasense/imageprocessing) as reference | Pix4Dfields, Agisoft radiometric workflow |
| Band alignment | Feature-based per-band registration, since the lenses are not coaxial | OpenCV, BSD | |
| Mosaic | ODM multispectral mode, or per-frame georeferencing when a mosaic is not needed | AGPL | per-hectare processing |
| Indices | rasterio and numpy. It is arithmetic | BSD | |
| Baseline and change | Per-field time series in COG plus a per-pixel z-score against the field's own history | own code | the entire "insights" tier of commercial platforms |
| Ranking | Connected components on the change layer, sorted by area times severity | scikit-image, BSD | |
| Scouting route | Nearest-neighbour over the ranked patches, exported as GPX | own code | |

The change detection is where the product is. Everything above it is
commodity. Store every flight as a Cloud Optimized GeoTIFF keyed by field and
date, and the "compare against the field's own history" step is a windowed
read, not a pipeline.

### Cost efficiency

- **Free satellite first, drone second.** Sentinel-2 gives you 10 m NDVI every
  five days for nothing from the [Copernicus Data
  Space](https://dataspace.copernicus.eu). It cannot see a disease pocket, but
  it can tell you which of 40 fields changed this week, which is how you decide
  where to send the drone. This single decision cuts flying hours more than any
  hardware choice.
- **Do not buy a thermal camera for disease.** It is tempting and it mostly
  measures water status. Spend the budget on calibration discipline instead.
- **One camera, many aircraft.** The multispectral payload is the expensive
  part and it is not flying most of the time. Design the mount so it moves
  between airframes in under five minutes.
- **Weather data is free.** The DWD publishes its open data, including model
  output, at [opendata.dwd.de](https://opendata.dwd.de). Infection period
  models for septoria, blight and mildew run on temperature, humidity and leaf
  wetness, and they are what tell you to tighten the cadence. There is no
  reason to pay for that input.

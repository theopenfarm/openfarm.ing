# Precision fertilisation

> Feed the rows that are short

The system works out which parts of the crop are under-supplied and builds a
variable rate map for the spreader.

| | |
|---|---|
| Category | Act |
| Slug | `precision-fertilisation` |
| Cadence | Before each split application, typically two to three times per season |
| Payload | Five band multispectral, downwelling light sensor, RTK |
| Needs a visit first | No |

## The problem

A flat application rate assumes the field is uniform. It is not. Headlands, old
field boundaries, sandy patches and wet hollows each take up nitrogen
differently, so a single rate simultaneously overfeeds the strong areas and
starves the weak ones. The overfed parts lodge and leach; the starved parts
cost yield.

## How it works

| Step | What happens |
|---|---|
| Measure | Multispectral flights produce a biomass and chlorophyll picture of the standing crop |
| Zone | The field is divided into management zones that follow the actual pattern, not a grid drawn on top of it |
| Prescribe | Each zone gets a rate derived from your target, your soil samples and the measured shortfall |
| Apply | The prescription exports to your spreader or applicator in the format your terminal expects |

## What you get

- Biomass and chlorophyll maps
- Management zone layer
- Variable rate prescription
- Applied versus planned report

## What the dashboard measures

- Total product planned versus flat rate
- Rate spread across zones
- Zone area distribution
- Uptake response after application

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley),
[maize](/use-cases/arable#maize),
[oilseed rape](/use-cases/arable#oilseed-rape),
[sugar beet](/use-cases/arable#sugar-beet),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

The payload is the same one
[disease detection](/features/plant-disease-detection#hardware) uses, so if you
have built that, the hardware is done. What this capability adds is the
agronomy and the export, and both live in software.

### Zoning, and why it is not clustering on one image

A management zone is a part of the field that behaves the same way **across
seasons**. A cluster on today's NDRE map is a part of the field that looks the
same today, which is not the same thing and will move every flight.

Build zones from stable inputs, then use today's imagery to set the rate inside
them.

| Input | Source | Cost |
|---|---|---|
| Elevation, slope, wetness index | Your own [field mapping](/features/field-mapping) flight, or the state's open 1 m DEM | Free once flown |
| Multi-year biomass | Sentinel-2 archive, five years, same growth stage | Free from [Copernicus](https://dataspace.copernicus.eu) |
| Soil texture and organic matter | The farm's own soil sampling, or EC mapping | Already paid for |
| Yield maps | The combine's own logs, if the farm has them | Free, and usually ignored |

Cluster on the stack of those, not on one flight. Three to five zones is what a
spreader can meaningfully act on; a twelve-zone map is a picture, not a
prescription.

### The rate calculation

This is agronomy, not machine learning, and it should be legible enough that an
adviser can argue with it.

```
rate(zone) = target_uptake(crop, stage)
           - measured_supply(zone)            # from the index, calibrated
           - soil_supply(zone)                # from sampling and mineralisation
           + losses(weather, timing)
```

Everything in it is a number somebody can point at. Record the coefficients
with the prescription, so an "applied versus planned" report can explain a
difference rather than just show one.

Legal constraint you cannot code around in Germany: the Düngeverordnung caps
the nitrogen you may apply and requires the planning documentation to support
it, with tighter limits in nitrate-designated red areas. Variable rate moves
nitrogen **within** a field's total; it does not raise the total. Build the cap
in as a hard constraint on the optimiser, and make the prescription's total the
number the farm has already planned.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Index maps | rasterio, numpy | BSD | |
| Zone delineation | k-means or fuzzy c-means over the stable stack, then smoothing and minimum-area merge | scikit-learn, BSD | vendor zoning modules |
| Rate model | Explicit balance equation with per-crop coefficients | own code | agronomy platform subscriptions |
| Constraint check | Düngeverordnung cap, and per-zone min and max the spreader can actually hold | own code | |
| Export | ISOXML TASKDATA with a `TZN` treatment zone grid, plus shapefile | GDAL, MIT | terminal vendor tooling |
| Reconciliation | Read the machine's as-applied log back in and compare | own code | |

The as-applied loop is the part that turns this from a map into evidence.
Terminals write logs in ISOXML (`TLG` files) or vendor formats; reading them
back is what feeds
[sustainability reporting](/features/sustainability-dashboard) and what makes
"applied versus planned" a real report.

See [Prescriptions](/build/software/prescriptions).

### Cost efficiency

- **No new hardware.** If disease detection is built, this is a software
  feature. Sell it as a separate capability, fly it on the same passes.
- **Satellite is often enough for zoning.** Zones come from multi-year
  patterns, and Sentinel-2 at 10 m has five years of history for free. Use the
  drone for the in-season rate, not for the zone boundaries.
- **The spreader is the resolution limit.** A twin-disc spreader has a spread
  pattern 24 to 36 m wide and takes seconds to change rate. Zones smaller than
  that are fiction. Match the zone size to the machine and say so on the map.
- **Do not build a fertiliser recommendation engine.** Advisers already exist,
  farms already have plans, and the liability is real. Build the measurement
  and the export, and let the plan come from whoever is accountable for it.

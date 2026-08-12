# Soil compaction detection

> Read the tramlines the crop is drawing for you

Growth patterns, imagery and machine data together show where heavy traffic has
closed the soil up.

| | |
|---|---|
| Category | Detect |
| Slug | `soil-compaction` |
| Cadence | Once or twice per season, best read at peak biomass |
| Payload | Multispectral, high resolution RGB, machine telemetry import |
| Needs a visit first | No |

## The problem

Compaction is invisible from the surface and expensive to find with a
penetrometer, so it usually gets diagnosed years late by a crop that keeps
underperforming in the same strips. Headlands, gateways and the lines a full
trailer took in a wet harvest are the usual suspects, but suspicion is not a
map.

## How it works

| Step | What happens |
|---|---|
| Overlay | Crop performance from multispectral flights is laid over the machine traffic your terminals recorded |
| Correlate | Persistent underperformance that follows traffic lines is separated from underperformance that follows soil type |
| Rank | Suspected areas are ranked by size and yield cost so the penetrometer goes to the worst first |
| Confirm | Your ground measurements are recorded against each area and close the loop on the model |

## What you get

- Suspected compaction map
- Ranked verification list
- Traffic intensity layer
- Remediation plan by area

## What the dashboard measures

- Suspected area as a share of the field
- Overlap with recorded traffic
- Yield gap inside suspected areas
- Areas confirmed on the ground

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley),
[sugar beet](/use-cases/arable#sugar-beet),
[potatoes](/use-cases/arable#potatoes),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

Sugar beet is the clearest case: a heavy crop moved by heavy machines, so last
year's lifting shows up in this year's stand.

## Build it

**No new hardware at all.** This capability is a data integration and a
correlation, running over imagery you already fly for
[fertilisation](/features/precision-fertilisation) and
[disease](/features/plant-disease-detection). It is the cheapest capability in
the catalog to add and one of the more defensible, because the customer's own
machine logs are half the evidence.

### The machine data problem

Getting traffic data out of a farm's terminals is the real work.

| Source | Format | Route in |
|---|---|---|
| ISOBUS task controller | ISOXML `TLG` log files on the terminal's USB stick | Parse directly. This is the open path |
| John Deere | Operations Center | Their developer API, with the customer's consent |
| CLAAS | Telematics | Their API |
| Trimble, Müller, Kverneland | Varies | ISOXML export is usually available |
| Nothing at all | | Fall back to inferring tramlines from the imagery itself |

The fallback is worth building first: tramlines and headland turns are visible
in the imagery, and a Hough transform over the vegetation index finds them
without any telemetry integration. That gets the capability working on farms
whose machine data you cannot reach, which is most of them.

### The correlation, and its honest limits

```
suspect(pixel) = persistent_underperformance(pixel)
               AND follows_traffic(pixel)
               AND NOT explained_by(soil_texture, elevation, wetness)
```

Every term is a raster. The third is what stops you selling a soil map as a
compaction map, and it needs the elevation model from
[field mapping](/features/field-mapping) plus whatever soil data the farm has.

Be explicit that the output is a **ranked list of places to put a
penetrometer**, not a diagnosis. Compaction is confirmed in the ground. The
value is that the farm tests 6 places instead of 60, and the confirmations feed
back as labels.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Multi-year performance | Per-field index stack, normalised per flight | rasterio BSD | |
| Traffic layer | ISOXML `TLG` parser, then rasterise the swaths with the machine's width | own code | telematics platform modules |
| Tramline inference | Hough transform over the index raster, no telemetry needed | OpenCV BSD | |
| Confounder removal | Regress out elevation, wetness index and soil texture | scikit-learn BSD | |
| Ranking | Connected components, scored by area times yield gap | scikit-image BSD | |
| Ground truth loop | Penetrometer readings recorded per area, closing the model | this repo | |

Writing an ISOXML `TLG` reader is a couple of days of work and it unlocks
[precision fertilisation's](/features/precision-fertilisation) as-applied
reconciliation and
[sustainability reporting](/features/sustainability-dashboard) at the same
time. It is the single highest-leverage parser in the platform. See
[Prescriptions](/build/software/prescriptions).

### Cost efficiency

- **Zero marginal hardware cost.** Sell it as an add-on to a fertilisation
  subscription, not as a flight.
- **Read it at peak biomass.** One flight at the right growth stage beats four
  at the wrong ones. For cereals that is flag leaf to early grain fill.
- **Use the free archive for the "persistent" part.** Five years of Sentinel-2
  at 10 m from [Copernicus](https://dataspace.copernicus.eu) establishes which
  strips underperform every year. The drone flight resolves what the satellite
  cannot: whether the pattern follows a wheel track or a soil boundary.
- **Sell the remediation plan, not the map.** Subsoiling costs real money per
  hectare and is damaging where it is not needed. "These 3.4 ha, to 35 cm,
  after harvest" is a decision. A red raster is not.

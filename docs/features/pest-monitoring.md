# Automated pest monitoring

> Standing patrol over every hectare

Regular flights check fields for pest damage and mark the affected areas on a
map you can act on.

| | |
|---|---|
| Category | Detect |
| Slug | `pest-monitoring` |
| Cadence | Every three to seven days during the risk window for your crop |
| Payload | RGB camera at 1 cm/px, multispectral camera, RTK |
| Needs a visit first | No |

## The problem

Pest scouting is sampling: a handful of spots per field, a few times a season,
and the rest is inference. Outbreaks that start in a corner get found when they
have already spread, and the response is a whole field treatment because the
actual extent was never mapped.

## How it works

| Step | What happens |
|---|---|
| Patrol | The same route is flown on a fixed schedule so every flight is comparable with the last |
| Detect | Feeding damage, lodging and canopy holes are picked out of the imagery and located to the square metre |
| Track | Each affected area gets an identity and is followed across flights, so growth or collapse is visible |
| Alert | When an area crosses the threshold you set, the alert lands on your phone with the map already drawn |

## What you get

- Damage map with tracked areas
- Threshold alerts
- Season timeline per area
- Scouting route export

## What the dashboard measures

- Affected area and its trend
- Number of tracked outbreaks
- Time from first detection to alert
- Share of field under threshold

## Where it matters most

[Maize](/use-cases/arable#maize),
[oilseed rape](/use-cases/arable#oilseed-rape),
[potatoes](/use-cases/arable#potatoes),
[berries](/use-cases/permanent#soft-fruit-and-berries),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

Oilseed rape in a German autumn is the clearest case: flea beetle damage is
concentrated, easy to miss, and the keep-or-redrill decision that follows is
one of the more expensive calls of the year.

## Build it

Hardware-wise this is
[targeted weed control](/features/targeted-weed-control#hardware) plus
[disease detection](/features/plant-disease-detection#hardware) on one
aircraft. The engineering that is specific to this capability is not the
sensor, it is the **tracking**.

### The part that is actually hard

A patch found on Monday and a patch found on Thursday have to be recognised as
the same patch, or the season timeline is meaningless and every flight looks
like a new outbreak.

| Step | Approach |
|---|---|
| Fix the route | Same waypoints, same altitude, same heading, every flight. The comparison is only as good as the repeatability |
| Georeference | RTK pose per frame, then project detections into field coordinates. Do not track in pixel space |
| Associate | Match this flight's polygons to the open track set by IoU, with a distance gate. Hungarian assignment on the cost matrix is enough |
| Age | A track not seen for N flights is closed. A new polygon with no match opens a track |
| Threshold | Alert on area, on growth rate, or on both. Make it a per-farm setting |

That is a few hundred lines of code with no model in it, and it is the
difference between "we detect pests" and "your outbreak in the north west
corner has trebled since Monday".

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Damage segmentation | A segmentation model (U-Net class, or SAM-assisted labelling then a small supervised model) | Apache-2.0 | vendor analytics tiers |
| Anomaly fallback | Per-field z-score on the change layer, no labels needed | own code | |
| Tracking | IoU association plus Hungarian assignment over georeferenced polygons | scipy, BSD | |
| Alerting | Threshold rules, then push through the notification stack | this repo | |
| Route export | GPX and KML for the scout's phone | GDAL, MIT | |

Start with the anomaly fallback. Species-level pest identification from 1 cm/px
imagery is genuinely hard and often not what the customer needs: "this 0.4 ha
patch is going backwards and it was not last week" sends somebody to look,
which is the entire job.

### Cost efficiency

- **Share the flight.** A pest patrol and a disease flight are the same flight
  with the same payload at the same altitude. Bill them as one flight and run
  both models over the frames. This is the biggest single saving available in
  the whole platform and it is a software decision, not a hardware one.
- **Fixed routes make cheap comparisons.** With a repeatable route you can
  compare frame to frame rather than mosaic to mosaic, which removes the
  photogrammetry step entirely from this capability.
- **Ground truth is your dataset.** Every time a scout walks to a flagged patch
  and reports what it was, that is a labelled example. Build the capture form
  into the scouting route from day one, or you will be labelling from scratch a
  year later.

# Permanent crops

Vines, trees and canes, where the same plants carry every decision forward.

## Vineyards

> Steep ground, tight rows, high value

Vigour mapping by row, downy and powdery mildew surveillance, frost pockets,
and the terrain where drone application is actually permitted.

**The challenge.** A vineyard is the same plants for thirty years, which makes
every uneven patch a compounding problem rather than a one-season one. Vigour
varies row by row and often vine by vine. Mildew pressure builds inside a
canopy that nobody can see into from outside. And on steep sites the machinery
that can legally treat the crop is limited by the slope itself, which is
precisely the terrain where the EU permits aerial application by exemption.

**The approach.** Row-resolution vigour mapping that reports per row and per
panel, not per block average. Disease surveillance timed to the infection
periods rather than a calendar. Frost profiling across the site through spring,
because cold air pooling in a vineyard is repeatable and therefore predictable.
On steep parcels where the exemption applies, application follows the same maps.

| Window | Focus |
|---|---|
| Bud break | Frost pocket profiling and the overnight risk brief on clear nights |
| Shoot growth | Vigour mapping by row for canopy management and pruning decisions |
| Flowering to bunch closure | Mildew surveillance timed to infection periods |
| Veraison | Water status by thermal imaging and the harvest sequencing map |
| Post harvest | Missing and declining vine census for replanting |

**Capabilities:** [disease](/features/plant-disease-detection),
[frost](/features/frost-protection),
[irrigation](/features/irrigation-analysis),
[field mapping](/features/field-mapping),
[weed control](/features/targeted-weed-control),
[assistant](/features/field-assistant).

**Outcomes.** Vigour reported per row and per panel, not as a block average.
Mildew surveillance tied to infection periods with dated evidence. Cold pockets
named before dusk rather than diagnosed after sunrise. Harvest sequencing built
from measured ripeness variation.

**Scale.** Parcels of 0.5 to 20 hectares, including slopes machinery cannot
work.

**Note on application.** Steep vineyard terrain is the clearest case in German
and EU law where aerial application of plant protection products may be
permitted by exemption. It is an exemption with conditions, not a general
permission, and the conditions include the equipment used. See
[Regulation](/build/regulation).

---

## Orchards

> Count the fruit, protect the blossom

Fruit counting for the pack house booking, blossom frost protection, tree by
tree health, and birds at ripening.

**The challenge.** An orchard's year turns on two short windows. A frost during
blossom can remove the crop in a single night, and protection is expensive
enough that it needs to go exactly where the cold actually collects. Then at
harvest, the pack house, the labour and the storage all need a number weeks
ahead, and that number traditionally comes from counting a few trees and
multiplying. Between those, individual trees decline, and a declining tree in
row 14 looks like every other tree from the end of the row.

**The approach.** Frost profiling through blossom, with a nightly brief when
the forecast is near the threshold. Fruit counting flights at set points after
fruit set, aggregated per row and per block. Tree by tree health tracking that
carries an identity across seasons, so decline is a trend rather than a
discovery.

| Window | Focus |
|---|---|
| Blossom | Frost pocket mapping and nightly risk briefs |
| Fruit set | Set counts against reference rows and the first crop estimate |
| Summer | Tree by tree health tracking, irrigation uniformity, canopy vigour |
| Pre harvest | Fruit counts per row, sizing estimate and picking sequence |
| Ripening | Bird pressure monitoring and on-demand deterrence |

**Capabilities:** [frost](/features/frost-protection),
[yield](/features/yield-forecasting),
[disease](/features/plant-disease-detection),
[irrigation](/features/irrigation-analysis),
[bird deterrence](/features/bird-deterrence),
[pollination](/features/pollination-support).

**Outcomes.** Frost protection deployed to mapped cold pockets. Pack house and
labour booked against counted fruit. Individual trees tracked across seasons
rather than sampled. Picking sequenced from measured ripeness by row.

**Scale.** Blocks of 1 to 40 hectares.

**Build note.** Tree identity is the piece to get right first. Give every tree
a stable id from an early photogrammetry pass, and every later flight attaches
to that id. Without it, "tree by tree" is a slogan.

---

## Soft fruit and berries

> High value per square metre, short windows

Picking forecasts for labour planning, irrigation uniformity under tunnels,
bird pressure and frost on early varieties.

**The challenge.** Soft fruit is the crop where a scheduling mistake costs the
most per hectare. Pickers are booked days ahead against a forecast, and a
forecast that is out by a quarter means either fruit left on the plant or a
crew standing idle. Under tunnels, irrigation problems compound quickly because
there is no rainfall to mask them. Birds take a meaningful share in the
fortnight before picking.

**The approach.** Frequent counting flights through ripening so the picking
forecast is updated rather than set once. Thermal irrigation checks on the
tunnel blocks, where a blocked line shows within days. Detection-triggered bird
deterrence rather than a permanent noise source next to a public road.

| Window | Focus |
|---|---|
| Early spring | Frost risk profiling on early varieties |
| Flowering | Pollination assist on poor weather days and fruit set counts |
| Green fruit | Irrigation uniformity under tunnels and canopy health |
| Ripening | Counting flights for the picking forecast and active bird deterrence |
| Between flushes | Plant health census and replacement planting list |

**Capabilities:** [yield](/features/yield-forecasting),
[irrigation](/features/irrigation-analysis),
[bird deterrence](/features/bird-deterrence),
[frost](/features/frost-protection),
[pollination](/features/pollination-support),
[pest](/features/pest-monitoring).

**Outcomes.** Picking crews booked against a forecast that updates through
ripening. Irrigation faults under tunnels found in days rather than weeks. Bird
response logged by block and hour instead of running continuously. Plant
replacement lists built from a census, not a walk.

**Scale.** Blocks of 0.5 to 15 hectares, open field and tunnels.

**Build note.** Tunnels block GNSS and rule out flying over the crop in the
usual way. Work the alleys, or use the fixed-camera approach from
[bird deterrence](/features/bird-deterrence) and
[pollination support](/features/pollination-support#the-hard-part-is-indoors-and-it-is-positioning)
for the covered blocks.

---

## Hops

> A wall of canopy you cannot see into

Downy mildew and spider mite surveillance from above, plus vigour mapping
across a trellis that hides everything at ground level.

**The challenge.** A hop yard in July is a seven metre wall of canopy. Walking
it tells you about the outside row and almost nothing about the middle of the
block. Downy mildew and spider mite both start in pockets, and both are far
cheaper to deal with early. The crop is high value, the treatment programme is
intensive, and the whole thing is applied on the assumption that the block is
uniform.

**The approach.** Overhead multispectral flights read the canopy the ground
crew cannot reach, on a cadence tight enough to catch a pocket while it is
still a pocket. Vigour mapping runs by row and by bine position. Findings are
ranked into a scouting route so the crew walks to the worst rows first rather
than sampling.

| Window | Focus |
|---|---|
| Training | Establishment and bine count per hill |
| Rapid growth | Vigour mapping by row and nitrogen zoning |
| Canopy closure | Mildew and mite surveillance on a tight cadence, ranked scouting routes |
| Cone development | Health surveillance and the yield estimate for the contract |
| Pre harvest | Picking sequence by block from measured maturity |

**Capabilities:** [disease](/features/plant-disease-detection),
[pest](/features/pest-monitoring),
[fertilisation](/features/precision-fertilisation),
[yield](/features/yield-forecasting),
[assistant](/features/field-assistant).

**Outcomes.** The middle of the block surveyed as often as the edge rows.
Scouting routed to ranked areas rather than sampled at random. Nitrogen zoned
to measured vigour by row. Contract volumes estimated from counted cones.

**Scale.** Yards of 2 to 50 hectares.

**Build note.** A hop trellis is a seven metre obstacle field with wires
overhead. Fly well above the trellis, never between rows, and treat the wire as
uncharted: it is close to invisible to both a pilot and an obstacle sensor.

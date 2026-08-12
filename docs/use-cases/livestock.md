# Grassland and livestock

Silage, grazing and the wildlife obligation that comes with a mower.

## Grassland and silage

> Search before the mower moves

Thermal fawn searches ahead of first cut, sward quality mapping, and reseeding
where the ground has gone back.

**The challenge.** First cut silage is the single most lethal operation of the
farming year for wildlife. Roe deer leave fawns lying in tall grass and a fawn
will press flat rather than run from a mower. In Germany the duty to take
reasonable precautions falls on whoever is doing the mowing, and a line of
volunteers walking a 12 hectare field before dawn is neither reliable nor
repeatable. Separately, sward quality drifts: patches go back to weed grasses
and nobody maps it until the analysis comes back poor.

**The approach.** A thermal search flown in the cool hours before the mower
starts, with finds pushed live to the phone of whoever is on the ground, and a
coverage record kept per field. Sward composition is mapped between cuts so
reseeding is targeted. Drone broadcast handles the wet hollows and steep banks
a machine should not be on.

| Window | Focus |
|---|---|
| Before first cut | Thermal wildlife search with live find marking and a coverage record |
| Between cuts | Sward quality and weed grass mapping |
| Later cuts | Repeat searches on fields with known activity, plus yield estimates per cut |
| Late summer | Overseeding of thin areas by drone where machinery cannot travel |
| Autumn | Drainage and wet area mapping for the winter works list |

**Capabilities:** [wildlife](/features/wildlife-rescue),
[field mapping](/features/field-mapping),
[seeding](/features/drone-seeding),
[yield](/features/yield-forecasting),
[livestock](/features/livestock-and-fences).

**Outcomes.** A search record per field, signed off before the mower starts.
Finds logged with coordinates and outcome. Reseeding targeted at mapped thin
areas. Cut yields estimated rather than counted off the clamp.

**Scale.** Fields of 2 to 40 hectares, flown at dawn.

**Why this is the best first market.** The window is two hours before sunrise,
the payload is one thermal camera, the pipeline is frames in and points out,
the legal footing is clear, and the customer knows within an hour whether it
worked. See [the build](/features/wildlife-rescue#build-it).

---

## Dairy and grazing livestock

> The outlying block, checked every morning

Daily head counts, fence line inspection and flagged animals, without the drive
to every outlying block.

**The challenge.** The blocks furthest from the yard get checked least, and
they are the ones where a fence going down matters most. A daily round of
outlying grazing is an hour of driving that finds nothing on most days. On the
days it would have found something, the delay between the event and the check
is the whole cost: an animal through a fence onto a road, or a cow down in a
corner since the previous evening.

**The approach.** A scheduled patrol per block, flown from a dock rather than
driven to. Head count against expected, fence line imagery, and thermal
signatures that separate an animal lying and ruminating from an animal lying
and not. Anything ambiguous goes to a person before it becomes an alert.

| Window | Focus |
|---|---|
| Turnout | Fence line survey of every block before stock go out |
| Grazing season | Daily patrols with head counts and flagged animal reports |
| Peak growth | Grass cover mapping for the grazing rotation |
| Autumn | Poaching and damage mapping for the reseeding plan |
| Housing | Fence and water point condition survey for the winter works list |

**Capabilities:** [livestock](/features/livestock-and-fences),
[wildlife](/features/wildlife-rescue),
[field mapping](/features/field-mapping),
[network](/features/autonomous-network),
[seeding](/features/drone-seeding).

**Outcomes.** Head count per block recorded daily against expected. Fence
faults reported the morning they appear. Flagged animals delivered with imagery
for a human decision. Grazing rotation planned from mapped cover.

**Scale.** Grazing platforms of 20 to 300 hectares, docks placed by battery
range.

**Build note.** This is the use case that justifies a
[dock](/features/autonomous-network), because its whole value is frequency
without a drive. It is also the use case that most needs the regulatory work
done properly: a daily patrol over grazing is usually beyond visual line of
sight. Start with the blocks the pilot can see from the yard, prove the
product, then do the authorisation.

## One aircraft, two seasons

The thermal payload that searches for fawns in May patrols the herd in
February. Same airframe, same camera, same time of day, opposite ends of the
calendar. For a livestock farm or a contractor, that is one purchase covering
both peaks, which is the single best hardware economics in the whole platform.

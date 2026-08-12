# Protected crops

Glass and plastic, where nothing is left to the weather.

## Glasshouses and protected crops

> Indoors, where the weather never helps

Pollination assist through flowering, canopy health by row, and irrigation
uniformity across a house with no rain to mask it.

**The challenge.** A glasshouse removes the weather and with it the
pollinators, the natural water and the margin for error. Hired hives are
expensive and cannot be timed to a specific week. Irrigation problems compound
within days because nothing else waters the crop. And because the crop is
uniform by design, a problem that starts in one row is easy to miss until it is
in twenty.

**The approach.** Small indoor aircraft on a fixed path per house. Pollination
assist runs through the flowering window on the days natural activity would be
poor. Canopy health is read row by row so an early divergence is visible while
it is still one row. Irrigation uniformity is checked on a schedule rather than
after a problem appears.

| Window | Focus |
|---|---|
| Planting | Row by row establishment record for the house |
| Flowering | Daily pollination assist and fruit set counts against reference rows |
| Production | Canopy health by row and irrigation uniformity checks |
| Peak picking | Counting flights for the picking and packing forecast |
| Crop change | End of cycle health census and a plan for the next planting |

**Capabilities:** [pollination](/features/pollination-support),
[irrigation](/features/irrigation-analysis),
[disease](/features/plant-disease-detection),
[yield](/features/yield-forecasting),
[assistant](/features/field-assistant).

**Outcomes.** Pollination covered on the days natural activity would not be.
Fruit set counted against untreated reference rows. Row level divergence caught
while it is still one row. Picking and packing planned against counted fruit.

**Scale.** Houses of 0.2 to 10 hectares under glass or plastic.

## What changes indoors

Everything about the build. This is the one segment where the outdoor platform
does not simply transfer.

| | Outdoors | Indoors |
|---|---|---|
| Positioning | RTK GNSS | No GNSS. Fiducial markers, UWB, or visual odometry. See [pollination support](/features/pollination-support#the-hard-part-is-indoors-and-it-is-positioning) |
| Regulation | EASA UAS rules | An enclosed structure is generally outside the aviation rules, but workplace safety law applies in full |
| People | Kept away | Working in the rows. Prop guards, low mass and a demonstrable safe stop are mandatory |
| Light | Sun, variable | Artificial and glass-filtered. Fixed white balance and a known light source make imagery far more comparable than outdoors |
| Wind | The main constraint | None, but ventilation fans and thermal screens move |
| Aircraft | 4 to 25 kg | Under 1 kg, ideally under 250 g for the safety case |

The one genuine advantage: **indoors is a controlled, unchanging environment**.
Markers stay where you put them, the light is constant, the rows do not move,
and a flight path flown identically every day makes change detection trivially
easy. Exploit that rather than porting the outdoor stack.

## The cheaper alternative to a drone, stated plainly

For a single house, a **gantry or rail-mounted camera** on the existing crop
wire or heating pipe rail does canopy health and counting better, cheaper and
more safely than any aircraft. Growers already have the rails. A trolley with a
camera and a Raspberry Pi costs a few hundred euros and runs continuously.

Fly indoors when the job needs to be **airborne**, which realistically means
pollination assist and reaching a canopy the rails do not serve. Everything
else in this segment is a fixed or rail-mounted sensor problem, and pretending
otherwise makes the quote worse and the product weaker.

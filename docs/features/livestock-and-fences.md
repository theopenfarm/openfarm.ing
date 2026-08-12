# Livestock and fence checks

> The daily round without the drive

Drones walk the fence line, count the herd and flag animals that are injured,
missing or lying unusually still.

| | |
|---|---|
| Category | Operate |
| Slug | `livestock-and-fences` |
| Cadence | Daily or twice daily through the grazing season |
| Payload | Radiometric thermal, zoom RGB camera, RTK |
| Needs a visit first | Yes. A licence check and a route survey come first |

## The problem

Checking outlying grazing means a drive, a gate, a walk and an hour, every day,
in all weather. Most days nothing is wrong. The days something is wrong, the
delay between the fence going down and somebody noticing is the whole problem.

## How it works

| Step | What happens |
|---|---|
| Patrol | A fixed route covers the fence line and the grazing block on a schedule |
| Count | Animals are counted and compared against the number the block should hold |
| Assess | Thermal and visual signatures flag animals that are separated, lame, or lying still when the herd is grazing |
| Report | A short summary lands after each patrol, with photographs of anything that needs a human decision |

## What you get

- Head count per block
- Fence condition log
- Flagged animal list with imagery
- Grazing pressure map

## What the dashboard measures

- Head count against expected
- Fence sections flagged
- Animals flagged per patrol
- Time from patrol to report

## Where it matters most

[Dairy and grazing](/use-cases/livestock#dairy-and-grazing-livestock),
[grassland](/use-cases/livestock#grassland-and-silage),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

This is the capability that most wants a
[dock](/features/autonomous-network), because its value is entirely in
frequency and in not driving. A daily patrol that somebody has to drive to is
the problem it was meant to solve.

### The regulatory shape decides the build

A patrol over grazing land is usually beyond visual line of sight, over
somebody's property, possibly near a road. In the EU that is the Specific
category, which means an operational authorisation or a standard scenario. It
is the reason this capability is marked
[needs a visit](/guide/dashboard#capabilities-that-need-a-visit) rather than
being switchable on. See [Regulation](/build/regulation).

Build the visual line of sight version first. A patrol flown from the yard over
blocks the pilot can see is legal today under the Open category with an A2
certificate, and it still removes the drive.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Airframe with 35+ minute endurance | Fence lines are long | [Holybro X500 V2](https://holybro.com/products/x500-v2-kits) or a fixed-wing VTOL for large platforms | [GetFPV](https://www.getfpv.com) | €500 to €4,000 |
| Zoom RGB camera | Reading a fence at 40 m and a tag at 15 m are different jobs | [Sony FCB block camera](https://pro.sony) modules | [B&H](https://www.bhphotovideo.com) | €600 to €2,500 |
| Thermal | Separates an animal ruminating from an animal in trouble, and finds one in a hedge | [InfiRay](https://www.infiray.com) module | [FLIR Boson](https://www.flir.com/products/boson/) | €900 to €4,000 |
| LTE link | The report has to leave the field | [Teltonika RUTX11](https://teltonika-networks.com/products/routers/rutx11) | [SparkFun](https://www.sparkfun.com) | €150 to €250 |
| Dock, if unattended | The whole point | See [docks](/build/docks) | | €3,000 DIY to €35,000 turnkey |
| Integrated alternative | Zoom, thermal, RTK, dock support, out of the box | [DJI Matrice 4T](https://enterprise.dji.com) via [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €9,000 to €15,000 |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Counting | Detection over nadir frames, deduplicated across overlap | Apache-2.0 models | commercial livestock counting |
| Behaviour flags | Posture and position heuristics first: separated from the herd, lying while the herd grazes, not moved between passes | own code | |
| Fence inspection | Change detection along the fence line against the previous patrol, on a fixed route | own code | |
| Escalation | Anything ambiguous goes to a human reviewer before it becomes an alert | this repo | |
| Report | One short summary per patrol with imagery attached | this repo | |

The escalation queue is not an admission of weakness, it is the product. A
false "your cow is down" at 06:00 costs the customer's trust permanently. Route
uncertain findings to a person and say so on the tin.

Fence inspection is genuinely hard from the air and works far better as a
change detector than as a classifier. A fixed route makes "this 8 m section
looks different from Tuesday" cheap and reliable, which is what a farmer
actually wants.

### Cost efficiency

- **Visual line of sight first, dock second, BVLOS third.** Each step multiplies
  the regulatory cost. Do not start at the end.
- **Counting is the anchor product.** Head count against expected is
  unambiguous, verifiable and immediately valuable. Behaviour flagging is the
  upsell.
- **Thermal earns its place in winter and at dawn.** In midday summer a black
  cow in sunlight is a thermal mess. Fly the patrol early.
- **Share the airframe with the wildlife search.** Same thermal payload, same
  time of day, different season for the peak. One aircraft covers both.

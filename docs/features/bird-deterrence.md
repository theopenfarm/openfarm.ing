# Autonomous bird deterrence

> Move the flock without living next to a gas gun

Drones clear birds from ripening crops on demand, instead of a permanent noise
source that birds learn to ignore.

| | |
|---|---|
| Category | Act |
| Slug | `bird-deterrence` |
| Cadence | On demand through ripening, triggered by detection rather than a timer |
| Payload | Fixed block cameras, on-board RGB camera, RTK |
| Needs a visit first | No, but the stations have to be installed |

## The problem

Fixed deterrents work for about a fortnight. Birds habituate to gas guns, kites
and tape, then feed underneath them while the neighbours are still listening to
the bangs. Damage in cherries, berries and ripening maize is concentrated in a
few weeks and a few blocks.

## How it works

| Step | What happens |
|---|---|
| Watch | Cameras on the block detect flock arrival rather than running a fixed schedule |
| Launch | A drone lifts from the nearest station and flies the approach the flock is actually using |
| Move on | The flock is pushed off the block on a varied path, so the pattern never becomes predictable |
| Log | Each response is recorded, so pressure by block and time of day becomes visible over the season |

## What you get

- Pressure map by block and hour
- Response log
- Damage assessment flight
- Deterrent schedule recommendation

## What the dashboard measures

- Responses per day
- Minutes of flock presence per block
- Damaged area at assessment
- Response time from detection

## Where it matters most

[Berries](/use-cases/permanent#soft-fruit-and-berries),
[orchards](/use-cases/permanent#orchards),
[maize](/use-cases/arable#maize),
[vineyards](/use-cases/permanent#vineyards).

## Build it

Habituation is the enemy of every deterrent ever invented, and it is the design
constraint here. Anything predictable stops working: same time, same path, same
sound, same interval. The system's advantage over a gas gun is that it can be
**genuinely irregular** and only present when birds are.

### The trigger, which is most of the system

| Component | Choice | Cost |
|---|---|---|
| Block cameras | 2 to 4 fixed cameras per block, wide angle, mains or solar | €80 to €250 each |
| Detection | Motion first, then a small bird-flock classifier on the moving regions | free |
| Acoustics, optional | Directional microphone plus a flock-call classifier. Cheap and works in poor light | €60 |
| Compute | One Pi or Jetson per block, or one per site over PoE | €80 to €250 |

Run the detector at the edge. Uploading video from a berry field over LTE all
day is a bandwidth bill with no upside.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Fixed cameras, PoE or solar | The trigger | [Reolink](https://reolink.com), [Axis](https://www.axis.com) for the durable option | [B&H](https://www.bhphotovideo.com) | €80 to €400 each |
| Edge compute | Detection without a video uplink | [Raspberry Pi 5](https://www.raspberrypi.com/products/raspberry-pi-5/) plus [AI Kit](https://www.raspberrypi.com/products/ai-kit/) at [BerryBase](https://www.berrybase.de) | [The Pi Hut](https://thepihut.com) | €120 to €200 |
| Small fast airframe | Response time matters more than endurance | 5 inch or 7 inch class, [Globe Flight](https://www.globe-flight.de) | [GetFPV](https://www.getfpv.com) | €300 to €800 |
| Dock per block | Nobody is going to launch it by hand for six weeks | See [docks](/build/docks) | | €2,000 DIY to €35,000 |
| Deterrent payload | Sound, light, or a silhouette. Vary all of them | speaker plus amplifier, or a kite silhouette | same | €50 to €300 |
| Solar and battery | Blocks rarely have power where you need it | [Victron](https://www.victronenergy.com) via [Antratek](https://www.antratek.de) | [RobotShop](https://www.robotshop.com) | €300 to €900 |

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Flock detection | Background subtraction, then a small classifier on the moving regions | OpenCV BSD, own model | commercial bird radar |
| Dispatch | Pick the nearest ready aircraft, pick an approach from the flock's bearing | own code | |
| Path variation | Randomised approach, altitude and pattern within a safe envelope | own code | |
| Response log | Every launch, its trigger, its duration and the outcome | this repo | |
| Pressure analytics | Presence minutes per block per hour, across the season | this repo | |
| Damage assessment | A scouting flight after ripening, counting damaged fruit | [yield forecasting](/features/yield-forecasting) stack | |

### The legal and neighbourly constraints

- Deterring birds is regulated. Protected species may not be harmed, hunting
  and nature protection law applies, and in Germany the rules differ by state.
  Get the local position in writing before you install anything.
- Automated launch on detection is an autonomous flight. Under EU rules that
  puts you in the Specific category unless a pilot is present and in control.
  See [Regulation](/build/regulation).
- The selling point over a gas gun is partly that the neighbours stop
  complaining. Keep the acoustic payload modest and log it, or you have
  reinvented the problem with a battery.

### Cost efficiency

- **The cameras are the product, the drone is the actuator.** A pressure map
  from fixed cameras alone tells a grower where and when to concentrate
  whatever deterrent they already own. Ship that first: it is a tenth of the
  cost and most of the value.
- **Blocks, not farms.** Bird pressure is concentrated. Instrument the two
  blocks that get hit, not the holding.
- **Six weeks a year.** Design for install and removal in a day, and rent the
  kit seasonally.

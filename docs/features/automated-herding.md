# Automated livestock herding

> Move the mob without the quad and the gate

A drone walks a mob from one grazing block to another on a route you approved,
inside limits you set, and stops if it cannot do it calmly.

| | |
|---|---|
| Category | Act |
| Slug | `automated-herding` |
| Cadence | Whenever the rotation is due, proposed overnight and authorised in the morning |
| Payload | Zoom RGB, radiometric thermal, directional speaker, RTK |
| Needs a visit first | Yes. A route survey and a licence check come first |

Watch it work on [the playground](https://openfarm.ing/playground/herding), where the same
controller that would fly the aircraft is run against a modelled paddock.

## The problem

Every rotational grazier's day has a move in it: fresh cover, a gate, a mob
that would rather stay. It is twenty minutes and two people on a good day, and
on a bad one it is an animal on a road at six in the morning after a fence has
gone down. The blocks furthest from the yard get moved late for the same reason
they get checked least.

## How it works

| Step | What happens |
|---|---|
| Plan | A route is drawn from the block the mob is on, through the gate, onto the block it is going to, with the ground it must be kept off marked |
| Authorise | You look at the route and say yes. That freezes the limits the move is flown under and opens a window it has to happen in |
| Drive | The aircraft works behind the mob at a set distance, climbing to take pressure off rather than pressing harder when they quicken |
| Answer for it | The record says how close it came, how fast they moved, how high it had to work and who was left behind |

## What you get

- An approved route per move
- Head count on arrival
- A straggler list, so somebody walks out to whoever stayed
- A welfare record per move
- A grazing rotation log

## What the dashboard measures

- Closest the aircraft came, against its standoff
- Fastest the mob moved, against its limit
- Minutes under pressure
- Animals left behind per move
- Moves stopped, and why

## Where it matters most

[Dairy and grazing](/use-cases/livestock#dairy-and-grazing-livestock),
[grassland](/use-cases/livestock#grassland-and-silage),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

This is the only capability in the catalog that acts on live animals, and that
one fact decides the whole build. Everything else here scans ground or treats
it. Get a weed map wrong and you spray four hectares you did not need to. Get
this wrong and you have run somebody's in-calf heifers through a fence.

### Welfare law is the specification, not the caveat

In Germany §3 of the Tierschutzgesetz forbids driving an animal beyond its
capacity or causing it avoidable distress. Equivalent duties exist across the
EU and in the UK. "The software was careful" is not an answer to that, so the
limits have to be named, agreed to, recorded and answerable:

| Limit | What it is | Why it is that |
|---|---|---|
| Standoff | Slant range from the aircraft to the nearest animal | Slant, not ground distance, because that is what the animal experiences. 25 m works for cattle used to machinery; ewes with lambs need 40 |
| Mob speed | The pace above which they are no longer walking | A walk is about 1.2 m/s and a trot about 2.5. Driving stock at a trot costs condition, injures them on hard ground and separates lambs from ewes |
| Drive duration | How long a mob may be under pressure at all | Twenty minutes is a long way. Past it the move stops, finished or not |
| Altitude | A floor and a ceiling | The floor is where the mob starts reacting to the airframe rather than to the pressure. The ceiling is the Open category's 120 m, not the aircraft's |
| Distress | How much of the mob may be agitated | Read off individual animals, not the mob average. See below |

The envelope is copied onto the move record when a person authorises it, rather
than read from configuration when the aircraft launches. A settings change next
month must not be able to rewrite what somebody agreed to, and an audit a year
from now has to read the same figures they saw.

### Three phases, because a cron entry must not be able to fly this

A herding move is planned automatically, authorised by a person, and only then
flown, inside a window. The nightly job can propose and nothing else. There is
no code path from the scheduler to an aircraft over livestock.

An authorisation lapses if nothing acts on it. Somebody agreeing to a drone
working their stock at seven in the morning has not agreed to it happening at
dusk.

### The controller is stockmanship, not path planning

Two ideas do nearly all the work, and both are older than drones.

The **flight zone** is the radius inside which an animal moves away from you and
outside which it ignores you. Pressure is applied by entering it and released by
leaving. The **point of balance** is why the pressure has to come from the side
you want them to leave: stock move away from pressure applied behind the
shoulder, so the aircraft belongs behind the mob relative to where it is going,
never above it and never in front.

Three consequences a naive implementation gets wrong:

- **Pushing harder does not make a mob move better.** Past a point it makes them
  run, and a running mob splits. The correct response to a mob that has speeded
  up is to back off, which reads backwards until you have watched it happen.
- **Height is the better pressure release.** Backing away horizontally gives up
  the point of balance and the mob stops walking. Climbing sheds pressure while
  holding station, and takes the rotor noise up with it. So the controller
  climbs first and gives ground only when climbing has not been enough. This is
  the one thing a drone can do that a drover cannot, and it is worth building
  the whole standoff rule in slant range to get it.
- **The mob is led by its slowest member.** Anchoring on the middle of the mob
  walks the front half away and leaves the back half standing, which is how you
  arrive two short.

### Read animals, not averages

A hundred head walking at a perfectly legal pace with one animal bolting inside
them averages out to a compliant move. The one animal is the one that goes
through a fence, and if it is a ewe it takes her lambs with it. By the time the
average crosses a threshold the mob is already running.

So every animal is scored on how it is moving, from three signals that are only
meaningful together:

| Signal | What it catches | Why not on its own |
|---|---|---|
| Speed relative to the mob | One animal at twice everybody else's pace | A mob trotting downhill together is not distress |
| Turn rate | An animal changing its mind: turning, checking, turning back | An animal standing still and looking around is fine |
| Moving away from the mob | The beginning of a split. Stock under threat bunch | An animal walking sideways is still with the mob |

Measure against the **median** of the mob, not the mean. The mean is dragged up
by exactly the animals you are looking for, so a mob with several of them
quietly raises its own bar and stops detecting any of them.

### Hardware

| Item | Why | EU source | US source | Indicative |
|---|---|---|---|---|
| Airframe with 35+ minute endurance | A move plus the transit either side | [Holybro X500 V2](https://holybro.com/products/x500-v2-kits) | [GetFPV](https://www.getfpv.com) | €500 to €4,000 |
| Zoom RGB camera | Counting a mob at 60 m and reading a tag at 15 are different jobs | [Sony FCB block camera](https://pro.sony) modules | [B&H](https://www.bhphotovideo.com) | €600 to €2,500 |
| Thermal | Finds the animal in the hedge that the count says is missing | [InfiRay](https://www.infiray.com) module | [FLIR Boson](https://www.flir.com/products/boson/) | €900 to €4,000 |
| Directional speaker | A mob responds to sound at a distance where it would ignore an airframe, which is what buys the standoff | Horn driver plus amplifier, built in house | | €150 to €600 |
| LTE link | The abort has to reach the aircraft, and the record has to leave the field | [Teltonika RUTX11](https://teltonika-networks.com/products/routers/rutx11) | [SparkFun](https://www.sparkfun.com) | €150 to €250 |
| Integrated alternative | Zoom, thermal, RTK, speaker, dock support | [DJI Matrice 4T](https://enterprise.dji.com) via [Solectric](https://www.solectric.de) | [Advexure](https://advexure.com) | €9,000 to €15,000 |

The speaker earns its place more than anything else on that list. It is the
cheapest item and it is what lets the aircraft work at 25 m instead of 10.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Tracking | Detection and track association across frames, per animal | Apache-2.0 models | commercial livestock tracking |
| Distress | Speed against the mob median, turn rate, outward motion | own code | |
| Control | Standoff and altitude off the point of balance, weighted to the rearmost animal | this repo | |
| Envelope | Every limit checked each tick, with a grace period per limit | this repo | |
| Simulator | A modelled paddock the controller is regression tested in | this repo | |

The simulator is not a nice-to-have. A controller that cannot be replayed has
no business near livestock, so nothing in the control path may use a clock or a
random number: same seeds, same run, every time. It is published at
[the playground](https://openfarm.ing/playground/herding) precisely so the claim can be checked
rather than taken on trust, and one of the scenarios there is built for the
controller to fail.

### Cost efficiency

- **Visual line of sight first, dock second, beyond line of sight third.** The
  same order as [the livestock patrol](/features/livestock-and-fences), for the
  same reason: each step multiplies the regulatory cost.
- **Herding rides on the patrol's aircraft.** Same airframe, same zoom and
  thermal, one extra payload. If you have built for
  [livestock and fences](/features/livestock-and-fences), this is a speaker and
  software.
- **The gates are a one-off survey.** Route planning is cheap once somebody has
  walked the holding and recorded where the fences open and what the stock must
  be kept off. Until that is done the planner assumes the gate is midway between
  two blocks and says on the plan that it is assuming.
- **Sell the record, not the labour saved.** The twenty minutes is real, but
  what a farmer is buying is a move that is answerable: what it did, against
  what it was allowed to do, on every mob, every time.

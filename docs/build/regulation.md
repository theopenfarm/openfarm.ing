# Regulation

Two separate bodies of law shape this platform, and confusing them is the most
common mistake in drone agriculture marketing.

| Body | Governs | Decides |
|---|---|---|
| **Aviation law** | Flying the aircraft | Where, when, how high, how heavy, and whether a pilot must be watching |
| **Plant protection law** | Applying products | Whether anything may be sprayed from the air at all |

An aircraft can be perfectly legal to fly and still not permitted to spray.

**This page is orientation, not legal advice.** The rules change, they differ by
member state and by German federal state, and the authoritative sources are
EASA, your national aviation authority and the relevant plant protection
authority. Get your own position confirmed in writing before you sell a flight.

## Aviation: the EU framework

Regulation (EU) 2019/947 and 2019/945 apply across the EU and EEA. Three
categories:

| Category | Means | Typical for us |
|---|---|---|
| **Open** | Low risk, no authorisation needed, but strict limits | Most scouting flights, in visual line of sight, under 25 kg |
| **Specific** | Risk assessed and authorised, or a standard scenario | BVLOS, docks, automated launch, over 25 kg |
| **Certified** | Aircraft and operator certified like manned aviation | Not relevant here |

### Open category subcategories

| Subcategory | Aircraft | Where |
|---|---|---|
| A1 | Under 250 g, or C0/C1 class marked | Over people is limited, never over assemblies |
| A2 | C2 class marked, under 4 kg | Close to uninvolved people, with a horizontal distance |
| A3 | Under 25 kg | Far from people, buildings and infrastructure. **This is where most field work sits** |

A3 is the practical home of agricultural scouting: an open field, away from
people and structures. It requires the online training and the A1/A3 test. A2
needs an additional certificate of competency, obtained at a recognised entity.

### What always applies in the Open category

- Visual line of sight at all times, with an unaided view of the aircraft.
- Maximum 120 m above the surface, with terrain-following adjustments.
- Operator registration and the registration number displayed on the aircraft
  and loaded into the remote identification system.
- Remote identification, where required by class.
- No flying over assemblies of people.
- Airspace restrictions and geographical zones respected. In Germany these are
  published as UAS geographical zones and are the practical daily constraint
  near airfields, nature reserves and infrastructure.

### Night flight

Permitted in the Open category with a **green flashing light** on the aircraft.
This matters directly: the
[wildlife search](/features/wildlife-rescue) happens before sunrise and the
whole capability depends on it.

### When you leave the Open category

Any of these puts the operation in the **Specific** category:

| Trigger | Capability affected |
|---|---|
| Beyond visual line of sight | [Livestock patrols](/features/livestock-and-fences), large area survey |
| Unattended or automated launch | [The autonomous network](/features/autonomous-network), [bird deterrence](/features/bird-deterrence) |
| Aircraft over 25 kg | [Seeding](/features/drone-seeding), spraying |
| Over uninvolved people, or in a controlled zone | Varies |

The Specific category route is either a **standard scenario** (STS), where you
declare against a predefined scenario and use a class-marked aircraft, or an
**operational authorisation** based on a SORA risk assessment, granted by the
national authority. In Germany that is the Luftfahrt-Bundesamt.

Budget time, not just money. Preparing an authorisation is weeks of work and
the review takes longer. Fly the visual line of sight version first, prove the
product, and build the authorisation case with real operational data behind it.

### Insurance

Third-party liability insurance is **mandatory** for UAS operations in Germany.
Cover scales with mass and the nature of the operation. Arrange it before the
first flight, including flights you are not charging for.

## Plant protection: why the drone does not spray

In Germany, the Pflanzenschutzgesetz prohibits aerial application of plant
protection products by default. §18 sets out that prohibition and the narrow
exemption route. The most prominent case where exemptions are granted is
**steep vineyard terrain**, where ground machinery cannot work safely, which is
precisely the terrain in [the vineyard use case](/use-cases/permanent#vineyards).

Three consequences for the product:

1. **The default deliverable is a prescription map**, loaded into a machine
   that is already permitted to treat the field. That is how
   [targeted weed control](/features/targeted-weed-control) and
   [precision fertilisation](/features/precision-fertilisation) are built.
2. **The equipment is regulated too.** Application devices are subject to
   approval and periodic inspection requirements, and drift-reducing equipment
   is listed by the responsible authority. A spray drone is not outside that
   regime because it flies.
3. **Do not buy a spray aircraft speculatively.** Buy it against a named
   customer with a specific exemption and recognised equipment.

Fertiliser is a different regime from plant protection, and **seed is neither**.
[Drone seeding](/features/drone-seeding) is not restricted by §18. Aviation
rules still apply in full, and a loaded hopper aircraft is usually over 25 kg.

## Fertiliser, and the cap you must encode

The Düngeverordnung sets nitrogen application limits and documentation duties,
with tighter limits in nitrate-designated areas. Variable rate application
moves nitrogen **within** a field's total; it does not raise the total.

Encode it as a hard constraint on the prescription optimiser, not as a warning.
See [Prescriptions](/build/software/prescriptions#legal-constraints-to-encode).

## Wildlife and nature protection

| Topic | Position |
|---|---|
| Fawn searches before mowing | The duty to take reasonable precautions before mowing sits with whoever runs the mower. A drone search with a coverage record is evidence that it was discharged |
| Handling animals | Coordinate with the hunting tenant. Rules on approaching and handling wildlife apply, and a found fawn is handled without human scent |
| Bird deterrence | Protected species may not be harmed. Permitted deterrent methods, breeding seasons and required consents vary by German federal state |
| Flying over habitat | Nature reserves are frequently UAS geographical zones, and separate nature protection rules can restrict flying during breeding seasons. Relevant to [restoration work](/use-cases/operators#reforestation-and-land-restoration) |

Germany has run federal support programmes for fawn rescue drones. The terms
change year to year, so check the current programme before you build a purchase
on it.

## Data protection

Aerial imagery is personal data whenever people, vehicles or private property
are identifiable in it.

| Practice | Why |
|---|---|
| Fly the field, not the farmyard | The simplest way to avoid the question |
| Clip published imagery to the field boundary | A stitch always overflies the edges, and the neighbour's ground is not yours to publish. The [field map](/guide/field-map#imagery-and-why-bounds-matter) does exactly this |
| State retention in the contract | How long raw frames are kept, and what is deleted |
| Name the processor | If any processing runs on somebody else's infrastructure, say so |
| Blur or discard incidental capture | People and vehicles caught in transit frames |

## The compliance record to keep from day one

Because an authority, an insurer or a customer's auditor will ask, and because
it is far cheaper to record than to reconstruct.

| Record | Kept per |
|---|---|
| Operator registration and pilot competences | Operator, pilot |
| Insurance certificate | Operator |
| Airspace and zone check, with the result | Flight |
| Landowner and neighbour consent | Site |
| Preflight checklist, timestamped | Flight |
| Flight log, including aborts and weather calls | Flight |
| Maintenance log, hours, battery cycles | Airframe, battery |
| Incident reports | Incident |
| Search coverage proof | Wildlife flight |
| Prescription and as-applied record | Field, pass |

Most of that already has a home in this repository's
[flight record](/guide/architecture#the-domain-model). Extending it is
cheaper than a spreadsheet somebody maintains by hand.

## Non-EU operations

The structure differs but the shape repeats: an operator registration, a pilot
qualification, a visual line of sight default, an exception process for BVLOS
and automated operation, and a separate regime governing aerial application of
pesticides. In the United States the aviation half is Part 107 with waivers,
and aerial application requires its own certification. Check the specifics for
each market before selling into it.

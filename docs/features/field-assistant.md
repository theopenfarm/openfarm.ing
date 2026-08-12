# Field decision assistant

> A recommendation, not another image folder

The assistant reads every layer for a field and answers in plain language: what
is wrong, where, and by when.

| | |
|---|---|
| Category | Operate |
| Slug | `field-assistant` |
| Cadence | After every flight, plus a weekly farm level brief |
| Payload | **No flight of its own.** It reasons over the whole field record |
| Needs a visit first | No |

## The problem

More sensing produces more imagery, and imagery is not a decision. A folder of
index maps and a change layer still leaves somebody to work out whether the
yellow patch in the north west matters this week, and what to do about it
before Thursday.

## How it works

| Step | What happens |
|---|---|
| Read | Every layer for the field is read together: imagery, weather, soil, machine records and your own notes |
| Reason | Findings are weighed against growth stage and forecast, so a flag in June is not treated like the same flag in April |
| Recommend | You get a written recommendation naming the area, the likely cause, the action and the window |
| Follow up | Every recommendation is tracked, and the next flight reports whether it worked |

## What you get

- Written recommendations per field
- Priority order across the farm
- Evidence links back to the source flight
- Outcome tracking per recommendation

## What the dashboard measures

- Open recommendations by priority
- Recommendations acted on
- Outcome after action
- Average lead time on a window

## Where it matters most

[Winter wheat](/use-cases/arable#winter-wheat-and-barley),
[maize](/use-cases/arable#maize),
[potatoes](/use-cases/arable#potatoes),
[vineyards](/use-cases/permanent#vineyards),
[cooperatives](/use-cases/operators#cooperatives-and-large-estates).

## Build it

### Rules first. This is not primarily a language model product

The reasoning that matters here is agronomic and mostly deterministic:

```
IF   disease change layer shows > 0.3 ha diverging
AND  crop is winter wheat at GS 37 to 59
AND  the next 5 days carry an infection risk
THEN recommend a protective fungicide window, priority high, by <date>
```

That rule is auditable, testable, explicable to an adviser, and it runs in
microseconds. Build twenty of them per crop with an agronomist and you have
most of the product. A model that generates the same sentence without the rule
behind it is a liability, because nobody can say why it said that.

The sensible division of labour:

| Job | Do it with |
|---|---|
| Deciding whether something matters | Rules over measured layers, with thresholds per crop and growth stage |
| Prioritising across the farm | Scoring: area times severity times time-criticality |
| Turning a finding into readable prose | A language model, constrained to the retrieved facts |
| Translating the brief | A language model, or the site's own translation pass |
| Answering "why do you think that" | The evidence links, not the model |

### If you do use a language model

| Concern | Approach |
|---|---|
| Grounding | Retrieval over the field record only. The model composes, it does not decide |
| Determinism | The same field record must produce the same recommendation. Generate the decision with rules, the wording with the model |
| Hosted or local | A hosted API is cheaper per token than running a GPU until volume is high, and better at prose. Open-weight models run locally on the same box that does inference, keep customer data in house, and cost nothing per call |
| Data protection | Farm data is commercially sensitive and may be personal data. Whatever you choose, put it in the customer contract explicitly |
| Cost control | One brief per field per flight, one per farm per week. Cache aggressively. This is a small number of generations per day, not a chat product |

Whichever provider you use, keep the boundary clean: an interface with one
implementation per backend, prompts and schemas in version control, and every
generated brief stored with the record set that produced it. That way switching
model, or dropping to rules-only prose, is a configuration change rather than a
rewrite.

### In-house software

| Stage | What we run | Licence | Replaces |
|---|---|---|---|
| Field record assembly | One structured document per field per date, from the layers already stored | this repo | |
| Growth stage tracking | Thermal time from [DWD open data](https://opendata.dwd.de), corrected by observation | own code | paid agronomy platforms |
| Rule engine | Declarative rules per crop, versioned, with tests | own code | |
| Prioritisation | Explicit scoring function, tunable per farm | own code | |
| Generation | Constrained prose from the retrieved facts | provider of choice | |
| Outcome tracking | Every recommendation gets an outcome after the next flight | this repo | |

### The feedback loop is the moat

Recommendation, action, next flight, outcome. Recorded every time, that loop is
the only asset in this platform that a competitor cannot buy: it says which
recommendations actually worked, on which crops, in which conditions. Build the
outcome capture before the recommendation generator, not after.

### Cost efficiency

- **Twenty rules beat a clever model.** They cost an agronomist's afternoon
  each and they never hallucinate a growth stage.
- **Growth stage from free weather data.** Thermal time is arithmetic over DWD
  temperature series. Every threshold in the rule set depends on it.
- **One brief per flight, one per week.** Generation cost is trivial at that
  cadence, whichever backend you pick. Do not build a chat interface: nobody
  wants to interrogate their field at 05:00, they want the three things that
  matter.
- **Never recommend a product, recommend a window and a reason.** Product
  choice carries liability and is the adviser's job. "Protective window closes
  Thursday, 2.3 ha affected, here is the evidence" is useful and defensible.

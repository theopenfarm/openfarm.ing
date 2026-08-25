/**
 * The one place a herding move's state machine lives.
 *
 * Every other status column on this platform is a label a handler sets. This
 * one is a gate. `flying` means a drone is pushing somebody's animals across a
 * field, and the only legitimate way into it is through an authorisation a
 * person gave, inside the window they gave it for. An endpoint that could set
 * it directly would make the authorisation decorative, so no endpoint sets
 * status: they call `transition()` and it either allows the move or says why
 * not.
 *
 *   planned ─── authorise ──▶ authorised ─── start ──▶ flying ─── finish ──▶ complete
 *      │                          │                       │
 *      │                          ├── expire ──▶ expired  └── abort ──▶ aborted
 *      └── reject ──▶ rejected    └── abort ──▶ aborted
 *
 * `complete`, `aborted`, `expired` and `rejected` are terminal. A move that
 * happened is a welfare record answerable to a regulator, so nothing reopens
 * it; the next move is a new row.
 */

export type MoveStatus
  = | 'planned'
    | 'authorised'
    | 'flying'
    | 'complete'
    | 'aborted'
    | 'expired'
    | 'rejected'

export type MoveAction = 'authorise' | 'reject' | 'start' | 'finish' | 'abort' | 'expire'

const TRANSITIONS: Record<MoveAction, { from: MoveStatus[], to: MoveStatus }> = {
  authorise: { from: ['planned'], to: 'authorised' },
  reject: { from: ['planned'], to: 'rejected' },
  start: { from: ['authorised'], to: 'flying' },
  finish: { from: ['flying'], to: 'complete' },
  // Abortable from both sides of the launch: a farmer who changes their mind
  // between authorising and the aircraft leaving the dock is the commonest
  // case, and it must not require waiting for it to take off first.
  abort: { from: ['authorised', 'flying'], to: 'aborted' },
  expire: { from: ['authorised'], to: 'expired' },
}

export const TERMINAL: MoveStatus[] = ['complete', 'aborted', 'expired', 'rejected']

/**
 * How each refusal is worded, and what to do instead.
 *
 * Spelled out per action rather than built from the action name. Appending "d"
 * gets `authorised` right and `abortd`, `startd` and `finishd` wrong, and the
 * string goes straight to a farmer. The second half of each line matters more
 * than the first: somebody refused an action wants telling which one to use.
 */
const REFUSALS: Record<MoveAction, { verb: string, instead: string }> = {
  authorise: { verb: 'authorised', instead: 'Only a planned move can be authorised.' },
  reject: { verb: 'rejected', instead: 'Only a planned move can be rejected.' },
  start: { verb: 'started', instead: 'A move has to be authorised before it can fly.' },
  finish: { verb: 'finished', instead: 'Only a move that is flying can be finished.' },
  abort: { verb: 'stopped', instead: 'A move that has not been authorised yet is rejected rather than stopped.' },
  expire: { verb: 'expired', instead: 'Only an authorised move can lapse.' },
}

export function isTerminal(status: string): boolean {
  return TERMINAL.includes(status as MoveStatus)
}

export interface TransitionResult {
  ok: boolean
  status: MoveStatus
  /** Present when the transition was refused. Safe to show a farmer. */
  error?: string
}

/**
 * Apply an action to a status.
 *
 * Returns rather than throws: every caller is an HTTP handler that has to turn
 * the refusal into a response anyway, and a thrown error here would be caught
 * and rewritten at every one of them.
 */
export function transition(from: string, action: MoveAction): TransitionResult {
  const rule = TRANSITIONS[action]
  const status = from as MoveStatus

  if (!rule)
    return { ok: false, status, error: `Unknown action: ${action}.` }

  if (isTerminal(status))
    return { ok: false, status, error: `This move is already ${status} and cannot change.` }

  if (!rule.from.includes(status)) {
    const refusal = REFUSALS[action]
    return {
      ok: false,
      status,
      error: `A move cannot be ${refusal.verb} while it is ${status}. ${refusal.instead}`,
    }
  }

  return { ok: true, status: rule.to }
}

/**
 * Has an authorisation lapsed?
 *
 * Somebody agreed to a drone working their stock at seven this morning. That
 * is not consent to it happening at dusk, so an authorised move that has not
 * started by `expires_at` becomes `expired` rather than flying late.
 *
 * `now` is a parameter rather than a `Date.now()` call so the rule can be
 * tested against fixed instants, the same discipline the rest of the herding
 * modules keep.
 */
export function hasExpired(move: { status?: unknown, expires_at?: unknown }, now: Date): boolean {
  if (String(move.status ?? '') !== 'authorised')
    return false

  const expires = move.expires_at ? new Date(String(move.expires_at)) : null
  if (!expires || Number.isNaN(expires.getTime()))
    return false

  return expires.getTime() <= now.getTime()
}

/**
 * How long an authorisation is good for, in minutes.
 *
 * Short enough that it means "now, while I am here", long enough to cover a
 * dock launch, the transit and the drive itself. A farmer who wants tomorrow
 * morning authorises it tomorrow morning.
 */
export const AUTHORISATION_WINDOW_MINUTES = 90

export function expiryFrom(now: Date, minutes = AUTHORISATION_WINDOW_MINUTES): string {
  return new Date(now.getTime() + minutes * 60_000).toISOString()
}

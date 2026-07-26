import DemoRequest from '../Models/DemoRequest'

/**
 * What a signed-in farmer has with us.
 *
 * Today that is the field visits they have asked for, matched on the address
 * they signed in with. Accounts and demo requests are separate records on
 * purpose: a farmer books a visit long before anyone signs up, and the visit
 * should still be theirs when they do. The email is the join.
 */
export interface Visit {
  farmName: string
  summary: string
  status: string
  requestedOn: string
}

/** Rendered date, in the neutral form every locale on this site reads. */
function requestedOn(value: unknown): string {
  if (!value)
    return ''

  const date = new Date(String(value))
  if (Number.isNaN(date.getTime()))
    return ''

  return date.toISOString().slice(0, 10)
}

export async function visitsFor(email: string): Promise<Visit[]> {
  if (!email)
    return []

  try {
    const rows = await DemoRequest.where('email', email).orderByDesc('created_at').get()

    return rows.map(row => ({
      // A visit booked without a farm name is still a visit; the address it
      // was booked with is the next best label for it.
      farmName: String(row.farm_name || email),
      summary: [row.segment, row.hectares ? `${row.hectares} ha` : ''].filter(Boolean).join(' · '),
      status: String(row.status || 'new'),
      requestedOn: requestedOn(row.created_at),
    }))
  }
  catch {
    // The account page's job is to show who is signed in. A query that fails
    // should cost the visitor a panel, not the page.
    return []
  }
}

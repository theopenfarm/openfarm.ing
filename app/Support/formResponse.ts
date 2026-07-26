/**
 * Answering a form post the way the submitter asked to be answered.
 *
 * These endpoints are hit two ways: by `fetch` (which wants JSON) and by a
 * plain browser form submit (which wants to end up back on a page, not
 * staring at a JSON body). The distinguishing signal is the Accept header a
 * browser form sends: `text/html` first, and no `application/json`.
 *
 * Server-rendered redirects rather than client-side state on purpose. stx's
 * event directives bind inside client-rendered subtrees, not on server-
 * rendered markup, so an `@submit` handler on these forms never attaches;
 * and a marketing form that only works once a client bundle has hydrated is
 * a form that fails on the connection a farmer actually has.
 */
export function wantsHtml(request: unknown): boolean {
  // Deliberately structural and defensive: the request object differs between
  // the router's RequestInstance and a bare Request, and this only ever needs
  // one header off whichever one it was handed.
  const req = request as {
    header?: (name: string) => string | undefined
    headers?: { get?: (name: string) => string | null, accept?: string }
  }

  const accept = String(
    req?.header?.('accept')
    ?? req?.headers?.get?.('accept')
    ?? req?.headers?.accept
    ?? '',
  ).toLowerCase()

  if (!accept)
    return false

  return accept.includes('text/html') && !accept.includes('application/json')
}

/**
 * 303 so the browser re-issues the follow-up as a GET: a refresh on the
 * result page must not repost the form.
 */
export function seeOther(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location } })
}

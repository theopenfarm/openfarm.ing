import { Auth } from '@stacksjs/auth'

/**
 * Who is signed in, for a server-rendered page.
 *
 * A `<script server>` block never sees the Request. What it does get is
 * `globalThis.requestContext`, which Stacks fills from a per-request snapshot,
 * so the cookie read here belongs to the request being rendered. The token in
 * that cookie is the same personal access token the API issues, so this is one
 * lookup against the same table `Auth` validates bearer tokens against: a
 * revoked token stops working on the next page load, everywhere.
 */
export interface SignedInFarmer {
  id: number
  name: string
  email: string
}

/** The cookie `@stacksjs/auth` writes by default. */
const COOKIE = 'stacks_auth'

/**
 * The signed-in farmer, from a request that carries the login cookie.
 *
 * `currentUser()` reads the ambient context stx sets while rendering a page,
 * which exists only inside the frontend process. An Action runs in the API
 * process, where there is no such context — every dashboard mutation therefore
 * looked signed-out and bounced to /login. This takes the request it was
 * given instead, so the same session works from either side.
 */
export async function userFromRequest(request: { headers?: Headers } | null | undefined): Promise<SignedInFarmer | null> {
  const header = request?.headers?.get?.('cookie') ?? ''
  const token = readCookie(header, COOKIE)

  if (token) {
    const user = await resolve(token)
    if (user)
      return user
  }

  // Fall back to the render-time context, so a helper called from a page keeps
  // working exactly as before.
  return currentUser()
}

/** Pull one cookie out of a Cookie header. */
function readCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name)
      return decodeURIComponent(rest.join('='))
  }

  return null
}

async function resolve(token: string): Promise<SignedInFarmer | null> {
  try {
    const user = await Auth.getUserFromToken(token)
    if (!user?.id)
      return null

    return {
      id: Number(user.id),
      name: String((user as { name?: unknown }).name ?? ''),
      email: String((user as { email?: unknown }).email ?? ''),
    }
  }
  catch {
    return null
  }
}

export async function currentUser(): Promise<SignedInFarmer | null> {
  const context = (globalThis as { requestContext?: { cookie?: (name: string) => string | null } }).requestContext
  const token = context?.cookie?.(COOKIE)

  if (!token)
    return null

  try {
    const user = await Auth.getUserFromToken(token)
    if (!user?.id)
      return null

    return {
      id: Number(user.id),
      name: String(user.name ?? ''),
      email: String(user.email ?? ''),
    }
  }
  catch {
    // A page must not 500 because a cookie is stale or the token table is
    // briefly unavailable. Signed out is the safe reading of "cannot tell".
    return null
  }
}

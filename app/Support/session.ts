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

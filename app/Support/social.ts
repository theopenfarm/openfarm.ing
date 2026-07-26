import { config } from '@stacksjs/config'
import { AppleProvider, GoogleProvider } from '@stacksjs/socials'

/**
 * Google and Apple sign-in, wired to this site.
 *
 * The providers themselves are the framework's (`@stacksjs/socials`): the
 * auth URLs, the token exchange, Apple's signed-JWT client secret. This
 * module holds the three things that are the application's business — which
 * providers this deployment actually has credentials for, the `state` cookie
 * that makes the callback safe, and the redirect URL, which has to match what
 * is registered with the provider exactly.
 */
export type ProviderName = 'google' | 'apple'

const PROVIDERS: ProviderName[] = ['google', 'apple']

/** The `state` cookie: short-lived, httpOnly, and per provider. */
const STATE_PREFIX = 'of_oauth_'

export function supportedProvider(value: string): ProviderName | null {
  return PROVIDERS.includes(value as ProviderName) ? (value as ProviderName) : null
}

/**
 * Where the provider sends the farmer back.
 *
 * The configured value wins, because that is the one registered with the
 * provider and it has to match to the character. Deriving it from the app URL
 * is the fallback, and it has to force a scheme: `app.url` is a bare host in
 * development (`openfarming.localhost`), and a redirect_uri without one is
 * rejected outright.
 */
function redirectUrl(name: ProviderName): string {
  const services = config.services as Record<string, Record<string, string> | undefined>
  const configured = services[name]?.redirectUrl

  if (configured)
    return configured

  const host = String(config.app?.url || 'openfarm.ing').replace(/\/$/, '')
  const site = /^https?:\/\//.test(host) ? host : `https://${host}`

  return `${site}/api/auth/${name}/callback`
}

/**
 * Whether this deployment can offer a provider at all.
 *
 * The buttons are rendered from this, so a site without credentials shows a
 * password form rather than a button that leads to a provider error page.
 */
export function providerConfigured(name: ProviderName): boolean {
  const services = config.services as Record<string, Record<string, string> | undefined>

  if (name === 'google')
    return Boolean(services.google?.clientId && services.google?.clientSecret)

  // Apple has no static secret: it signs a short-lived ES256 JWT per
  // exchange, so all four pieces have to be present.
  const apple = services.apple
  return Boolean(apple?.clientId && apple?.teamId && apple?.keyId && apple?.privateKey)
}

export function anyProviderConfigured(): boolean {
  return PROVIDERS.some(providerConfigured)
}

export function providerFor(name: ProviderName): GoogleProvider | AppleProvider | null {
  if (!providerConfigured(name))
    return null

  const services = config.services as Record<string, Record<string, string>>

  if (name === 'google') {
    return new GoogleProvider({
      clientId: services.google!.clientId!,
      clientSecret: services.google!.clientSecret!,
      redirectUrl: redirectUrl('google'),
    })
  }

  return new AppleProvider({
    clientId: services.apple!.clientId!,
    // The provider signs the client secret itself from the key material;
    // passing the private key through as the "secret" is the shape its
    // constructor expects.
    clientSecret: services.apple!.privateKey!,
    redirectUrl: redirectUrl('apple'),
    teamId: services.apple!.teamId!,
    keyId: services.apple!.keyId!,
    privateKey: services.apple!.privateKey!,
  } as ConstructorParameters<typeof AppleProvider>[0])
}

/**
 * The cookie carrying the OAuth `state` between the redirect and the
 * callback.
 *
 * Ten minutes, because that is a generous ceiling on how long a sign-in
 * takes and a short one on how long a stolen value stays useful. SameSite=Lax
 * so the cookie survives the provider's redirect back (a cross-site GET),
 * which `Strict` would drop, taking every sign-in with it.
 */
export function stateCookie(name: ProviderName, state: string): string {
  const secure = String(config.app?.env ?? '') === 'production' ? '; Secure' : ''
  return `${STATE_PREFIX}${name}=${encodeURIComponent(state)}; Path=/; Max-Age=600; HttpOnly; SameSite=Lax${secure}`
}

export function clearStateCookie(name: ProviderName): string {
  const secure = String(config.app?.env ?? '') === 'production' ? '; Secure' : ''
  return `${STATE_PREFIX}${name}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}`
}

/** The state this browser was given when it left for the provider. */
export function stateFromRequest(request: { headers: Headers }, name: ProviderName): string | null {
  const header = request.headers.get('cookie')
  if (!header)
    return null

  for (const pair of header.split(';')) {
    const index = pair.indexOf('=')
    if (index === -1)
      continue

    if (pair.slice(0, index).trim() !== `${STATE_PREFIX}${name}`)
      continue

    const value = decodeURIComponent(pair.slice(index + 1).trim())
    return value.length > 0 ? value : null
  }

  return null
}

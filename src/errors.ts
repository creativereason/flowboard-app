// Map backend errors to short, safe messages so raw database or auth
// internals (constraint names, SQL details) are never shown to users.
interface ErrorLike {
  message?: string
  code?: string
}

const isNetwork = (e: unknown) => e instanceof TypeError || /failed to fetch|network/i.test((e as ErrorLike)?.message ?? '')
const isSession = (e: unknown) => /jwt|expired|not authenticated/i.test((e as ErrorLike)?.message ?? '')

export function dataError(e: unknown, fallback: string): string {
  if (isNetwork(e)) return 'Network problem. Check your connection and try again.'
  if (isSession(e)) return 'Your session expired. Please sign in again.'
  return fallback
}

export function authError(e: ErrorLike): string {
  switch (e.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.'
    case 'email_not_confirmed':
      return 'Please confirm your email first, then sign in.'
    case 'weak_password':
      return 'That password is too weak or has appeared in a data breach. Try a longer, unique one.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Too many attempts. Please wait a few minutes and try again.'
    case 'signup_disabled':
      return 'Sign-ups are currently disabled.'
  }
  return isNetwork(e) ? 'Network problem. Check your connection and try again.' : 'Something went wrong. Please try again.'
}
